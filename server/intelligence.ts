import OpenAI from "openai";
import type { IntelligenceContext, IntelligenceReport } from "../shared/schema";

const client = new OpenAI();

// Cache for LLM response (10 min)
let cachedReport: { data: IntelligenceReport; ts: number } | null = null;
const LLM_CACHE_TTL = 600_000;

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

Respond ONLY with a JSON object, no markdown, no code blocks:
{
  "primaryFocus": { "title": "...", "reasoning": "...", "connectedGoal": "..." },
  "patternInsight": { "observation": "...", "evidence": ["...", "..."] },
  "riskFlag": { "item": "...", "reason": "...", "suggestedAction": "..." },
  "momentumWin": { "achievement": "...", "leverage": "..." },
  "weeklyPriority": { "focus": "...", "reasoning": "..." },
  "summary": "One sentence summary of the overall recommendation"
}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2048,
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
      summary: "Intelligence analysis encountered an error. Please try refreshing.",
    };
  }

  const report: IntelligenceReport = {
    primaryFocus: parsed.primaryFocus || { title: "", reasoning: "", connectedGoal: "" },
    patternInsight: parsed.patternInsight || { observation: "", evidence: [] },
    riskFlag: parsed.riskFlag || { item: "", reason: "", suggestedAction: "" },
    momentumWin: parsed.momentumWin || { achievement: "", leverage: "" },
    weeklyPriority: parsed.weeklyPriority || { focus: "", reasoning: "" },
    summary: parsed.summary || "",
    generatedAt: new Date().toISOString(),
  };

  cachedReport = { data: report, ts: Date.now() };
  return report;
}
