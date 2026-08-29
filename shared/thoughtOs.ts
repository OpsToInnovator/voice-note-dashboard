// The product is not a notes app. It decides what happens to a thought
// once it appears. Code governs the process. The human retains judgment.
//
// Thought → Interpretation → Classification → Evaluation → Decision → Plan → Execution → Learning

import { lintActionName, normalizeCard, type ActionCard } from "./actionFrame";
import {
  fixturePlan,
  recommendFramework,
  type FrameworkPlan,
  type FrameworkRecommendation,
} from "./frameworks";
import {
  CHANGE_THE_MODEL_STEP,
  assessGoal,
  feasibilityBlocksExecute,
  parseMoneyTarget,
  type GoalCoaching,
} from "./goalCoach";

export const OPERATING_SEQUENCE = [
  { id: "capture", label: "Capture", question: "What was said, unformatted?" },
  { id: "interpret", label: "Interpret", question: "What is actually being expressed?" },
  { id: "agency", label: "Agency", question: "Can the user influence this?" },
  { id: "substance", label: "Substance", question: "Is there anything meaningful here?" },
  { id: "meaning", label: "Meaning", question: "What might they be trying to think?" },
  { id: "stress", label: "Stress-test", question: "Which frameworks earn this thought?" },
  { id: "gate", label: "Decision gate", question: "What is this thought’s destination?" },
  { id: "container", label: "Container", question: "Goal, sequence, rules, cadence, exit?" },
  { id: "execute", label: "Execution", question: "What does the system do next?" },
  { id: "learn", label: "Learning", question: "Expected vs actual — what to encode?" },
] as const;

export const PROPOSITION =
  "The system doesn’t tell you what to think. It determines what should happen next to what you’re thinking.";

export const PROCESS_TRUST =
  "I trust the system to govern the process by which I decide — not to decide for me.";

export type ExpressionKind =
  | "observation"
  | "assumption"
  | "emotion"
  | "hypothesis"
  | "idea"
  | "question"
  | "concern"
  | "decision"
  | "action"
  | "belief";

export type AgencyDisposition = "contain" | "accept" | "archive" | "discard" | "develop";

export type SubstanceVerdict = "develop" | "defer" | "delete" | "reconstruct";

export type ThoughtDestination = "DELETE" | "STORE" | "EXPLORE" | "DECIDE" | "EXECUTE";

export type DecisionTier = 1 | 2 | 3;

export type ProblemFamily = "strategic" | "decision" | "problem" | "behavioural" | "goal" | "capture";

export const SUBSTANCE_DIMENSIONS = [
  "relevance",
  "originality",
  "evidence",
  "strategicValue",
  "consequence",
  "actionability",
  "alignment",
  "depth",
  "reversibility",
  "opportunityCost",
] as const;

export type SubstanceDimension = (typeof SUBSTANCE_DIMENSIONS)[number];

export const STRESS_KITS: Record<ProblemFamily, string[]> = {
  strategic: [
    "First-principles reasoning",
    "Second-order effects",
    "Opportunity cost",
    "Inversion",
    "Competitive differentiation",
  ],
  decision: [
    "Criteria weighting",
    "Reversibility",
    "Expected outcomes",
    "Downside exposure",
    "Pre-mortem",
  ],
  problem: ["Root-cause analysis", "5 Whys", "Systems thinking", "Constraint analysis"],
  behavioural: [
    "Trigger → behaviour → consequence",
    "Implementation intentions",
    "Environmental friction",
    "Reinforcement analysis",
  ],
  goal: [
    "Outcome definition",
    "Goal maths / feasibility",
    "Leading indicators",
    "Named obstacles / if–then",
    "Review cadence",
  ],
  capture: ["Thought → Decision → Next action → Evidence → Learning"],
};

export const DESTINATION_COPY: Record<ThoughtDestination, string> = {
  DELETE: "No meaningful value. Close the loop.",
  STORE: "Useful knowledge; no current action.",
  EXPLORE: "Insufficient understanding. Investigate before deciding.",
  DECIDE: "Enough information exists; a choice is required — the human decides.",
  EXECUTE: "The decision is made. The action sequence begins.",
};

export const TIER_COPY: Record<DecisionTier, { label: string; who: string }> = {
  1: { label: "Tier 1 — AI executes", who: "Low-risk, reversible actions. The system may carry them out." },
  2: { label: "Tier 2 — AI recommends", who: "Moderate consequence. The system proposes; the human confirms." },
  3: { label: "Tier 3 — Human decides", who: "Financial, relational, legal, strategic, or irreversible. Judgment stays human." },
};

export interface InterpretationPart {
  kind: ExpressionKind;
  text: string;
}

export interface Interpretation {
  parts: InterpretationPart[];
  missingEvidence: string;
}

export interface AgencyCheck {
  canInfluence: boolean;
  disposition: AgencyDisposition;
  reason: string;
}

export interface SubstanceGate {
  scores: Partial<Record<SubstanceDimension, number>>;
  verdict: SubstanceVerdict;
  reason: string;
}

export interface MeaningOption {
  id: string;
  label: string;
  idea: string;
  intervention: string;
}

export interface OperatingContainer {
  objective: string;
  sequence: string[];
  guardrails: string[];
  cadence: string;
  review: string;
  exit: string;
}

export interface LearningFrame {
  expected: string;
  questions: string[];
}

export interface ThoughtRecord {
  original: string;
  interpretation: Interpretation;
  agency: AgencyCheck;
  substance: SubstanceGate;
  reconstructions: MeaningOption[];
  confirmedMeaningId: string | null;
  family: ProblemFamily;
  stressKit: string[];
  framework: FrameworkRecommendation | null;
  destination: ThoughtDestination;
  destinationReason: string;
  tier: DecisionTier;
  container: OperatingContainer | null;
  plan: FrameworkPlan | null;
  firstAction: ActionCard | null;
  learning: LearningFrame;
  /** Goal Coach engine — type, outcome lint, feasibility maths, named obstacles. */
  coach: GoalCoaching | null;
  usedFixture: boolean;
}

const NO_AGENCY =
  /\b(weather|can't control|cannot control|out of my hands|nothing i can do|the market will do|other people (will|always)|fate|luck)\b/i;

const DEVELOP_AGENCY =
  /\b(we should|i should|i will|i can|i earn|change how|redesign|price|offer|send|book|write|interview|build|decide|test|million|income)\b/i;

const TIER_3 =
  /\b(pric(?:e|ing)|fire|legal|contract|hire|spend|\$|revenue|million|income|irreversible|resign|relationship|strategy|architecture|equity|litigation)\b/i;

const TIER_1 =
  /\b(send|record|file|log|schedule|remind|draft a message|invite|book a time)\b/i;

const WEAK_CAPTURE = /^(hmm+|idk|lol|ok|yeah|nah|random|whatever)\.?$/i;

const FAMILY_RULES: { id: ProblemFamily; patterns: RegExp[] }[] = [
  {
    id: "behavioural",
    patterns: [/\b(overthink|postpone|avoid|procrastinat|stuck|habit|keep putting off|don't send)\b/i],
  },
  {
    id: "decision",
    patterns: [/\b(should we|decide|choose|or not|go ahead|kill the|commit to|which option)\b/i],
  },
  {
    id: "strategic",
    patterns: [
      /\b(positioning|competitive|offer|value architecture|pric(?:e|ing)|market|moat|differentiat)\b/i,
    ],
  },
  {
    id: "problem",
    patterns: [/\b(root cause|broken|why (is|are|does)|bottleneck|failing|confusion|don't understand)\b/i],
  },
  {
    id: "goal",
    patterns: [/\b(by \d|12[- ]week|this year|goal|milestone|i will have|sprint|million|i earn|income target)\b/i],
  },
];

export function classifyFamily(text: string): ProblemFamily {
  for (const rule of FAMILY_RULES) {
    if (rule.patterns.some((re) => re.test(text))) return rule.id;
  }
  return text.trim().split(/\s+/).length <= 18 ? "capture" : "strategic";
}

export function checkAgency(text: string): AgencyCheck {
  if (NO_AGENCY.test(text)) {
    return {
      canInfluence: false,
      disposition: "accept",
      reason: "Nothing here is in the user’s control. Contain it; do not start a project.",
    };
  }
  if (WEAK_CAPTURE.test(text.trim())) {
    return {
      canInfluence: false,
      disposition: "discard",
      reason: "No actionable content. Discard rather than inflate.",
    };
  }
  if (DEVELOP_AGENCY.test(text)) {
    return {
      canInfluence: true,
      disposition: "develop",
      reason: "The thought names something the user can influence.",
    };
  }
  return {
    canInfluence: false,
    disposition: "archive",
    reason: "Unclear influence. Archive until a lever appears.",
  };
}

export function scoreSubstance(text: string): SubstanceGate {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (WEAK_CAPTURE.test(text.trim()) || words < 4) {
    return {
      scores: { relevance: 1, depth: 1, actionability: 1, evidence: 1 },
      verdict: "delete",
      reason: "No substantive value detected — delete.",
    };
  }
  if (/\b(probably|maybe|i keep thinking|customers probably)\b/i.test(text) && words >= 12) {
    return {
      scores: { relevance: 7, originality: 5, evidence: 2, strategicValue: 8, actionability: 4, depth: 4 },
      verdict: "reconstruct",
      reason:
        "This thought appears weak as currently expressed, but it may be pointing toward a clearer idea underneath.",
    };
  }
  if (words <= 18 && /\b(i should|send|book|write)\b/i.test(text)) {
    return {
      scores: { relevance: 6, actionability: 8, evidence: 4, depth: 3 },
      verdict: "develop",
      reason: "Narrow and actionable. Develop the next step; do not build a project around it.",
    };
  }
  if (words > 40) {
    return {
      scores: { relevance: 6, depth: 5, actionability: 4, opportunityCost: 7 },
      verdict: "defer",
      reason: "Capture but defer — too many threads to consume attention until one is chosen.",
    };
  }
  return {
    scores: { relevance: 6, actionability: 5, depth: 5, evidence: 3 },
    verdict: "develop",
    reason: "Enough substance to develop without becoming a project by default.",
  };
}

export function classifyTier(text: string): DecisionTier {
  if (TIER_3.test(text)) return 3;
  if (TIER_1.test(text)) return 1;
  return 2;
}

export function decideDestination(input: {
  agency: AgencyCheck;
  substance: SubstanceGate;
  family: ProblemFamily;
  confirmedMeaningId: string | null;
  reconstructions: MeaningOption[];
  missingEvidence: string;
  firstAction: ActionCard | null;
  tier: DecisionTier;
}): { destination: ThoughtDestination; reason: string } {
  if (input.agency.disposition === "discard" || input.substance.verdict === "delete") {
    return { destination: "DELETE", reason: DESTINATION_COPY.DELETE };
  }
  if (!input.agency.canInfluence) {
    return {
      destination: "STORE",
      reason: "No agency — store or accept. Do not turn this into a project.",
    };
  }
  if (input.substance.verdict === "defer") {
    return { destination: "STORE", reason: DESTINATION_COPY.STORE };
  }
  if (input.substance.verdict === "reconstruct" && !input.confirmedMeaningId) {
    return {
      destination: "EXPLORE",
      reason: "Possible underlying idea detected. Confirm which meaning is closest before more work.",
    };
  }

  const meaning = input.reconstructions.find((r) => r.id === input.confirmedMeaningId);
  if (meaning?.id === "A" && input.tier === 3) {
    return {
      destination: "DECIDE",
      reason: "A choice is on the table. Tier 3 — the human decides; the system structures the choice.",
    };
  }
  if (
    input.missingEvidence.trim() &&
    (input.family === "strategic" ||
      input.family === "problem" ||
      meaning?.id === "B" ||
      meaning?.id === "C")
  ) {
    return { destination: "EXPLORE", reason: DESTINATION_COPY.EXPLORE };
  }
  if (input.tier === 3 && (input.family === "decision" || input.family === "strategic")) {
    return { destination: "DECIDE", reason: TIER_COPY[3].who };
  }

  const actionOk = Boolean(input.firstAction && !lintActionName(input.firstAction.nextStep).weak);
  if (actionOk && input.tier === 1) {
    return { destination: "EXECUTE", reason: DESTINATION_COPY.EXECUTE };
  }
  if (actionOk && input.tier === 3) {
    return {
      destination: "DECIDE",
      reason: "A next action exists, but consequence is Tier 3. Recommend only — do not execute.",
    };
  }
  if (actionOk && input.tier === 2) {
    return { destination: "EXECUTE", reason: DESTINATION_COPY.EXECUTE };
  }
  return { destination: "EXPLORE", reason: DESTINATION_COPY.EXPLORE };
}

export function learningQuestions(destination: ThoughtDestination): string[] {
  return [
    "What happened?",
    "What assumption was wrong?",
    "What worked?",
    "What should be encoded?",
    destination === "DECIDE" || destination === "EXECUTE"
      ? "Should the decision model change?"
      : "Was this even worth attention?",
  ];
}

export function normalizeThought(
  raw: Partial<ThoughtRecord> & { original: string },
  todayStr: string,
): ThoughtRecord {
  const original = raw.original.trim();
  const agency = raw.agency ?? checkAgency(original);
  const substance = raw.substance ?? scoreSubstance(original);
  const family = raw.family ?? classifyFamily(original);
  const tier = raw.tier ?? classifyTier(original);
  const reconstructions = (raw.reconstructions || []).slice(0, 3);
  const confirmedMeaningId = raw.confirmedMeaningId ?? null;
  const interpretation: Interpretation = {
    parts: raw.interpretation?.parts || [],
    missingEvidence: raw.interpretation?.missingEvidence || "",
  };

  const framework =
    agency.canInfluence && substance.verdict !== "delete"
      ? raw.framework ?? recommendFramework(original)
      : null;

  let plan = raw.plan ?? null;
  let firstAction = raw.firstAction ? normalizeCard(raw.firstAction, todayStr) : plan?.firstAction || null;
  const coach = raw.coach !== undefined ? raw.coach : assessGoal(original);

  let gate = decideDestination({
    agency,
    substance,
    family,
    confirmedMeaningId,
    reconstructions,
    missingEvidence: interpretation.missingEvidence,
    firstAction,
    tier,
  });

  const meaningsOpen = substance.verdict === "reconstruct" && !confirmedMeaningId;
  if (
    feasibilityBlocksExecute(coach) &&
    !meaningsOpen &&
    (gate.destination === "EXECUTE" || gate.destination === "EXPLORE")
  ) {
    gate = {
      destination: "DECIDE",
      reason: `Goal maths say stop: ${coach!.feasibility!.verdict!.text} Change the model before executing volume.`,
    };
  }

  if (feasibilityBlocksExecute(coach) && gate.destination !== "DELETE" && gate.destination !== "STORE") {
    firstAction = normalizeCard(
      {
        decision: "act",
        thought: original,
        whyItMatters: "The current model cannot physically hit the target. Volume is not the fix.",
        nextStep: CHANGE_THE_MODEL_STEP,
        timeOrTrigger: "Today after client work",
        definitionOfDone: "One page with price, hours, and a non-hours-scaled alternative",
        learnIfFails: "Which lever — price, hours, productisation, or capacity — is actually movable",
        type: "Immersive",
        priority: "High",
      },
      todayStr,
    );
  }

  if (gate.destination === "DELETE" || gate.destination === "STORE") {
    plan = null;
    firstAction = null;
  }
  if (gate.destination === "EXECUTE" && firstAction && lintActionName(firstAction.nextStep).weak) {
    firstAction = null;
  }
  if (gate.destination !== "EXECUTE" && gate.destination !== "DECIDE") {
    plan = null;
  }

  const keepWork = gate.destination === "EXPLORE" || gate.destination === "DECIDE" || gate.destination === "EXECUTE";

  let container = keepWork ? raw.container ?? null : null;
  if (keepWork && feasibilityBlocksExecute(coach)) {
    const extra = "Do not scale outreach or volume until the model clears the feasibility stop";
    if (container) {
      if (!container.guardrails.includes(extra)) {
        container = { ...container, guardrails: [...container.guardrails, extra] };
      }
    } else {
      container = {
        objective: "Decide how the model changes so the target is physically possible.",
        sequence: [
          "Name the binding constraint from the maths",
          "Choose: raise price, cut delivery hours, productise, add capacity, or drop the target",
          "Write the chosen model on one page",
        ],
        guardrails: [extra],
        cadence: "Weekly 20-minute model review",
        review: (coach?.reviewRules || []).slice(0, 3).join("; "),
        exit: "A model that clears capacity, or a conscious not-now on the target",
      };
    }
  }

  return {
    original,
    interpretation,
    agency,
    substance,
    reconstructions,
    confirmedMeaningId,
    family,
    stressKit: STRESS_KITS[family],
    framework,
    destination: gate.destination,
    destinationReason: gate.reason,
    tier,
    container,
    plan,
    firstAction: keepWork ? firstAction : null,
    learning: {
      expected: raw.learning?.expected || "",
      questions: raw.learning?.questions?.length ? raw.learning.questions : learningQuestions(gate.destination),
    },
    coach,
    usedFixture: Boolean(raw.usedFixture),
  };
}

export const SAMPLE_THOUGHTS: { label: string; text: string }[] = [
  {
    label: "Pricing confusion",
    text: "I keep thinking we should change how we price this because customers probably don’t understand what they’re actually buying.",
  },
  {
    label: "Out of my hands",
    text: "The market will do what it does this quarter. Nothing I can do about the weather around this deal.",
  },
  {
    label: "Send the invoice",
    text: "I should send the overdue invoice this afternoon.",
  },
  {
    label: "Noise",
    text: "idk lol",
  },
  {
    label: "Overthink outreach",
    text: "I want to book five discovery calls this month but I overthink the wording of outreach and postpone sending it.",
  },
  {
    label: "$1M income",
    text: "I earn 1 million dollars",
  },
];

export function fixtureThought(
  text: string,
  todayStr: string,
  confirmedMeaningId: string | null = null,
): ThoughtRecord {
  const t = text.trim();

  if (WEAK_CAPTURE.test(t) || t.toLowerCase() === "idk lol") {
    return normalizeThought(
      {
        original: t,
        interpretation: { parts: [{ kind: "emotion", text: "Undirected noise." }], missingEvidence: "" },
        usedFixture: true,
      },
      todayStr,
    );
  }

  if (NO_AGENCY.test(t)) {
    return normalizeThought(
      {
        original: t,
        interpretation: {
          parts: [
            { kind: "observation", text: "External conditions the user does not control." },
            { kind: "belief", text: "Effort here would not change the outcome." },
          ],
          missingEvidence: "",
        },
        usedFixture: true,
      },
      todayStr,
    );
  }

  if (/overthink|postpone/i.test(t)) {
    const plan = fixturePlan("woop", todayStr);
    return normalizeThought(
      {
        original: t,
        interpretation: {
          parts: [
            { kind: "action", text: "Book discovery calls." },
            { kind: "concern", text: "Wording is being used to delay sending." },
          ],
          missingEvidence: "Whether a ‘good enough’ message still books a call.",
        },
        family: "behavioural",
        framework: recommendFramework(t),
        plan,
        firstAction: plan.firstAction,
        container: {
          objective: "Book five discovery calls this month.",
          sequence: ["Send current draft to one person", "Log the result", "Repeat until five calls are booked"],
          guardrails: [
            "If revising exceeds 15 minutes, send anyway",
            "Do not open a new positioning doc this week",
          ],
          cadence: "Daily send block, 20 minutes",
          review: "Sunday: score sends vs postpones",
          exit: "Five calls booked, or the offer is paused by a conscious not-now",
        },
        learning: {
          expected: "A good-enough message still produces conversations.",
          questions: learningQuestions("EXECUTE"),
        },
        usedFixture: true,
      },
      todayStr,
    );
  }

  if (parseMoneyTarget(t) && /million|i earn|income/i.test(t)) {
    return normalizeThought(
      {
        original: t,
        interpretation: {
          parts: [
            { kind: "idea", text: "A large income target stated as an achieved result." },
            { kind: "assumption", text: "Hours-based delivery can scale to that number." },
            { kind: "decision", text: "If the maths fail, the model has to change — price, hours, productisation, or capacity." },
          ],
          missingEvidence: "Whether price, delivery hours, or productisation can move enough to clear capacity.",
        },
        family: "goal",
        framework: recommendFramework(t),
        container: {
          objective: "Decide how the income model changes so the target is physically possible.",
          sequence: [
            "Run services maths at current price and capacity",
            "Name the binding constraint",
            "Choose: raise price, cut hours, productise, add capacity, or drop the target",
          ],
          guardrails: ["Do not scale outreach until the model clears capacity"],
          cadence: "Weekly 20-minute model review",
          review: "After the one-pager: continue only if the model clears capacity",
          exit: "A feasible model, or a conscious not-now on the target",
        },
        learning: {
          expected: "The binding constraint is named before any volume plan is executed.",
          questions: learningQuestions("DECIDE"),
        },
        usedFixture: true,
      },
      todayStr,
    );
  }

  if (/invoice/i.test(t)) {
    const firstAction = normalizeCard(
      {
        decision: "act",
        thought: t,
        whyItMatters: "Cash collection is reversible and mechanical.",
        nextStep: "Send the overdue invoice this afternoon",
        timeOrTrigger: "Today after lunch",
        definitionOfDone: "Invoice sent",
        learnIfFails: "Whether the block was process or avoidance",
        type: "Process",
        priority: "High",
      },
      todayStr,
    );
    return normalizeThought(
      {
        original: t,
        interpretation: {
          parts: [{ kind: "action", text: "Send the overdue invoice." }],
          missingEvidence: "",
        },
        firstAction,
        container: {
          objective: "Collect the outstanding invoice.",
          sequence: ["Send invoice", "Log send time", "Follow up in five days if unpaid"],
          guardrails: ["Do not rewrite the invoice unless a factual error exists"],
          cadence: "One send, one follow-up",
          review: "After send: was this delayed by avoidance?",
          exit: "Paid, or a conscious write-off",
        },
        usedFixture: true,
      },
      todayStr,
    );
  }

  const reconstructions: MeaningOption[] = [
    {
      id: "A",
      label: "A",
      idea: "Pricing is wrong.",
      intervention: "Redesign the price points. High consequence; human decides.",
    },
    {
      id: "B",
      label: "B",
      idea: "The offer isn’t sufficiently legible.",
      intervention: "Test whether customers can explain what they buy before touching price.",
    },
    {
      id: "C",
      label: "C",
      idea: "Customers don’t understand the value architecture.",
      intervention: "Map the value story; change communication before changing the model.",
    },
  ];

  const firstAction = normalizeCard(
    {
      decision: "act",
      thought: t,
      whyItMatters: "Missing evidence: whether customers actually misunderstand.",
      nextStep: "Write five interview questions about what customers think they bought",
      timeOrTrigger: "Today after client work",
      definitionOfDone: "Five questions written",
      learnIfFails: "Whether the confusion can be stated in the customer’s language",
      type: "Immersive",
      priority: "High",
    },
    todayStr,
  );

  return normalizeThought(
    {
      original: t || SAMPLE_THOUGHTS[0].text,
      interpretation: {
        parts: [
          { kind: "observation", text: "Customers appear confused about what they are buying." },
          { kind: "assumption", text: "The pricing structure may be the cause." },
          { kind: "hypothesis", text: "Pricing communication — not necessarily price — is the issue." },
          { kind: "decision", text: "Potential decision: redesign pricing communication." },
        ],
        missingEvidence: "Whether customers actually misunderstand the offer.",
      },
      reconstructions,
      confirmedMeaningId,
      family: classifyFamily(t),
      framework: recommendFramework(t),
      firstAction,
      container: {
        objective: "Validate whether pricing, offer legibility, or value architecture is the real issue.",
        sequence: [
          "Interview five customers about what they think they bought",
          "Capture recurring confusion in their words",
          "Produce three communication or pricing alternatives only after interviews",
          "Test each against decision criteria",
          "Select one",
          "Run a 30-day trial",
        ],
        guardrails: [
          "No redesign before five interviews",
          "No adding additional pricing models during the test",
          "Review only after sufficient evidence",
          "Reopen the decision only if new material evidence emerges",
        ],
        cadence: "Weekly 20-minute evidence review",
        review: "After five interviews: continue, adapt, or stop",
        exit: "A confirmed meaning plus a Tier-3 decision, or a conscious not-now",
      },
      learning: {
        expected: "Five interviews show whether the issue is price, legibility, or value architecture.",
        questions: learningQuestions("EXPLORE"),
      },
      usedFixture: true,
    },
    todayStr,
  );
}

export function buildThoughtPrompt(content: string, confirmedMeaningId: string | null, todayStr: string): string {
  return `You operate a thought operating system. You do not tell the user what to think.
You determine what should happen next to what they are thinking.
You govern process: structure, sequencing, challenge, framework selection, follow-through.
The human retains values, judgment, accountability, and irreversible decisions.

SEQUENCE: Capture → Interpret → Agency → Substance → Meaning → Stress-test → Decision gate → Container → Execution → Learning

Preserve the original wording. Do not prettify it.

Separate what is being expressed into kinds: observation, assumption, emotion, hypothesis, idea, question, concern, decision, action, belief.

Agency: can the user influence this? If no: contain / accept / archive / discard. If yes: develop.

Substance verdict: develop | defer | delete | reconstruct.
If the thought is weak as expressed but may hide a better idea, use reconstruct and offer exactly 3 plausible meanings (A, B, C) with different interventions.

Destinations: DELETE, STORE, EXPLORE, DECIDE, EXECUTE.
Tier 1 AI may execute reversible mechanics. Tier 2 recommend. Tier 3 human decides (money, legal, relational, strategy, irreversible). Never EXECUTE a Tier 3 thought.

Today is ${todayStr}.
Confirmed meaning id (if any): ${confirmedMeaningId || "none"}

SOURCE:
${content.slice(0, 4000)}

Respond ONLY with JSON matching:
{
  "interpretation": { "parts": [{ "kind": "observation", "text": "..." }], "missingEvidence": "..." },
  "agency": { "canInfluence": true, "disposition": "develop", "reason": "..." },
  "substance": { "scores": { "relevance": 0, "evidence": 0 }, "verdict": "reconstruct", "reason": "..." },
  "reconstructions": [{ "id": "A", "label": "A", "idea": "...", "intervention": "..." }],
  "family": "strategic|decision|problem|behavioural|goal|capture",
  "firstAction": { "decision": "act", "thought": "...", "whyItMatters": "...", "nextStep": "...", "timeOrTrigger": "...", "due": null, "definitionOfDone": "...", "learnIfFails": "...", "type": "Process", "project": "NONE", "priority": "Medium" },
  "container": { "objective": "...", "sequence": ["..."], "guardrails": ["..."], "cadence": "...", "review": "...", "exit": "..." },
  "learning": { "expected": "..." }
}`;
}

export function thoughtCatalog() {
  return {
    proposition: PROPOSITION,
    processTrust: PROCESS_TRUST,
    sequence: OPERATING_SEQUENCE,
    destinations: DESTINATION_COPY,
    tiers: TIER_COPY,
    stressKits: STRESS_KITS,
    samples: SAMPLE_THOUGHTS,
  };
}
