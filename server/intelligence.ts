import OpenAI from "openai";
import type { IntelligenceContext, IntelligenceReport, TitledNote, ProcessedVoiceNote, ProcessingResult, ProofPanel } from "../shared/schema";
import { findUntitledNotes, updateNoteTitle, getUnprocessedVoiceNotes, getVoiceNoteContent, getProjectLookup } from "./notion";
import { extractActionCards, writeActionCardAsTask } from "./actionFrame";

let client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!client) client = new OpenAI();
  return client;
}

let cachedReport: { data: IntelligenceReport; ts: number } | null = null;
const REPORT_CACHE_TTL = 1_800_000; // 30 minutes

export async function generateIntelligence(context: IntelligenceContext): Promise<IntelligenceReport> {
  if (cachedReport && Date.now() - cachedReport.ts < REPORT_CACHE_TTL) {
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

  const prompt = `Synthesize this operator's workspace into ONE clear recommendation for what to focus on next.
Do not converse. Fill the JSON schema only. Code elsewhere owns destinations, tiers, and next-action lint.

GOALS:
${goalsSection}

PROJECTS:
${projectsSection}

RECENT TASKS (last 14 days):
Completed:
${completedSection}

In Progress:
${inProgressSection}

TODAY:
- ${context.todayDueCount} tasks due today
- ${context.overdueCount} overdue tasks
- ${context.completedYesterdayCount} completed yesterday

RECENT VOICE NOTE THEMES:
${voiceNotesSection}

Fill:

1. PRIMARY FOCUS: The ONE thing to focus on today and why. Name the exact project, task, or action. Connect it to a goal when one exists.

2. PATTERN INSIGHT: One non-obvious pattern across the data — something connecting different areas.

3. RISK FLAG: The most important thing at risk of slipping.

4. MOMENTUM WIN: Something completed recently worth building on. Name the specific accomplishment.

5. WEEKLY PRIORITY: #1 priority this week beyond today. One observable next action (verb + object, 10–30 minutes) and whether to keep, improve, delegate, automate, or stop the current approach.

6. SYSTEM AUDIT: For EACH project and goal:
   - Is this a project (defined outcome, concrete tasks, timeline) or an aspiration labelled as one?
   - Demote to goal / note / archive if it has no path.
   - Merge when scope overlaps.
   - Flag goals with no linked projects.
   Direct. If something is not a real project, say so.
   Provide a summary and specific items.

Respond ONLY with a JSON object, no markdown, no code blocks:
{
  "primaryFocus": { "title": "...", "reasoning": "...", "connectedGoal": "..." },
  "patternInsight": { "observation": "...", "evidence": ["...", "..."] },
  "riskFlag": { "item": "...", "reason": "...", "suggestedAction": "..." },
  "momentumWin": { "achievement": "...", "leverage": "..." },
  "weeklyPriority": { "focus": "...", "reasoning": "..." },
  "systemAudit": {
    "summary": "One paragraph on the structural health of the system",
    "items": [
      { "name": "Project or Goal name", "currentType": "Project", "recommendation": "keep|demote_to_goal|demote_to_note|merge|archive", "reasoning": "Why", "actionRequired": "Specific action to take" }
    ]
  },
  "summary": "One sentence summary of the overall recommendation"
}`;

  const response = await getOpenAI().chat.completions.create({
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
      primaryFocus: { title: "Review your current tasks", reasoning: "Unable to parse the interpretation. Check your data.", connectedGoal: "" },
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

      // Step 3: Turn the thought into next-action cards (not a pile of intentions)
      const cards = await extractActionCards(content, projectNames);
      const createdTasks: ProcessedVoiceNote["tasksCreated"] = [];

      for (const card of cards) {
        try {
          if (card.decision === "not_now") {
            createdTasks.push({
              name: card.nextStep || card.thought || "Not now",
              type: card.type,
              project: "",
              priority: card.priority,
              thought: card.thought,
              whyItMatters: card.whyItMatters,
              timeOrTrigger: card.timeOrTrigger,
              definitionOfDone: card.definitionOfDone,
              learnIfFails: card.learnIfFails,
              due: card.due,
              decision: "not_now",
            });
            continue;
          }

          const wrote = await writeActionCardAsTask(card, note.id, projectLookup);
          if (!wrote) continue;

          createdTasks.push({
            name: card.nextStep,
            type: card.type,
            project: card.project,
            priority: card.priority,
            thought: card.thought,
            whyItMatters: card.whyItMatters,
            timeOrTrigger: card.timeOrTrigger,
            definitionOfDone: card.definitionOfDone,
            learnIfFails: card.learnIfFails,
            due: card.due,
            decision: "act",
          });
          totalTasksCreated++;
        } catch (err) {
          console.error(`Failed to create action "${card.nextStep}":`, err);
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
        const response = await getOpenAI().chat.completions.create({
          model: "gpt-4o",
          max_tokens: 100,
          messages: [
            {
              role: "system",
              content: `Title rules:
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

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2048,
    messages: [
      {
        role: "system",
        content: `Assign identity domains from completed tasks. Each task is evidence of a pattern of work. Be specific and grounded.

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

  // Merge filled fields with raw task data
  const proofTasks: ProofTask[] = completedTasks.map((t, i) => {
    const filled = (parsed.tasks || [])[i] || {};
    return {
      name: t.name,
      type: t.type,
      project: t.project,
      completedDate: t.completedDate,
      identityDomain: filled.identityDomain || "Organiser",
      whatItMoved: filled.whatItMoved || "",
      identityReinforced: filled.identityReinforced || "",
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
