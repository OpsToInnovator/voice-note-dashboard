// Divergent frameworks, one contract: every plan ends in a next action
// another person could verify. Planning without that leaf is avoidance.
//
// Code owns routing, field shape, and lint.
// AI fills the chosen canvas.
// The action frame is the shared leaf of every stack.

import {
  lintActionName,
  normalizeCard,
  type ActionCard,
  type ActionLint,
} from "./actionFrame";
import {
  CHANGE_THE_MODEL_STEP,
  assessGoal,
  feasibilityBlocksExecute,
  obstacleToIfThen,
  type GoalCoaching,
} from "./goalCoach";

export const GOAL_STACK = [
  { id: "vision", label: "Vision", horizon: "1–3+ years", question: "What future am I building?" },
  { id: "goal", label: "Goal", horizon: "3–12 months", question: "What measurable change matters?" },
  { id: "milestone", label: "Milestone", horizon: "4–12 weeks", question: "What must be true by the end of this phase?" },
  { id: "project", label: "Project", horizon: "1–4 weeks", question: "What bounded piece of work creates the milestone?" },
  { id: "next_action", label: "Next action", horizon: "5–60 minutes", question: "What physical step can I take now?" },
  { id: "calendar", label: "Calendar block", horizon: "Specific date/time", question: "When will it happen?" },
] as const;

export type FrameworkId =
  | "action_frame"
  | "backward_planning"
  | "outcome_process_identity"
  | "twelve_week_sprint"
  | "woop"
  | "agile_decomposition"
  | "goal_canvas";

export interface FrameworkField {
  key: string;
  label: string;
  hint: string;
}

export interface FrameworkMeta {
  id: FrameworkId;
  name: string;
  challenge: string;
  useWhen: string;
  sequence: string;
  fields: FrameworkField[];
}

export interface FrameworkPlan {
  frameworkId: FrameworkId;
  title: string;
  whyThisFramework: string;
  layers: { key: string; label: string; value: string }[];
  commitments: string[];
  firstAction: ActionCard;
  obstaclePlan: { trigger: string; response: string } | null;
  review: string;
  lint: ActionLint;
  coach: GoalCoaching | null;
}

export interface FrameworkRecommendation {
  id: FrameworkId;
  reason: string;
  alternatives: { id: FrameworkId; reason: string }[];
}

export interface ApplyFrameworkResult {
  recommendation: FrameworkRecommendation;
  plan: FrameworkPlan;
  usedFixture: boolean;
}

const PLANNING_AS_AVOIDANCE =
  /^(plan|research|brainstorm|think about|map the|write (the |a )?(plan|roadmap|framework|strategy))\b/i;

export const FRAMEWORKS: FrameworkMeta[] = [
  {
    id: "action_frame",
    name: "Thought → action",
    challenge: "A captured thought with no next step",
    useWhen: "Inbox, voice notes, and any ‘I should’ that is not yet a task",
    sequence: "Thought → Decision → Next action → Evidence → Learning",
    fields: [
      { key: "thought", label: "Thought", hint: "The raw idea" },
      { key: "why", label: "Why it matters now", hint: "Opportunity, problem, or desired outcome" },
      { key: "done", label: "Definition of done", hint: "Sent, published, booked, tested, decided, shipped" },
      { key: "learn", label: "What I’ll learn if it fails", hint: "What this experiment tells us" },
    ],
  },
  {
    id: "backward_planning",
    name: "Backward planning",
    challenge: "You know the end result but cannot see the route",
    useWhen: "Launches, revenue targets, qualifications — a clear definition of done",
    sequence: "End condition → prerequisites → this week → today",
    fields: [
      { key: "end", label: "By date, verifiable outcome", hint: "Observable end condition and metric" },
      { key: "final", label: "Final prerequisite", hint: "What must be true immediately before the end" },
      { key: "next", label: "Next prerequisite", hint: "The step before that" },
      { key: "week", label: "This week’s output", hint: "One bounded piece of work" },
    ],
  },
  {
    id: "outcome_process_identity",
    name: "Outcome–process–identity",
    challenge: "You keep focusing on outcomes but neglect habits",
    useWhen: "The scoreboard is loud; the weekly behaviours and manner of action are not",
    sequence: "Outcome → process behaviours → identity / manner of action",
    fields: [
      { key: "outcome", label: "Outcome goal", hint: "The result you want" },
      { key: "process", label: "Process goal", hint: "Repeated behaviours you control" },
      { key: "identity", label: "Identity / manner", hint: "How you choose to operate — not deficit-drive" },
    ],
  },
  {
    id: "twelve_week_sprint",
    name: "12-week sprint",
    challenge: "The ambition is too large or distant to act on",
    useWhen: "Yearly goals that need a near cycle with lead measures you control",
    sequence: "One primary outcome → 3–5 lead measures → establish / build / validate",
    fields: [
      { key: "primary", label: "Primary 12-week outcome", hint: "One outcome, plus at most one supporting" },
      { key: "leads", label: "Lead measures", hint: "Weekly behaviours you control" },
      { key: "establish", label: "Weeks 1–4 · Establish", hint: "Definition of done for the first phase" },
      { key: "build", label: "Weeks 5–8 · Build", hint: "Definition of done for the second phase" },
      { key: "validate", label: "Weeks 9–12 · Validate", hint: "Definition of done for ship / test" },
    ],
  },
  {
    id: "woop",
    name: "WOOP + if–then",
    challenge: "You repeatedly avoid a known action",
    useWhen: "Overthinking, postponing, distraction — friction you can name in advance",
    sequence: "Wish → Outcome → Obstacle → Plan (if–then)",
    fields: [
      { key: "wish", label: "Wish", hint: "One important, feasible goal" },
      { key: "outcome", label: "Outcome", hint: "Best result of achieving it" },
      { key: "obstacle", label: "Obstacle", hint: "The internal pattern that gets in the way" },
    ],
  },
  {
    id: "agile_decomposition",
    name: "Agile goal decomposition",
    challenge: "The path is uncertain, innovative, or technical",
    useWhen: "Product, automation, or strategy work where a linear plan would be fiction",
    sequence: "Hypothesis → small experiment → evidence → decision → next experiment",
    fields: [
      { key: "goal", label: "Goal", hint: "Desirable change" },
      { key: "hypothesis", label: "Hypothesis", hint: "What we believe will cause that change" },
      { key: "test", label: "Smallest test", hint: "Fastest credible way to test it" },
      { key: "evidence", label: "Evidence threshold", hint: "What counts as signal, not activity" },
      { key: "decision", label: "Decision rule", hint: "Continue, change direction, or stop" },
    ],
  },
  {
    id: "goal_canvas",
    name: "One-page goal canvas",
    challenge: "The plan contains too many tasks and no focus",
    useWhen: "Default for a big goal: canvas + 12-week shape + backward milestones + WOOP only where friction repeats",
    sequence: "Goal → evidence → milestones → this week → first action → if–then",
    fields: [
      { key: "goal", label: "Goal", hint: "By [date], achieve [observable result]" },
      { key: "why", label: "Why it matters", hint: "Vision, customer value, capability, or life direction" },
      { key: "evidence", label: "Success evidence", hint: "Metric, artefact, decision, or customer outcome" },
      { key: "reality", label: "Current reality", hint: "Facts, constraints, unknowns" },
      { key: "milestones", label: "Milestones", hint: "Three phase outcomes with dates" },
    ],
  },
];

export const FRAMEWORK_BY_ID: Record<FrameworkId, FrameworkMeta> = Object.fromEntries(
  FRAMEWORKS.map((fw) => [fw.id, fw]),
) as Record<FrameworkId, FrameworkMeta>;

export const DEFAULT_BIG_GOAL_FRAMEWORK: FrameworkId = "goal_canvas";

const ROUTER: { id: FrameworkId; reason: string; patterns: RegExp[] }[] = [
  {
    id: "woop",
    reason: "You know the action and keep getting stuck — pre-decide the if–then.",
    patterns: [
      /\b(overthink|postpone|avoid|procrastinat|stuck|derail|never send|don't send|dont send|revising|put(?:ting)? off|self-sabotag|distracted|won't start)\b/i,
    ],
  },
  {
    id: "agile_decomposition",
    reason: "The path is uncertain — run a learning loop, not a fake linear plan.",
    patterns: [
      /\b(hypothesis|prototype|experiment|mvp|clickable|don't know (if|yet)|dont know (if|yet)|uncertain|validate whether|would they pay|buying intent)\b/i,
    ],
  },
  {
    id: "outcome_process_identity",
    reason: "The scoreboard is crowding out the behaviours and the way you want to operate.",
    patterns: [
      /\b(prove myself|scoreboard|identity|deficit|draining|habits|process goal|manner of action|not enough)\b/i,
    ],
  },
  {
    id: "twelve_week_sprint",
    reason: "The ambition is too remote — one 12-week outcome with lead measures you control.",
    patterns: [
      /\b(12[- ]week|twelve week|too (big|distant|remote)|this year|yearly|annual ambition|sprint)\b/i,
      /\b(\d+\s*million|i earn\b|revenue target)\b/i,
    ],
  },
  {
    id: "backward_planning",
    reason: "The destination is clear — walk backwards until this week and today are obvious.",
    patterns: [
      /\b(by \d{1,2} |by (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|i will have|sold three|launch|qualification|end condition)\b/i,
    ],
  },
  {
    id: "goal_canvas",
    reason: "Too many moving pieces — one page, 3–5 commitments, one first action.",
    patterns: [
      /\b(too many tasks|no focus|big goal|one-page|one page canvas|overwhelm)\b/i,
    ],
  },
  {
    id: "action_frame",
    reason: "This is still a thought — convert it to one next action or a conscious not-now.",
    patterns: [
      /\b(i should|captured thought|inbox|voice note|i need to|maybe i)\b/i,
    ],
  },
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function isPlanningAsAvoidance(nextStep: string): boolean {
  return PLANNING_AS_AVOIDANCE.test(nextStep.trim());
}

export function recommendFramework(text: string): FrameworkRecommendation {
  const hits = ROUTER.filter((rule) => rule.patterns.some((re) => re.test(text))).map((rule) => ({
    id: rule.id,
    reason: rule.reason,
  }));

  if (hits.length === 0) {
    const id: FrameworkId = wordCount(text) <= 18 ? "action_frame" : DEFAULT_BIG_GOAL_FRAMEWORK;
    const reason =
      id === "action_frame"
        ? "Short capture — use the thought → action leaf, not a larger plan."
        : "Default for a substantial goal: one-page canvas, then a 12-week shape if it still feels remote.";
    return { id, reason, alternatives: [] };
  }

  const [primary, ...rest] = hits;
  return { id: primary.id, reason: primary.reason, alternatives: rest };
}

export function resolveFrameworkId(text: string, requested?: FrameworkId | "auto" | null): FrameworkRecommendation {
  const auto = recommendFramework(text);
  if (!requested || requested === "auto") return auto;
  if (requested === auto.id) return auto;
  return {
    id: requested,
    reason: `You chose ${FRAMEWORK_BY_ID[requested].name}. Auto-route would have used ${FRAMEWORK_BY_ID[auto.id].name}: ${auto.reason}`,
    alternatives: [{ id: auto.id, reason: auto.reason }, ...auto.alternatives],
  };
}

export function lintPlan(plan: Omit<FrameworkPlan, "lint">): ActionLint {
  const reasons: string[] = [];
  const actionLint = lintActionName(plan.firstAction.nextStep);
  if (actionLint.weak) {
    reasons.push(...actionLint.reasons.map((r) => `First action: ${r}`));
  }
  if (isPlanningAsAvoidance(plan.firstAction.nextStep)) {
    reasons.push("First action is more planning — pick a physical step another person could verify");
  }
  if (plan.commitments.length > 5) {
    reasons.push("Too many commitments — keep 3–5 this week, not 20 tasks");
  }
  if (!plan.firstAction.timeOrTrigger.trim()) {
    reasons.push("No time or trigger — put the first action on the calendar");
  }
  if (plan.frameworkId === "woop" && !plan.obstaclePlan?.trigger) {
    reasons.push("WOOP needs an if–then plan for the internal obstacle");
  }
  if (plan.frameworkId === "agile_decomposition") {
    const hasEvidence = plan.layers.some((l) => l.key === "evidence" && l.value.trim());
    const hasDecision = plan.layers.some((l) => l.key === "decision" && l.value.trim());
    if (!hasEvidence) reasons.push("Agile loop needs an evidence threshold, not just activity");
    if (!hasDecision) reasons.push("Agile loop needs a continue / change / stop rule");
  }
  return { weak: reasons.length > 0, reasons };
}

export function normalizePlan(
  frameworkId: FrameworkId,
  raw: Partial<Omit<FrameworkPlan, "frameworkId" | "lint" | "firstAction">> & {
    firstAction?: Partial<ActionCard>;
  },
  todayStr: string,
): FrameworkPlan {
  const meta = FRAMEWORK_BY_ID[frameworkId];
  const layerValues = new Map((raw.layers || []).map((l) => [l.key, (l.value || "").trim()]));
  const layers = meta.fields.map((field) => ({
    key: field.key,
    label: field.label,
    value: layerValues.get(field.key) || "",
  }));

  const commitments = (raw.commitments || [])
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 5);

  const firstAction = normalizeCard(raw.firstAction || {}, todayStr);
  const obstaclePlan =
    raw.obstaclePlan?.trigger && raw.obstaclePlan?.response
      ? { trigger: raw.obstaclePlan.trigger.trim(), response: raw.obstaclePlan.response.trim() }
      : null;

  const draft = {
    frameworkId,
    title: (raw.title || meta.name).trim(),
    whyThisFramework: (raw.whyThisFramework || "").trim(),
    layers,
    commitments,
    firstAction,
    obstaclePlan,
    review: (raw.review || "Every Friday, check evidence and choose: continue, adapt, or stop.").trim(),
    coach: null,
  };

  return { ...draft, lint: lintPlan(draft) };
}

export function applyCoachToPlan(plan: FrameworkPlan, goalText: string, todayStr: string): FrameworkPlan {
  const coach = assessGoal(goalText);
  if (!coach) return { ...plan, coach: null };

  let obstaclePlan = plan.obstaclePlan;
  if (feasibilityBlocksExecute(coach) && coach.obstacles[0]) {
    obstaclePlan = obstacleToIfThen(coach.obstacles[0]);
  } else if (!obstaclePlan && coach.obstacles[0]) {
    obstaclePlan = obstacleToIfThen(coach.obstacles[0]);
  }

  let layers = plan.layers.map((layer) => ({ ...layer }));
  if (plan.frameworkId === "twelve_week_sprint" && coach.phases.length >= 3) {
    const phaseByKey: Record<string, (typeof coach.phases)[number]> = {
      establish: coach.phases[0],
      build: coach.phases[1],
      validate: coach.phases[2],
    };
    layers = layers.map((layer) => {
      const phase = phaseByKey[layer.key];
      if (phase && !layer.value.trim()) {
        return { ...layer, value: `${phase.name}: ${phase.focus}. Done when: ${phase.done}` };
      }
      if (layer.key === "leads" && !layer.value.trim()) {
        return { ...layer, value: coach.leadMeasures.join("; ") };
      }
      return layer;
    });
  }
  if (plan.frameworkId === "backward_planning") {
    layers = layers.map((layer) =>
      layer.key === "final" && !layer.value.trim() ? { ...layer, value: coach.chainSeed } : layer,
    );
  }

  let firstAction = plan.firstAction;
  let review = plan.review;
  let commitments = [...plan.commitments];
  if (feasibilityBlocksExecute(coach)) {
    firstAction = action(
      todayStr,
      CHANGE_THE_MODEL_STEP,
      "Today after client work",
      "One page with price, hours, and a non-hours-scaled alternative",
      {
        thought: goalText,
        whyItMatters: "The current model cannot physically hit the target. Volume is not the fix.",
        learnIfFails: "Which lever — price, hours, productisation, or capacity — is actually movable",
      },
    );
    review = `Change the model first. ${coach.feasibility?.verdict?.text || ""} Then choose: ${coach.reviewRules.join("; ")}`;
    if (!commitments.some((c) => /productis|price|capacity|model/i.test(c))) {
      commitments = ["Name the binding constraint from the maths", "Write one non-hours-scaled alternative", ...commitments].slice(0, 5);
    }
  }

  const draft = {
    frameworkId: plan.frameworkId,
    title: plan.title,
    whyThisFramework: plan.whyThisFramework,
    layers,
    commitments,
    firstAction,
    obstaclePlan,
    review,
    coach,
  };

  return { ...draft, lint: lintPlan(draft) };
}

export function planToBlocks(plan: FrameworkPlan): { heading: string; body: string }[] {
  const blocks = [
    { heading: "Framework", body: `${FRAMEWORK_BY_ID[plan.frameworkId].name} — ${plan.whyThisFramework}` },
    ...plan.layers.map((l) => ({ heading: l.label, body: l.value })),
    {
      heading: "This week’s commitments",
      body: plan.commitments.map((c, i) => `${i + 1}. ${c}`).join("\n"),
    },
    { heading: "First action", body: plan.firstAction.nextStep },
    { heading: "Time or trigger", body: plan.firstAction.timeOrTrigger },
    { heading: "Definition of done", body: plan.firstAction.definitionOfDone },
    plan.obstaclePlan
      ? {
          heading: "If–then",
          body: `If ${plan.obstaclePlan.trigger}, then I will ${plan.obstaclePlan.response}`,
        }
      : null,
    { heading: "Review", body: plan.review },
  ];
  return blocks.filter((b): b is { heading: string; body: string } => Boolean(b && b.body));
}

export function buildFrameworkPrompt(
  frameworkId: FrameworkId,
  content: string,
  todayStr: string,
): string {
  const meta = FRAMEWORK_BY_ID[frameworkId];
  const fieldLines = meta.fields.map((f) => `- ${f.key}: ${f.label} — ${f.hint}`).join("\n");

  return `You turn a goal or thought into a compact plan. Planning is not a substitute for the first action.

STACK: Vision → Goal → Milestone → Project → Next action → Calendar block
FRAMEWORK: ${meta.name}
SEQUENCE: ${meta.sequence}
USE WHEN: ${meta.useWhen}

Fill ONLY these layers:
${fieldLines}

RULES:
- firstAction.nextStep is a verb + object, completable in 5–60 minutes. Another person could tell whether it was done.
- firstAction is NOT "write a plan", "research the framework", or "think about it".
- At most 5 weekly commitments, each an output not a vague intention.
- If the framework is WOOP, obstaclePlan.trigger and response are required (If X then Y).
- If the framework is agile_decomposition, evidence must be a signal threshold and decision must say continue / change / stop.
- due is YYYY-MM-DD or null. Today is ${todayStr}.
- Treat early action as research, not a final commitment.

SOURCE:
${content.slice(0, 4000)}

Respond ONLY with JSON:
{
  "title": "...",
  "whyThisFramework": "one sentence",
  "layers": [{ "key": "one of the field keys above", "value": "..." }],
  "commitments": ["...", "..."],
  "firstAction": {
    "decision": "act",
    "thought": "...",
    "whyItMatters": "...",
    "nextStep": "...",
    "timeOrTrigger": "...",
    "due": "YYYY-MM-DD or null",
    "definitionOfDone": "...",
    "learnIfFails": "...",
    "type": "Process|Immersive",
    "project": "NONE",
    "priority": "High|Medium|Low"
  },
  "obstaclePlan": { "trigger": "...", "response": "..." },
  "review": "Every [day/time], check evidence and choose: continue, adapt, or stop."
}`;
}

function action(
  todayStr: string,
  nextStep: string,
  timeOrTrigger: string,
  definitionOfDone: string,
  extra: Partial<ActionCard> = {},
): ActionCard {
  return normalizeCard(
    {
      decision: "act",
      nextStep,
      timeOrTrigger,
      definitionOfDone,
      type: "Immersive",
      priority: "High",
      ...extra,
    },
    todayStr,
  );
}

export const SAMPLE_GOALS: { label: string; frameworkId: FrameworkId; text: string }[] = [
  {
    label: "Sold three diagnostics",
    frameworkId: "backward_planning",
    text: "By 30 November, I will have sold three paid AI operations diagnostic engagements. I need a tested offer and qualified sales conversations.",
  },
  {
    label: "Overthink outreach",
    frameworkId: "woop",
    text: "I want to book five discovery calls this month but I overthink the wording of outreach and postpone sending it.",
  },
  {
    label: "Uncertain product",
    frameworkId: "agile_decomposition",
    text: "Create a scalable AI-based operations insight product. I don't know yet if consultants and SME operators will pay. Hypothesis: they will pay for a guided workflow that turns operational notes into prioritised improvement actions.",
  },
  {
    label: "Yearly offer ambition",
    frameworkId: "twelve_week_sprint",
    text: "This year's ambition to validate a consulting offer is too remote to act on. I need a 12-week sprint with interviews, a one-page offer, and a paid pilot.",
  },
  {
    label: "Prove myself",
    frameworkId: "outcome_process_identity",
    text: "Close three diagnostic engagements. I keep staring at the revenue scoreboard and it is draining because I am trying to prove myself.",
  },
  {
    label: "Too many tasks",
    frameworkId: "goal_canvas",
    text: "Big goal with too many tasks and no focus: build an AI-enabled consulting offer, landing page, outreach list, diagnostic workflow, and website all at once.",
  },
  {
    label: "Captured thought",
    frameworkId: "action_frame",
    text: "I should improve my consulting offer.",
  },
  {
    label: "$1M income",
    frameworkId: "twelve_week_sprint",
    text: "I earn 1 million dollars",
  },
];

export function fixturePlan(frameworkId: FrameworkId, todayStr: string): FrameworkPlan {
  switch (frameworkId) {
    case "backward_planning":
      return normalizePlan(
        frameworkId,
        {
          title: "Three paid diagnostic engagements",
          whyThisFramework: "The destination is clear; walk backwards until today is a physical step.",
          layers: [
            { key: "end", label: "", value: "By 30 November, sold three paid AI operations diagnostic engagements." },
            { key: "final", label: "", value: "A tested offer and qualified sales conversations." },
            { key: "next", label: "", value: "A clear ideal-client problem and a simple diagnostic format." },
            { key: "week", label: "", value: "Five discovery conversations started." },
          ],
          commitments: [
            "Record the discovery questions",
            "Identify five contacts",
            "Send the first two invitations",
          ],
          firstAction: action(
            todayStr,
            "Record a two-minute voice brief outlining the buyer problem",
            "Today after client work",
            "Voice brief recorded",
            {
              thought: "Sold three paid diagnostics by 30 November.",
              whyItMatters: "Validates the entry offer with real conversations, not more positioning.",
              learnIfFails: "Whether the buyer problem is specific enough to invite against",
            },
          ),
          obstaclePlan: {
            trigger: "I start polishing the offer instead of inviting",
            response: "send the current questions to one suitable contact and log the result",
          },
          review: "Every Friday, check invitations sent and choose: continue, adapt, or stop.",
        },
        todayStr,
      );
    case "woop":
      return normalizePlan(
        frameworkId,
        {
          title: "Book five discovery calls",
          whyThisFramework: "The action is known; the internal obstacle is what stops it.",
          layers: [
            { key: "wish", label: "", value: "Book five discovery calls this month." },
            { key: "outcome", label: "", value: "Clearer market language and potential clients." },
            { key: "obstacle", label: "", value: "I overthink the wording of outreach and postpone sending it." },
          ],
          commitments: ["Send ten tailored messages", "Book three calls", "Log what language they use"],
          firstAction: action(
            todayStr,
            "Send the current outreach draft to one suitable contact",
            "If I spend more than 15 minutes revising, send it then",
            "One message sent and the result logged",
            {
              thought: "Book five discovery calls this month.",
              whyItMatters: "Conversations beat copy polish.",
              learnIfFails: "Whether a ‘good enough’ message still books a call",
              type: "Process",
            },
          ),
          obstaclePlan: {
            trigger: "I spend more than 15 minutes revising a message",
            response: "send the current version to one suitable person and log the result",
          },
          review: "Every Sunday, score sends vs postpones and reset the if–then.",
        },
        todayStr,
      );
    case "agile_decomposition":
      return normalizePlan(
        frameworkId,
        {
          title: "AI operations insight product",
          whyThisFramework: "You cannot honestly know the full plan — test buying intent before building the system.",
          layers: [
            { key: "goal", label: "", value: "Create a scalable AI-based operations insight product." },
            {
              key: "hypothesis",
              label: "",
              value:
                "Consultants and SME operators will pay for a guided workflow that turns operational notes into prioritised improvement actions.",
            },
            {
              key: "test",
              label: "",
              value: "Show a clickable prototype and workflow sample to five target users.",
            },
            {
              key: "evidence",
              label: "",
              value: "At least three say they would trial it, and at least one agrees to a paid pilot conversation.",
            },
            {
              key: "decision",
              label: "",
              value: "If users value the analysis but not the software, package it first as a service-assisted offer.",
            },
          ],
          commitments: [
            "Sketch the workflow sample",
            "List five target users",
            "Book the first prototype walkthrough",
          ],
          firstAction: action(
            todayStr,
            "Sketch a one-page workflow sample for the diagnostic",
            "This week, first 45-minute block",
            "One-page sample ready to show a user",
            {
              thought: "Will they pay for the software, or only the analysis?",
              whyItMatters: "Stops building an entire system before the problem is real.",
              learnIfFails: "Whether the artifact is even intelligible to a target user",
            },
          ),
          obstaclePlan: {
            trigger: "I start adding features to the prototype",
            response: "stop and book the next user walkthrough with the current sample",
          },
          review: "After five walkthroughs, apply the decision rule: continue, re-package as a service, or stop.",
        },
        todayStr,
      );
    case "twelve_week_sprint":
      return normalizePlan(
        frameworkId,
        {
          title: "Validate a consulting offer",
          whyThisFramework: "A yearly ambition is too remote — one primary outcome and lead measures you control.",
          layers: [
            { key: "primary", label: "", value: "Validate a diagnostic offer with interviews and a paid-pilot path." },
            {
              key: "leads",
              label: "",
              value: "Interviews held, tailored messages sent, calls booked, proposals sent, prototype tests completed.",
            },
            { key: "establish", label: "", value: "Weeks 1–4: five interviews and a one-page offer." },
            { key: "build", label: "", value: "Weeks 5–8: usable diagnostic workflow, landing page, and booking path." },
            { key: "validate", label: "", value: "Weeks 9–12: three proposals or one paid pilot." },
          ],
          commitments: [
            "Write five discovery questions",
            "Invite three existing contacts",
            "Block Friday’s 20-minute review",
          ],
          firstAction: action(
            todayStr,
            "Write five discovery questions for ops-manager interviews",
            "Today after client work",
            "Five questions written in one page",
            {
              thought: "Validate the offer in 12 weeks, not by year-end hope.",
              whyItMatters: "Lead measures are controllable; revenue is not, yet.",
              learnIfFails: "Whether the niche/problem is specific enough to interview against",
            },
          ),
          obstaclePlan: {
            trigger: "The week fills with busywork and the interviews slip",
            response: "protect the Friday review and schedule the next interview before closing the laptop",
          },
          review: "Friday 4 pm: score commitments complete / partial / not started, then plan next week.",
        },
        todayStr,
      );
    case "outcome_process_identity":
      return normalizePlan(
        frameworkId,
        {
          title: "Close three diagnostics without deficit-drive",
          whyThisFramework: "A commercially sound goal becomes draining if the engine is ‘prove myself.’",
          layers: [
            { key: "outcome", label: "", value: "Close three diagnostic engagements." },
            {
              key: "process",
              label: "",
              value: "Hold three discovery calls and send ten tailored outreach messages each week.",
            },
            {
              key: "identity",
              label: "",
              value:
                "Show up as a helpful commercial partner. Build evidence, capability, and service through consistent experiments — not proof of worth.",
            },
          ],
          commitments: ["Send ten tailored messages", "Hold three discovery calls", "Log one piece of market language"],
          firstAction: action(
            todayStr,
            "Send five tailored messages to existing business contacts",
            "Tomorrow morning",
            "Five messages sent",
            {
              thought: "Close three engagements by building evidence, not proving worth.",
              whyItMatters: "Process and identity keep the outcome from becoming a scoreboard you stare at.",
              learnIfFails: "Which pain they name first, and whether they will take a 20-minute call",
              type: "Process",
            },
          ),
          obstaclePlan: {
            trigger: "I catch myself refreshing the pipeline instead of contacting someone",
            response: "send one tailored message before I open any dashboard",
          },
          review: "Weekly: score calls and messages sent, not just revenue movement.",
        },
        todayStr,
      );
    case "action_frame":
      return normalizePlan(
        frameworkId,
        {
          title: "Improve the consulting offer — one page, one buyer",
          whyThisFramework: "A thought is not a plan. One observable step beats positioning.",
          layers: [
            { key: "thought", label: "", value: "I should improve my consulting offer." },
            { key: "why", label: "", value: "Vague positioning is motion; a one-page offer for one buyer is a result." },
            { key: "done", label: "", value: "One-page offer drafted for ops managers." },
            { key: "learn", label: "", value: "Whether one buyer type is specific enough to write against." },
          ],
          commitments: ["Draft the one-page offer"],
          firstAction: action(
            todayStr,
            "Draft a one-page offer for ops managers",
            "Today by 4 pm",
            "One page written",
            {
              thought: "I should improve my consulting offer.",
              whyItMatters: "One buyer, one page — not more ideas.",
              learnIfFails: "Where the offer is still vague when forced onto one page",
            },
          ),
          obstaclePlan: null,
          review: "After the page exists, decide: interview three buyers, or not now.",
        },
        todayStr,
      );
    case "goal_canvas":
    default:
      return normalizePlan(
        frameworkId,
        {
          title: "AI-enabled diagnostic offer",
          whyThisFramework: "Default for a big goal: one page, three milestones, 3–5 commitments, one first action.",
          layers: [
            {
              key: "goal",
              label: "",
              value: "By 30 November, achieve three paid AI operations diagnostic engagements.",
            },
            {
              key: "why",
              label: "",
              value: "Builds a repeatable entry offer for an AI-enabled consulting and product business.",
            },
            {
              key: "evidence",
              label: "",
              value: "Three signed engagements, or one paid pilot plus two written proposals.",
            },
            {
              key: "reality",
              label: "",
              value: "Offer is untested; outreach stalls on wording; product vs service is still unknown.",
            },
            {
              key: "milestones",
              label: "",
              value:
                "1. Five interviews and a one-page offer (weeks 1–4). 2. Usable diagnostic and booking path (weeks 5–8). 3. Three proposals or one paid pilot (weeks 9–12).",
            },
          ],
          commitments: [
            "Write five discovery questions",
            "Identify five contacts",
            "Send the first two invitations",
          ],
          firstAction: action(
            todayStr,
            "Record a two-minute voice brief outlining the buyer problem",
            "Tuesday 9:00–9:30 am",
            "Voice brief recorded",
            {
              thought: "Too many tasks, no visible path from outcome to today.",
              whyItMatters: "The canvas is only useful if today’s action is scheduled.",
              learnIfFails: "Whether the buyer problem can be said out loud in two minutes",
            },
          ),
          obstaclePlan: {
            trigger: "I open a new planning doc instead of recording",
            response: "start the two-minute voice brief with the phone already in hand",
          },
          review: "Every Friday, check evidence and choose: continue, adapt, or stop.",
        },
        todayStr,
      );
  }
}
