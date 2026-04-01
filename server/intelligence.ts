import OpenAI from "openai";
import type { IntelligenceContext, IntelligenceReport, TitledNote, ProcessedVoiceNote, ProcessingResult, ProofPanel } from "../shared/schema";
import { findUntitledNotes, updateNoteTitle, getUnprocessedVoiceNotes, getVoiceNoteContent, getProjectLookup, createTaskInNotion } from "./notion";

const client = new OpenAI();

// Cache for LLM response (10 min)
let cachedReport: { data: IntelligenceReport; ts: number } | null = null;
const LLM_CACHE_TTL = 1_800_000; // 30 minutes

export async function generateIntelligence(context: IntelligenceContext): Promise<IntelligenceReport> {
  if (cachedReport && Date.now() - cachedReport.ts < LLM_CACHE_TTL) {
    return cachedReport.data;
  }

  // Build prompt sections
  const goalsSection = context.goals.length > 0
    ? context.goals.map(g => `- ${g.name} (Status: ${g.status}, ${g.projectCount} linked projects)`).join("\n")
    : "No goals data available.";

  const projectsSection = context.projects.length > 0
    ? context.projects.map(p =>
        `- ${p.name} — Status: ${p.status}, Health: ${p.health}, Tasks: ${p.tasksDone}/${p.taskCount} done, ${p.tasksOverdue} overdue`
      ).join("\n")
    : "No project data available.";

  const completedTasks = context.recentTasks.filter(t => t.status === "Done");
  const inProgressTasks = context.recentTasks.filter(t => t.status !== "Done");

  const completedSection = completedTasks.length > 0
    ? completedTasks.map(t => `- ${t.name} (${t.type || "unclassified"})`).join("\n")
    : "None in last 14 days.";

  const inProgressSection = inProgressTasks.length > 0
    ? inProgressTasks.map(t => `- ${t.name} (${t.type || "unclassified"}, Status: ${t.status})`).join("\n")
    : "None tracked.";

  const voiceNotesSection = context.voiceNoteThemes.length > 0
    ? context.voiceNoteThemes.map(v => `- "${v.name}" (${v.date}): ${v.summary || "No summary available"}`).join("\n")
    : "No recent voice notes.";

  const prompt = `You are a personal intelligence advisor analyzing a professional's second brain data. Your role is to synthesize patterns across goals, projects, tasks, and voice notes to produce ONE clear, actionable recommendation for what to focus on next.

The user is Jake, based in Western Australia. He's a licensed electrician transitioning into a Business Improvement Principal role in the mining industry. He values clarity, efficiency, and reducing anxiety through organisation. He uses Notion as his second brain with the Ultimate Brain template.

Here is his current data:

GOALS (what he's working towards):
${goalsSection}

PROJECTS (active initiatives with health scores):
${projectsSection}

RECENT TASKS (last 14 days):
Completed:
${completedSection}

In Progress:
${inProgressSection}

TODAY'S SITUATION:
- ${context.todayDueCount} tasks due today
- ${context.overdueCount} overdue tasks
- ${context.completedYesterdayCount} completed yesterday

RECENT VOICE NOTE THEMES (what's on his mind):
${voiceNotesSection}

Based on ALL of this data, provide:

1. PRIMARY FOCUS: The ONE thing Jake should focus on today and why. Be specific — name the exact project, task, or action. Explain how it connects to his goals.

2. PATTERN INSIGHT: One non-obvious pattern you see across his data — something connecting different areas he might not have noticed. For example, if multiple voice notes and tasks point to the same underlying theme.

3. RISK FLAG: The most important thing at risk of slipping — a project losing momentum, a goal with no recent activity, or overdue items that compound.

4. MOMENTUM WIN: Something he's done well recently that he should build on. Name the specific accomplishment and how to leverage it.

5. WEEKLY PRIORITY: Looking at his goals and project health, what should be his #1 priority this week beyond today?

6. SYSTEM AUDIT: Act as a strategic advisor auditing the structural integrity of Jake's second brain. For EACH project and goal, evaluate honestly:
   - Is this actually a project (defined outcome, concrete tasks, timeline)? Or is it an idea/aspiration disguised as a project?
   - Should any projects be demoted to goals (aspirational, no concrete next steps)?
   - Should any be demoted to just a note or archived (stale, no tasks, no momentum)?
   - Should any projects be merged (overlapping scope, same theme)?
   - Are any goals disconnected from projects (no linked projects = no path to achievement)?
   - Are there tasks floating without a project that should be grouped?
   Be direct and honest. Jake wants accountability, not validation. If something isn't a real project, say so.
   Provide a summary observation and then specific items with recommendations.

Respond ONLY with a JSON object, no markdown, no code blocks:
{
  "primaryFocus": { "title": "...", "reasoning": "...", "connectedGoal": "..." },
  "patternInsight": { "observation": "...", "evidence": ["...", "..."] },
  "riskFlag": { "item": "...", "reason": "...", "suggestedAction": "..." },
  "momentumWin": { "achievement": "...", "leverage": "..." },
  "weeklyPriority": { "focus": "...", "reasoning": "..." },
  "systemAudit": {
    "summary": "One paragraph honest assessment of the structural health of Jake's system",
    "items": [
      { "name": "Project or Goal name", "currentType": "Project", "recommendation": "keep|demote_to_goal|demote_to_note|merge|archive", "reasoning": "Why", "actionRequired": "Specific action to take" }
    ]
  },
  "summary": "One sentence summary of the overall recommendation"
}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const rawText = response.choices?.[0]?.message?.content || "";

  // Parse JSON from the response
  let jsonStr = rawText;
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  } else {
    const braceMatch = rawText.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      jsonStr = braceMatch[0];
    }
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    parsed = {
      primaryFocus: { title: "Review your current tasks", reasoning: "Unable to parse AI response. Check your data.", connectedGoal: "" },
      patternInsight: { observation: "Analysis unavailable", evidence: [] },
      riskFlag: { item: "Analysis unavailable", reason: "", suggestedAction: "" },
      momentumWin: { achievement: "Analysis unavailable", leverage: "" },
      weeklyPriority: { focus: "Analysis unavailable", reasoning: "" },
      systemAudit: { summary: "Analysis unavailable", items: [] },
      summary: "Intelligence analysis encountered an error. Please try refreshing.",
    };
  }

  const report: IntelligenceReport = {
    primaryFocus: parsed.primaryFocus || { title: "", reasoning: "", connectedGoal: "" },
    patternInsight: parsed.patternInsight || { observation: "", evidence: [] },
    riskFlag: parsed.riskFlag || { item: "", reason: "", suggestedAction: "" },
    momentumWin: parsed.momentumWin || { achievement: "", leverage: "" },
    weeklyPriority: parsed.weeklyPriority || { focus: "", reasoning: "" },
    systemAudit: parsed.systemAudit || { summary: "", items: [] },
    summary: parsed.summary || "",
    generatedAt: new Date().toISOString(),
  };

  cachedReport = { data: report, ts: Date.now() };
  return report;
}

// --- Voice Note Task Extractor ---

export async function processVoiceNotes(): Promise<ProcessingResult> {
  // Step 5: Auto-title untitled notes first
  const titledNotes = await autoTitleNotes();

  // Step 1: Find unprocessed voice notes
  const allUnprocessed = await getUnprocessedVoiceNotes();
  // Limit to 10 per request to avoid timeouts
  const toProcess = allUnprocessed.slice(0, 10);

  if (toProcess.length === 0) {
    return {
      notesProcessed: 0,
      tasksCreated: 0,
      notesTitled: titledNotes.length,
      details: [],
      titledNotes,
    };
  }

  // Get project lookup map for matching
  const projectLookup = await getProjectLookup();
  const projectNames = Array.from(projectLookup.keys());

  const details: ProcessedVoiceNote[] = [];
  let totalTasksCreated = 0;

  for (const note of toProcess) {
    try {
      // Step 2: Get content
      const content = await getVoiceNoteContent(note.id);
      if (!content || content.trim().length < 20) {
        details.push({ id: note.id, name: note.name, tasksCreated: [] });
        continue;
      }

      // Step 3: Send to GPT-4o for task extraction
      const prompt = `You extract actionable tasks from voice note content and match them to existing projects.

EXISTING PROJECTS:
${projectNames.map(n => `- ${n}`).join("\n")}

VOICE NOTE CONTENT:
${content.slice(0, 4000)}

Extract concrete, actionable tasks from this voice note. For each task:
1. Write a clear task name (action-oriented, specific, max 10 words)
2. Classify as "Process" (quick, delegatable, communication) or "Immersive" (focus work, deep thinking, creation)
3. Match to the most relevant existing project from the list above, or suggest "NONE" if no project fits
4. Assign priority: "High" (urgent, blocks other work, time-sensitive, directly tied to active goals), "Medium" (important but not urgent, supports ongoing projects), or "Low" (nice to have, can be deferred)

Only extract REAL action items — things that need to be done. Skip observations, reflections, and insights that aren't actionable.

If the voice note has NO actionable tasks (it's purely a reflection or observation), return an empty array.

Respond ONLY with JSON:
{ "tasks": [{ "name": "...", "type": "Process|Immersive", "project": "Exact Project Name|NONE", "priority": "High|Medium|Low" }] }`;

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const rawText = response.choices?.[0]?.message?.content || "";
      let parsed: { tasks: { name: string; type: string; project: string; priority: string }[] };
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = { tasks: [] };
      }

      const tasks = parsed.tasks || [];
      const createdTasks: ProcessedVoiceNote["tasksCreated"] = [];

      // Step 4: Create tasks in Notion
      for (const task of tasks) {
        try {
          const taskType = task.type === "Process" ? "Process" : "Immersive";
          const priority = ["High", "Medium", "Low"].includes(task.priority) ? task.priority : "Medium";
          const matchedProject = task.project && task.project !== "NONE"
            ? projectLookup.get(task.project) || null
            : null;

          await createTaskInNotion(
            task.name,
            taskType,
            priority,
            note.id,
            matchedProject?.id || null,
            matchedProject?.url || null,
          );

          createdTasks.push({
            name: task.name,
            type: taskType,
            project: matchedProject ? task.project : "",
            priority,
          });
          totalTasksCreated++;
        } catch (err) {
          console.error(`Failed to create task "${task.name}":`, err);
        }
      }

      details.push({ id: note.id, name: note.name, tasksCreated: createdTasks });
    } catch (err) {
      console.error(`Failed to process voice note ${note.id}:`, err);
      details.push({ id: note.id, name: note.name, tasksCreated: [] });
    }
  }

  return {
    notesProcessed: toProcess.length,
    tasksCreated: totalTasksCreated,
    notesTitled: titledNotes.length,
    details,
    titledNotes,
  };
}

export async function getUnprocessedVoiceNoteCount(): Promise<number> {
  const unprocessed = await getUnprocessedVoiceNotes();
  return unprocessed.length;
}

// --- Auto-Title Generator ---

export async function autoTitleNotes(): Promise<TitledNote[]> {
  const untitled = await findUntitledNotes();
  if (untitled.length === 0) return [];

  const results: TitledNote[] = [];

  // Process in batches of 3 to avoid rate limits
  for (let i = 0; i < untitled.length; i += 3) {
    const batch = untitled.slice(i, i + 3);
    const titlePromises = batch.map(async (note) => {
      try {
        const response = await client.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 100,
          messages: [
            {
              role: "system",
              content: `You generate clear, descriptive titles for notes. Rules:
- Maximum 8 words
- Must clearly convey the note's core intent or subject
- Use plain language, no jargon unless the content is technical
- Be specific, not generic ("Meeting with Paul about RSM timeline" not "Meeting Notes")
- If the note is a reflection, lead with the theme ("Overcoming Self-Doubt Through Daily Practice")
- If the note is action-oriented, lead with the action ("Plan: Carpark Upgrade Gate Meetings")
- Respond with ONLY the title, nothing else`,
            },
            {
              role: "user",
              content: `Generate a title for this note:\n\n${note.content}`,
            },
          ],
        });

        const newTitle = (response.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");

        if (newTitle && newTitle.length > 3 && newTitle.length < 100) {
          await updateNoteTitle(note.id, newTitle);
          return {
            id: note.id,
            oldTitle: note.title || "Untitled",
            newTitle,
            contentPreview: note.content.slice(0, 100) + (note.content.length > 100 ? "…" : ""),
          };
        }
      } catch (err) {
        console.error(`Failed to title note ${note.id}:`, err);
      }
      return null;
    });

    const batchResults = await Promise.all(titlePromises);
    batchResults.forEach((r) => { if (r) results.push(r); });
  }

  return results;
}

// --- Proof Panel with Identity Domains ---
import { getRecentlyCompletedTasks } from "./notion";
import type { ProofTask } from "../shared/schema";

let cachedProof: { data: ProofPanel; ts: number } | null = null;
const PROOF_CACHE_TTL = 1_800_000; // 30 min

// Identity domains that map to patterns of behaviour
const IDENTITY_DOMAINS = [
  "Builder",      // Creating systems, tools, structures
  "Communicator", // Emails, meetings, conversations, outreach
  "Leader",       // Delegation, decision-making, stakeholder work
  "Learner",      // Research, study, skill development, reflection
  "Craftsman",    // Hands-on work, design, technical execution
  "Organiser",    // Planning, processing, filing, maintaining systems
];

export async function generateProofPanel(): Promise<ProofPanel> {
  if (cachedProof && Date.now() - cachedProof.ts < PROOF_CACHE_TTL) {
    return cachedProof.data;
  }

  const completedTasks = await getRecentlyCompletedTasks();

  if (completedTasks.length === 0) {
    const empty: ProofPanel = {
      period: "Last 7 Days",
      totalWins: 0,
      winsByProject: [],
      winsByIdentity: [],
      patternSignal: "",
      tasks: [],
    };
    cachedProof = { data: empty, ts: Date.now() };
    return empty;
  }

  const taskList = completedTasks
    .map(t => `- ${t.name} (${t.type || "unclassified"}, project: ${t.project || "none"})`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2048,
    messages: [
      {
        role: "system",
        content: `You analyse completed tasks to build proof of identity. Each task is evidence of who the person is becoming. Be specific, grounded, and psychologically honest.

IDENTITY DOMAINS (assign exactly one per task):
- Builder: Creating systems, tools, structures, apps, frameworks
- Communicator: Emails, meetings, conversations, outreach, relationships
- Leader: Delegation, decision-making, stakeholder management, influence
- Learner: Research, study, skill development, reflection, self-improvement
- Craftsman: Hands-on work, design, technical execution, physical creation
- Organiser: Planning, processing, filing, maintaining systems, GTD work`,
      },
      {
        role: "user",
        content: `Here are tasks completed in the last 7 days:

${taskList}

For EACH task, provide:
1. identityDomain — which identity domain this task reinforces (one of: Builder, Communicator, Leader, Learner, Craftsman, Organiser)
2. whatItMoved — one sentence: what did completing this advance?
3. identityReinforced — one sentence: what does doing this say about who I am?

Then provide ONE overall patternSignal — looking at ALL the tasks together, is there a repeating pattern? What identity is being most reinforced this week? Is the pattern healthy or scattered? Be honest.

Respond ONLY with JSON:
{
  "tasks": [
    { "name": "task name", "identityDomain": "Builder", "whatItMoved": "...", "identityReinforced": "..." }
  ],
  "patternSignal": "2-3 sentences about the overall pattern"
}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const rawText = response.choices?.[0]?.message?.content || "";
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { tasks: [], patternSignal: "Unable to analyse. Review completed tasks manually." };
  }

  // Merge LLM analysis with raw task data
  const proofTasks: ProofTask[] = completedTasks.map((t, i) => {
    const llmTask = (parsed.tasks || [])[i] || {};
    return {
      name: t.name,
      type: t.type,
      project: t.project,
      completedDate: t.completedDate,
      identityDomain: llmTask.identityDomain || "Organiser",
      whatItMoved: llmTask.whatItMoved || "",
      identityReinforced: llmTask.identityReinforced || "",
    };
  });

  // Roll up by project
  const projMap = new Map<string, number>();
  for (const t of proofTasks) {
    const p = t.project || "Unassigned";
    projMap.set(p, (projMap.get(p) || 0) + 1);
  }
  const winsByProject = Array.from(projMap.entries())
    .map(([project, count]) => ({ project, count }))
    .sort((a, b) => b.count - a.count);

  // Roll up by identity domain
  const idMap = new Map<string, { count: number; tasks: string[] }>();
  for (const t of proofTasks) {
    const d = t.identityDomain;
    const existing = idMap.get(d) || { count: 0, tasks: [] };
    existing.count++;
    existing.tasks.push(t.name);
    idMap.set(d, existing);
  }
  const winsByIdentity = Array.from(idMap.entries())
    .map(([domain, data]) => ({ domain, count: data.count, tasks: data.tasks }))
    .sort((a, b) => b.count - a.count);

  const proof: ProofPanel = {
    period: "Last 7 Days",
    totalWins: proofTasks.length,
    winsByProject,
    winsByIdentity,
    patternSignal: parsed.patternSignal || "",
    tasks: proofTasks,
  };

  cachedProof = { data: proof, ts: Date.now() };
  return proof;
}
