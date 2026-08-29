// Thought → Decision → Next action → Evidence → Learning
// Code enforces the rules. AI fills the card. Capture without a next action is motion.

export type ActionDecision = "act" | "not_now";

export interface ActionLint {
  weak: boolean;
  reasons: string[];
}

export interface ActionCard {
  decision: ActionDecision;
  thought: string;
  whyItMatters: string;
  nextStep: string;
  timeOrTrigger: string;
  due: string | null;
  definitionOfDone: string;
  learnIfFails: string;
  type: "Process" | "Immersive";
  project: string;
  priority: "High" | "Medium" | "Low";
}

export interface ClarifyResult {
  notesClarified: number;
  tasksCreated: number;
  deferred: number;
  cards: (ActionCard & { sourceId: string; sourceName: string })[];
}

const INTENTION_STEMS =
  /^(i should|i need to|i need|need to|maybe|consider|think about|look into|try to|ought to|wish i|it would be good to)\b/i;

const MOTION_WITHOUT_FINISH =
  /^(research|brainstorm|explore|think|reflect|revisit|improve|work on|figure out|organise|organize|plan)\b/i;

const ACTION_VERBS =
  /^(draft|write|send|call|book|map|interview|build|invite|ship|test|decide|publish|schedule|ask|create|file|reply|renew|sketch|record|measure|prototype|list|invite)/i;

const OBSERVABLE_DONE =
  /\b(sent|published|booked|tested|decided|shipped|drafted|invited|recorded|mapped|filed|replied|scheduled|called|written|built)\b/i;

export const ACTION_FRAME_SEQUENCE =
  "Thought → Decision → Next action → Evidence → Learning";

export function lintActionName(name: string): ActionLint {
  const text = name.trim();
  const reasons: string[] = [];

  if (!text) {
    return { weak: true, reasons: ["Empty — not an action"] };
  }

  if (INTENTION_STEMS.test(text)) {
    reasons.push('Starts as an "I should" — convert to a scheduled task or a conscious not-now');
  }

  const words = text.split(/\s+/);
  if (words.length < 2) {
    reasons.push("Single word — write a verb with an object");
  }

  if (MOTION_WITHOUT_FINISH.test(text) && words.length <= 4) {
    reasons.push("Motion, not a result — name the first observable output");
  }

  if (/^(captured thought|untitled|new note|idea:)/i.test(text)) {
    reasons.push("Still a thought — write the smallest useful next step");
  }

  if (/improve my|more ideas|positioning/i.test(text) && !ACTION_VERBS.test(text)) {
    reasons.push("Vague intention — pick one buyer, one page, one interview");
  }

  return { weak: reasons.length > 0, reasons };
}

export function isObservableDone(definitionOfDone: string): boolean {
  return OBSERVABLE_DONE.test(definitionOfDone.trim());
}

export function parseWhenToDue(timeOrTrigger: string, todayStr: string): string | null {
  const t = timeOrTrigger.trim().toLowerCase();
  if (!t) return null;

  const iso = t.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];

  const today = new Date(`${todayStr}T00:00:00Z`);
  const shift = (days: number) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  if (/\btoday\b|after today's|by \d/.test(t)) return todayStr;
  if (/\btomorrow\b/.test(t)) return shift(1);
  if (/\bthis week\b/.test(t)) return shift(3);
  if (/\bnext week\b/.test(t)) return shift(7);

  return null;
}

export function scoreActionability(card: Pick<ActionCard, "nextStep" | "timeOrTrigger" | "definitionOfDone" | "decision">): number {
  if (card.decision === "not_now") return 0;
  let score = 0;
  const lint = lintActionName(card.nextStep);
  if (!lint.weak) score += 2;
  if (card.timeOrTrigger.trim()) score += 1;
  if (isObservableDone(card.definitionOfDone) || card.definitionOfDone.trim().length > 8) score += 1;
  return score;
}

export function normalizeCard(raw: Partial<ActionCard>, todayStr: string): ActionCard {
  const nextStep = (raw.nextStep || "").trim();
  const timeOrTrigger = (raw.timeOrTrigger || "").trim();
  const due = raw.due && /^\d{4}-\d{2}-\d{2}$/.test(raw.due)
    ? raw.due
    : parseWhenToDue(timeOrTrigger, todayStr);

  const type = raw.type === "Process" ? "Process" : "Immersive";
  const priority = raw.priority === "High" || raw.priority === "Low" ? raw.priority : "Medium";
  const decision: ActionDecision = raw.decision === "not_now" ? "not_now" : "act";

  return {
    decision,
    thought: (raw.thought || "").trim(),
    whyItMatters: (raw.whyItMatters || "").trim(),
    nextStep,
    timeOrTrigger,
    due,
    definitionOfDone: (raw.definitionOfDone || "").trim(),
    learnIfFails: (raw.learnIfFails || "").trim(),
    type,
    project: raw.project && raw.project !== "NONE" ? raw.project : "",
    priority,
  };
}

export function actionCardToBlocks(card: ActionCard): { heading: string; body: string }[] {
  return [
    { heading: "Thought", body: card.thought },
    { heading: "Why it matters now", body: card.whyItMatters },
    { heading: "Smallest useful next step", body: card.nextStep },
    { heading: "Time or trigger", body: card.timeOrTrigger },
    { heading: "Definition of done", body: card.definitionOfDone },
    { heading: "What I’ll learn if it fails", body: card.learnIfFails },
  ].filter((block) => block.body);
}

export function buildActionFramePrompt(content: string, projectNames: string[], todayStr: string): string {
  return `You turn thoughts into next actions. Motion feels productive; action produces a result that reduces uncertainty.

SEQUENCE: Thought → Decision → Next action → Evidence → Learning

A thought is actionable only when it answers:
1. What matters? (opportunity, problem, or desired outcome)
2. What will I do? (ONE observable action — verb + object, completable in 10–30 minutes)
3. When will I do it? (time, trigger, or deadline)
4. What will show progress? (sent, published, booked, tested, decided, shipped)

RULES:
- Convert every "I should" into either a scheduled task or decision "not_now".
- Write nextStep as a verb with an object: "Draft the one-page offer for ops managers", not "Work on marketing".
- Prefer at most 3 cards per note. If it is purely reflection with no action, return one not_now card.
- Treat early action as research, not a final commitment.
- due must be YYYY-MM-DD or null. Today is ${todayStr}. If the trigger is "today" / "after today's work", use ${todayStr}. If "tomorrow", use the next calendar day. If "this week" and no date, use 3 days from today.
- Match project to an existing name exactly, or NONE.

EXISTING PROJECTS:
${projectNames.length ? projectNames.map((n) => `- ${n}`).join("\n") : "(none)"}

SOURCE:
${content.slice(0, 4000)}

Respond ONLY with JSON:
{ "cards": [{ "decision": "act|not_now", "thought": "...", "whyItMatters": "...", "nextStep": "...", "timeOrTrigger": "...", "due": "YYYY-MM-DD|null", "definitionOfDone": "...", "learnIfFails": "...", "type": "Process|Immersive", "project": "Exact Project Name|NONE", "priority": "High|Medium|Low" }] }`;
}

export function fixtureActionCards(todayStr: string): ActionCard[] {
  return [
    normalizeCard(
      {
        decision: "act",
        thought: "SMEs need a simpler way to identify operational bottlenecks using AI.",
        whyItMatters: "It could become a focused entry offer for ApexForm Life.",
        nextStep: "Write five discovery questions for ops-manager interviews",
        timeOrTrigger: "After today’s client work",
        definitionOfDone: "Five questions written in one page",
        learnIfFails: "Whether the pain is specific enough to interview against",
        type: "Immersive",
        project: "NONE",
        priority: "High",
      },
      todayStr,
    ),
    normalizeCard(
      {
        decision: "act",
        thought: "I need more clients.",
        whyItMatters: "Pipeline is thin; posting more is motion.",
        nextStep: "Send five tailored messages to existing business contacts",
        timeOrTrigger: "Tomorrow morning",
        definitionOfDone: "Five messages sent",
        learnIfFails: "Which pain they name first, and whether they will take a 20-minute call",
        type: "Process",
        project: "NONE",
        priority: "High",
      },
      todayStr,
    ),
  ];
}
