// Coaching engine taken from Goal Coach: type, diagnostics, maths, obstacles, phases.
// Used after a thought earns attention — never as a 10-step wizard for every capture.

export type GoalTypeKey = "money" | "build" | "career" | "body" | "skill" | "system" | "other";

export type MoneyModel = "services" | "subscription" | "product" | "investment";

export type NoteLevel = "ok" | "warn" | "stop";

export interface CoachNote {
  level: NoteLevel;
  text: string;
}

export interface MathRow {
  label: string;
  value: string;
  note?: string;
}

export interface FunnelRow {
  label: string;
  total: string;
  perWeek: string;
}

export interface Feasibility {
  rows: MathRow[];
  verdict: CoachNote | null;
  funnel?: FunnelRow[];
  model: MoneyModel | "generic";
}

export interface NamedObstacle {
  key: string;
  label: string;
  trigger: string;
  plan: string;
}

export interface PhaseTemplate {
  name: string;
  focus: string;
  done: string;
}

export interface GoalTypeMeta {
  key: GoalTypeKey;
  label: string;
  blurb: string;
  chainSeed: string;
  leadMeasures: string[];
  obstacles: string[];
}

export interface GoalCoaching {
  type: GoalTypeKey;
  typeLabel: string;
  blurb: string;
  chainSeed: string;
  outcomeNotes: CoachNote[];
  horizonMonths: number;
  horizonNote: CoachNote | null;
  feasibility: Feasibility | null;
  obstacles: NamedObstacle[];
  phases: PhaseTemplate[];
  leadMeasures: string[];
  reviewRules: string[];
}

export const CHANGE_THE_MODEL_STEP =
  "Write the current price, weekly delivery hours, and one productised alternative on one page";

export const GOAL_TYPES: Record<GoalTypeKey, GoalTypeMeta> = {
  money: {
    key: "money",
    label: "Money or revenue",
    blurb: "Income, revenue, profit, capital or a funding target.",
    chainSeed: "Enough paid delivery capacity and a signed pipeline to cover the target",
    leadMeasures: [
      "Qualified conversations booked per week",
      "Tailored outreach messages sent per week",
      "Proposals or offers issued per week",
      "Offer or pricing experiments shipped per week",
    ],
    obstacles: ["perfectionism", "avoid-outreach", "context-switch", "unclear-next", "fear-rejection", "busywork"],
  },
  build: {
    key: "build",
    label: "Build or launch",
    blurb: "A product, app, venture, book, offer or service that does not exist yet.",
    chainSeed: "A working version real users can pay for and keep using",
    leadMeasures: [
      "User or buyer interviews completed per week",
      "Shippable increments deployed per week",
      "Prototype tests run with real users per week",
      "Paid pilot conversations held per week",
    ],
    obstacles: ["perfectionism", "build-before-validate", "scope-creep", "context-switch", "unclear-next"],
  },
  career: {
    key: "career",
    label: "Career or positioning",
    blurb: "A role, promotion, reputation, speaking platform or authority position.",
    chainSeed: "Visible, verifiable evidence that you already operate at that level",
    leadMeasures: [
      "Targeted applications or pitches submitted per week",
      "Warm introductions requested per week",
      "Conversations with decision-makers per week",
      "Public artefacts published per week",
    ],
    obstacles: ["fear-rejection", "perfectionism", "unclear-next", "comparison", "busywork"],
  },
  body: {
    key: "body",
    label: "Health or physical performance",
    blurb: "Weight, strength, endurance, sleep, bloodwork or an event.",
    chainSeed: "A training and nutrition routine you have already sustained for a month",
    leadMeasures: [
      "Training sessions completed per week",
      "Days hitting the protein or calorie target per week",
      "Nights with 7+ hours sleep per week",
      "Weekly weigh-ins or measurements logged",
    ],
    obstacles: ["all-or-nothing", "context-switch", "low-energy", "unclear-next", "social-friction"],
  },
  skill: {
    key: "skill",
    label: "Skill, study or credential",
    blurb: "A qualification, capability, language, exam or demonstrable competence.",
    chainSeed: "Repeated demonstration of the skill under real conditions",
    leadMeasures: [
      "Deliberate practice hours completed per week",
      "Problems, exercises or reps completed per week",
      "Artefacts produced and reviewed per week",
      "Mock assessments taken per week",
    ],
    obstacles: ["passive-consumption", "context-switch", "unclear-next", "perfectionism", "low-energy"],
  },
  system: {
    key: "system",
    label: "Organisational or process change",
    blurb: "An operating model, workflow, automation, team capability or culture shift.",
    chainSeed: "The new way of working is easier than the old way for the people doing it",
    leadMeasures: [
      "Process observations or interviews completed per week",
      "Improvements implemented and measured per week",
      "Stakeholder alignment conversations per week",
      "Standard work or automation artefacts published per week",
    ],
    obstacles: ["no-sponsor", "busywork", "context-switch", "unclear-next", "social-friction"],
  },
  other: {
    key: "other",
    label: "Something else",
    blurb: "Anything with a clear finish line that does not fit the categories above.",
    chainSeed: "Every dependency you do not control has been confirmed",
    leadMeasures: [
      "Decisions closed per week",
      "Actions completed per week",
      "Conversations held per week",
      "Artefacts produced per week",
    ],
    obstacles: ["unclear-next", "context-switch", "perfectionism", "busywork"],
  },
};

export const OBSTACLES: Record<string, Omit<NamedObstacle, "key">> = {
  perfectionism: {
    label: "I over-polish and delay releasing things",
    trigger: "I have spent more than 20 minutes refining something that is already usable",
    plan: "send or publish the current version to one real person and log the response",
  },
  "avoid-outreach": {
    label: "I avoid reaching out to people directly",
    trigger: "I notice I am researching a prospect instead of contacting them",
    plan: "stop research, write four sentences, and send it before opening another tab",
  },
  "build-before-validate": {
    label: "I build features before anyone has asked to pay",
    trigger: "I open the editor to build something no user has requested",
    plan: "close it and book one conversation with a target user first",
  },
  "scope-creep": {
    label: "The scope keeps expanding",
    trigger: "A new idea appears mid-sprint",
    plan: "write it in a parked list and continue the current commitment untouched",
  },
  "context-switch": {
    label: "I jump between projects and lose the thread",
    trigger: "I feel the urge to switch to a different project mid-block",
    plan: "finish the current 25-minute block, then decide at the break, not during",
  },
  "unclear-next": {
    label: "I stall because the next step is unclear",
    trigger: "I cannot name the next physical action within 60 seconds",
    plan: "write the smallest 10-minute version of the step and do that instead",
  },
  "fear-rejection": {
    label: "I hesitate because I might be rejected or judged",
    trigger: "I feel resistance before sending or asking",
    plan: "send it anyway and record the outcome as data, not as a verdict on me",
  },
  busywork: {
    label: "I do visible admin instead of the hard thing",
    trigger: "I start tidying, reorganising or re-planning during a work block",
    plan: "stop and spend the remaining block on the single highest-leverage commitment",
  },
  "all-or-nothing": {
    label: "One missed day makes me abandon the streak",
    trigger: "I miss a planned session or slip on the plan",
    plan: "do the 10-minute minimum version the same day and never miss twice in a row",
  },
  "low-energy": {
    label: "Energy runs out before the work happens",
    trigger: "I reach the block feeling depleted",
    plan: "do the pre-defined minimum version and move the block earlier tomorrow",
  },
  "social-friction": {
    label: "Other people’s expectations pull me off plan",
    trigger: "Someone asks for my time inside a protected block",
    plan: "offer a specific alternative time instead of saying yes on the spot",
  },
  "passive-consumption": {
    label: "I consume content instead of practising",
    trigger: "I have been reading or watching for more than 15 minutes without producing anything",
    plan: "close the material and do one rep, exercise or artefact from memory",
  },
  "no-sponsor": {
    label: "The change has no real owner or sponsor",
    trigger: "I am progressing without a named decision-maker backing it",
    plan: "book 15 minutes with the accountable leader before doing more work",
  },
  comparison: {
    label: "I compare myself to others and freeze",
    trigger: "I notice I am scrolling other people’s progress",
    plan: "close the feed and complete one commitment from my own plan",
  },
};

export const PHASE_TEMPLATES: Record<GoalTypeKey, PhaseTemplate[]> = {
  money: [
    { name: "Establish", focus: "Pick one buyer and one offer, run discovery conversations, set the price", done: "Five buyer conversations completed and a one-page offer written" },
    { name: "Build", focus: "Create the delivery method, proof assets and booking path", done: "A usable offer, proof asset and a live way to book" },
    { name: "Validate", focus: "Outreach at volume, proposals, close and deliver the first paid work", done: "Proposals issued and first paid engagement delivered" },
  ],
  build: [
    { name: "Validate", focus: "Interview target users, define the one job to be done", done: "Five interviews and a written problem statement with quotes" },
    { name: "Build thinnest slice", focus: "Ship the smallest end-to-end version to real users", done: "Live version used by at least three real users" },
    { name: "Prove", focus: "Retention, pricing and a paid pilot", done: "Paying users and a decision on continue, change or stop" },
  ],
  career: [
    { name: "Evidence", focus: "Assemble proof of level: results, artefacts, references", done: "A written evidence pack and updated positioning" },
    { name: "Access", focus: "Warm introductions, targeted approaches, visibility", done: "Conversations with five decision-makers" },
    { name: "Convert", focus: "Interviews, negotiation, decision", done: "Written offer or confirmed placement" },
  ],
  body: [
    { name: "Baseline", focus: "Measure, set the minimum viable routine, remove friction", done: "Four consecutive weeks of the routine completed" },
    { name: "Load", focus: "Progressive overload and nutrition consistency", done: "Measurable progression logged every week" },
    { name: "Peak", focus: "Push toward the target metric, then hold it", done: "Target metric hit and sustained for two weeks" },
  ],
  skill: [
    { name: "Foundations", focus: "First principles, core vocabulary, first reps", done: "Able to complete basic problems unaided" },
    { name: "Application", focus: "Build real artefacts under real constraints", done: "Three artefacts produced and reviewed" },
    { name: "Assessment", focus: "Mock tests, feedback loops, gap closing", done: "Passing standard reached on a mock assessment" },
  ],
  system: [
    { name: "See the work", focus: "Map the current process and measure it honestly", done: "Baseline metric and mapped process signed off" },
    { name: "Change one thing", focus: "Pilot the improvement in one area with measurement", done: "Pilot result measured against baseline" },
    { name: "Standardise", focus: "Roll out, document, hand ownership over", done: "Adopted across scope with an owner named" },
  ],
  other: [
    { name: "Clarify", focus: "Resolve unknowns and confirm dependencies", done: "All unknowns either answered or scheduled" },
    { name: "Execute", focus: "Do the main body of work", done: "Core work complete" },
    { name: "Close", focus: "Finish, verify and hand over", done: "Evidence of completion in hand" },
  ],
};

export const REVIEW_RULES = [
  "Continue — evidence is trending toward the milestone",
  "Adapt — the goal holds but the method is not producing evidence",
  "Narrow — cut scope to protect the one outcome that matters",
  "Delegate or automate — the work is necessary but should not be mine",
  "Stop — the evidence says this is not the right goal now",
];

export const SERVICES_DEFAULTS = {
  price: 15000,
  margin: 70,
  closeRate: 30,
  convRate: 40,
  replyRate: 8,
  deliveryHours: 60,
  capacity: 25,
};

export const SUBSCRIPTION_DEFAULTS = {
  arpu: 49,
  margin: 85,
  churn: 5,
  trialConv: 15,
  visitorConv: 3,
};

export const PRODUCT_DEFAULTS = {
  price: 199,
  margin: 60,
  convRate: 2,
};

export const INVESTMENT_DEFAULTS = {
  capital: 150000,
  contribution: 4000,
  ret: 8,
};

const VAGUE_WORDS = [
  "more", "better", "improve", "grow", "increase", "successful", "success", "some", "soon",
  "lots", "enough", "happier", "stronger", "fitter", "scale", "optimise", "optimize", "crush",
];
const HEDGES = ["try", "trying", "hopefully", "maybe", "aim to", "want to", "would like", "should"];

type FieldMap = Record<string, number>;

const moneyFmt = (n: number) => "$" + Math.round(n).toLocaleString("en-AU");
const numFmt = (n: number, d = 1) => Number(n).toLocaleString("en-AU", { maximumFractionDigits: d });

function g(f: FieldMap, key: string, dflt = 0): number {
  const n = Number(f[key]);
  return Number.isFinite(n) ? n : dflt;
}

export function verdictTag(level: NoteLevel | undefined | null): string {
  if (level === "ok") return "Plausible";
  if (level === "warn") return "Stretch";
  if (level === "stop") return "Change the model";
  return "";
}

export function obstacleToIfThen(obstacle: NamedObstacle): { trigger: string; response: string } {
  return { trigger: obstacle.trigger, response: obstacle.plan };
}

export function parseMoneyTarget(text: string): number | null {
  const million = text.match(/(\d+(?:\.\d+)?)\s*million/i);
  if (million) return Number(million[1]) * 1_000_000;
  const compactM = text.match(/\$?\s*(\d+(?:\.\d+)?)\s*m\b/i);
  if (compactM && /\$|million|income|revenue|earn/i.test(text)) return Number(compactM[1]) * 1_000_000;
  const k = text.match(/\$?\s*([\d,]+)\s*k\b/i);
  if (k) return Number(k[1].replace(/,/g, "")) * 1000;
  const dollar = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  if (dollar) return Number(dollar[1].replace(/,/g, ""));
  return null;
}

export function inferHorizonMonths(text: string, fallback = 12): number {
  const months = text.match(/(\d+(?:\.\d+)?)\s*months?\b/i);
  if (months) return Math.max(Number(months[1]), 0.5);
  if (/12[- ]week|twelve week/i.test(text)) return 3;
  const weeks = text.match(/(\d+)\s*weeks?\b/i);
  if (weeks) return Math.max(Number(weeks[1]) / 4.345, 0.5);
  if (/\b(this year|annual|yearly|12 months)\b/i.test(text)) return 12;
  return fallback;
}

export function diagnoseHorizon(months: number): CoachNote {
  const weeks = months * 4.345;
  if (weeks < 2) {
    return {
      level: "warn",
      text: "Under two weeks. That is a task, not a goal — run it as a single project instead.",
    };
  }
  if (weeks > 260) {
    return {
      level: "warn",
      text: "Beyond five years, motivation cannot reach. Keep the vision, but set the goal date at the first point where you would have real proof.",
    };
  }
  return {
    level: "ok",
    text: `${Math.round(weeks)} weeks available — ${Math.round((weeks / 12) * 10) / 10} sprints of twelve weeks.`,
  };
}

export function inferMoneyModel(text: string): MoneyModel {
  const t = text.toLowerCase();
  if (/\b(saas|subscription|mrr|arr|churn|seats|recurring)\b/.test(t)) return "subscription";
  if (/\b(units?|sku|one-off|one off|product sales|e-?commerce)\b/.test(t)) return "product";
  if (/\b(invest|portfolio|compound|capital growth|brokerage|returns)\b/.test(t)) return "investment";
  return "services";
}

export function classifyGoalType(text: string): GoalTypeKey | null {
  const t = text.toLowerCase();
  if (/\b(job offer|role|promotion|gm |career|speaking)\b/.test(t)) return "career";
  if (/\b(revenue|income|profit|million|funding|\$\d|banked|earn|consulting|advisory)\b/.test(t) || parseMoneyTarget(text)) {
    return "money";
  }
  if (/\b(ship|launch|product|app|mvp|paying users|prototype|offer)\b/.test(t)) return "build";
  if (/\b(kg|weight|deadlift|sleep|training|body fat)\b/.test(t)) return "body";
  if (/\b(exam|certificate|learn|credential|portfolio)\b/.test(t)) return "skill";
  if (/\b(cycle time|workflow|process|operating model|sites)\b/.test(t)) return "system";
  if (/\b(by \d|i will have|deadline|this year|12[- ]week|goal)\b/.test(t)) return "other";
  return null;
}

export function diagnoseOutcome(text: string): CoachNote[] {
  const notes: CoachNote[] = [];
  const t = (text || "").trim();
  if (t.length < 8) return notes;
  const lower = t.toLowerCase();
  const vague = VAGUE_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
  const hedge = HEDGES.filter((w) => lower.includes(w));
  if (!/\d/.test(t) && !parseMoneyTarget(t)) {
    notes.push({
      level: "warn",
      text: "No number in the statement. Add the quantity, level or count that makes this verifiable by someone else.",
    });
  }
  if (vague.length) {
    notes.push({
      level: "warn",
      text: `Vague word${vague.length > 1 ? "s" : ""}: “${vague.slice(0, 3).join("”, “")}”. Replace with the observable end state.`,
    });
  }
  if (hedge.length) {
    notes.push({
      level: "warn",
      text: `Hedged language (“${hedge[0]}”). Write it as an achieved state: “I have…”, not “I want to…”.`,
    });
  }
  if (t.split(/\s+/).length > 45) {
    notes.push({ level: "warn", text: "This is long enough to contain several goals. Split it — one outcome per plan." });
  }
  if (!notes.length) {
    notes.push({ level: "ok", text: "This reads as observable. Another person could tell whether you achieved it." });
  }
  return notes;
}

export function diagnoseLeadMeasure(text: string): CoachNote | null {
  const t = (text || "").trim();
  if (!t) return null;
  if (!/\d/.test(t)) {
    return { level: "warn", text: "No weekly number — a lead measure has to be countable (“5 calls”, not “do outreach”)." };
  }
  const lower = t.toLowerCase();
  if (["revenue", "sales", "$", "weight", "followers", "profit", "signed", "closed", "clients won"].some((w) => lower.includes(w))) {
    return { level: "warn", text: "This looks like a result you do not fully control. Lead measures are inputs you can hit regardless of the outcome." };
  }
  return { level: "ok", text: "Countable and inside your control." };
}

export function computeMoneyMath(input: {
  target: number;
  months: number;
  model: MoneyModel;
  f?: FieldMap;
}): Feasibility {
  const { target, months, model } = input;
  const f = input.f || {};
  const rows: MathRow[] = [];
  const weeks = Math.max(months * 4.345, 1);
  let verdict: CoachNote | null = null;

  if (model === "services") {
    const price = g(f, "price", SERVICES_DEFAULTS.price);
    const marginPct = g(f, "margin", SERVICES_DEFAULTS.margin);
    const closeRate = g(f, "closeRate", SERVICES_DEFAULTS.closeRate);
    const convRate = g(f, "convRate", SERVICES_DEFAULTS.convRate);
    const replyRate = g(f, "replyRate", SERVICES_DEFAULTS.replyRate);
    const deliveryHours = g(f, "deliveryHours", SERVICES_DEFAULTS.deliveryHours);
    const capacity = g(f, "capacity", SERVICES_DEFAULTS.capacity);
    const net = price * (marginPct / 100 || 1);
    const deals = net > 0 ? target / net : 0;
    const perWeek = deals / weeks;
    const proposals = deals / (closeRate / 100 || 1);
    const convos = proposals / (convRate / 100 || 1);
    const outreach = convos / (replyRate / 100 || 1);
    const hoursNeeded = deals * deliveryHours;
    const hoursAvail = capacity * weeks;
    const util = hoursAvail > 0 ? hoursNeeded / hoursAvail : 99;

    rows.push({ label: "Margin kept per engagement", value: moneyFmt(net), note: `${moneyFmt(price)} × ${marginPct}%` });
    rows.push({ label: "Engagements required", value: numFmt(deals, 1), note: `${moneyFmt(target)} ÷ ${moneyFmt(net)}` });
    rows.push({ label: "Pace required", value: `${numFmt(deals / months, 1)}/month · ${numFmt(perWeek, 2)}/week`, note: `over ${months} months` });
    rows.push({ label: "Proposals to issue", value: numFmt(proposals, 0), note: `at ${closeRate}% close rate` });
    rows.push({ label: "Qualified conversations", value: numFmt(convos, 0), note: `${numFmt(convos / weeks, 1)} per week` });
    rows.push({ label: "Outreach touches", value: numFmt(outreach, 0), note: `${numFmt(outreach / weeks, 0)} per week at ${replyRate}% reply` });
    rows.push({ label: "Delivery load", value: `${numFmt(hoursNeeded, 0)} hrs needed vs ${numFmt(hoursAvail, 0)} hrs available`, note: `${numFmt(capacity, 0)} hrs/week × ${numFmt(weeks, 0)} weeks` });

    if (util > 1) {
      verdict = {
        level: "stop",
        text: `Delivery capacity is the binding constraint — the work needs ${numFmt(util * 100, 0)}% of available hours. Raise price, cut delivery hours, productise, or add capacity. Volume alone will not close this gap.`,
      };
    } else if (util > 0.75) {
      verdict = {
        level: "warn",
        text: `Feasible but tight: ${numFmt(util * 100, 0)}% of delivery capacity is consumed. Protect selling time explicitly.`,
      };
    } else if (outreach / weeks > 150) {
      verdict = {
        level: "warn",
        text: `The maths works on capacity, but ${numFmt(outreach / weeks, 0)} outreach touches per week is a full-time sales job.`,
      };
    } else {
      verdict = {
        level: "ok",
        text: `Plausible: ${numFmt(perWeek, 2)} wins per week with ${numFmt(util * 100, 0)}% capacity used.`,
      };
    }
  }

  if (model === "subscription") {
    const arpu = g(f, "arpu", SUBSCRIPTION_DEFAULTS.arpu);
    const marginPct = g(f, "margin", SUBSCRIPTION_DEFAULTS.margin);
    const churnPct = g(f, "churn", SUBSCRIPTION_DEFAULTS.churn);
    const trialConv = g(f, "trialConv", SUBSCRIPTION_DEFAULTS.trialConv);
    const visitorConv = g(f, "visitorConv", SUBSCRIPTION_DEFAULTS.visitorConv);
    const mrrNeeded = target / months;
    const customers = arpu * (marginPct / 100) > 0 ? mrrNeeded / (arpu * (marginPct / 100)) : 0;
    const churn = churnPct / 100;
    const grossAdds = customers * (1 / months) + customers * churn;
    const trials = grossAdds / (trialConv / 100 || 1);
    const visitors = trials / (visitorConv / 100 || 1);
    rows.push({ label: "Average monthly revenue required", value: moneyFmt(mrrNeeded), note: `${moneyFmt(target)} ÷ ${months} months` });
    rows.push({ label: "Paying customers required", value: numFmt(customers, 0), note: `at ${moneyFmt(arpu)}/mo × ${marginPct}% margin` });
    rows.push({ label: "Gross new customers per month", value: numFmt(grossAdds, 0), note: `growth plus ${churnPct}% churn replacement` });
    rows.push({ label: "Trials per month", value: numFmt(trials, 0), note: `at ${trialConv}% trial→paid` });
    rows.push({ label: "Visitors per month", value: numFmt(visitors, 0), note: `at ${visitorConv}% visitor→trial` });
    if (visitors > 200000) {
      verdict = {
        level: "stop",
        text: `This needs roughly ${numFmt(visitors, 0)} visitors a month — an audience-scale distribution problem, not a product problem. Either raise ARPU sharply or pick a channel with concentrated demand.`,
      };
    } else if (churn >= 0.07) {
      verdict = {
        level: "warn",
        text: `At ${churnPct}% monthly churn you replace most of the base each year. Retention, not acquisition, is the real constraint.`,
      };
    } else {
      verdict = {
        level: "ok",
        text: `Workable: ${numFmt(grossAdds, 0)} new customers a month is the number to organise everything around.`,
      };
    }
  }

  if (model === "product") {
    const price = g(f, "price", PRODUCT_DEFAULTS.price);
    const marginPct = g(f, "margin", PRODUCT_DEFAULTS.margin);
    const convRate = g(f, "convRate", PRODUCT_DEFAULTS.convRate);
    const units = price * (marginPct / 100) > 0 ? target / (price * (marginPct / 100)) : 0;
    const visitors = units / (convRate / 100 || 1);
    rows.push({ label: "Units required", value: numFmt(units, 0), note: `${moneyFmt(target)} ÷ (${moneyFmt(price)} × ${marginPct}%)` });
    rows.push({ label: "Pace required", value: `${numFmt(units / months, 0)}/month · ${numFmt(units / weeks, 1)}/week`, note: `over ${months} months` });
    rows.push({ label: "Visitors required", value: numFmt(visitors, 0), note: `at ${convRate}% conversion` });
    verdict =
      visitors > 500000
        ? {
            level: "stop",
            text: `${numFmt(visitors, 0)} visitors is a media business in itself. Raise price, add a higher-tier offer, or sell to organisations rather than individuals.`,
          }
        : {
            level: "ok",
            text: `The number to plan against is ${numFmt(units / weeks, 1)} units per week and the traffic to support it.`,
          };
  }

  if (model === "investment") {
    const r = g(f, "ret", INVESTMENT_DEFAULTS.ret) / 100 / 12;
    const P = g(f, "capital", INVESTMENT_DEFAULTS.capital);
    const c = g(f, "contribution", INVESTMENT_DEFAULTS.contribution);
    let bal = P;
    let m = 0;
    while (bal < target && m < 1200) {
      bal = bal * (1 + r) + c;
      m++;
    }
    const yrs = m / 12;
    rows.push({
      label: "Months to target",
      value: m >= 1200 ? "Never at these inputs" : numFmt(m, 0),
      note: `${moneyFmt(P)} start, ${moneyFmt(c)}/mo, ${g(f, "ret", INVESTMENT_DEFAULTS.ret)}% p.a.`,
    });
    rows.push({ label: "Years to target", value: m >= 1200 ? "—" : numFmt(yrs, 1), note: "compounded monthly" });
    const n = months;
    const fvFactor = Math.pow(1 + r, n);
    const reqC = r > 0 ? ((target - P * fvFactor) * r) / (fvFactor - 1) : (target - P) / n;
    rows.push({
      label: `Monthly contribution to hit it in ${months} months`,
      value: reqC <= 0 ? "Already on track" : moneyFmt(reqC),
      note: "holding the return assumption constant",
    });
    if (reqC > 0 && reqC > c * 3) {
      verdict = {
        level: "stop",
        text: `Hitting this inside ${months} months needs ${moneyFmt(reqC)} a month — about ${numFmt(reqC / Math.max(c, 1), 1)}× your current contribution. Either extend the horizon to ~${numFmt(yrs, 1)} years or change the income engine feeding the capital.`,
      };
    } else if (reqC > 0) {
      verdict = {
        level: "warn",
        text: `Reachable, but it requires lifting contributions to ${moneyFmt(reqC)} a month. The real goal underneath is income, not returns.`,
      };
    } else {
      verdict = { level: "ok", text: "Current capital and contributions already reach the target inside the window." };
    }
  }

  return { rows, verdict, model };
}

export function computeServicesMath(
  target: number,
  months: number,
  f: FieldMap = SERVICES_DEFAULTS,
): Feasibility {
  return computeMoneyMath({ target, months, model: "services", f });
}

export function computeGenericMath(input: {
  targetQty: number;
  unitLabel?: string;
  current?: number;
  perWeek?: number;
  weeksAvailable: number;
  stages?: { label: string; rate: number }[];
}): Feasibility {
  const unitLabel = input.unitLabel || "units";
  const current = input.current || 0;
  const perWeek = input.perWeek || 0;
  const weeksAvailable = input.weeksAvailable;
  const remaining = Math.max(input.targetQty - current, 0);
  const weeksNeeded = perWeek > 0 ? remaining / perWeek : Infinity;
  const rows: MathRow[] = [
    { label: `Remaining ${unitLabel}`, value: numFmt(remaining, 1), note: `${numFmt(input.targetQty, 1)} target − ${numFmt(current, 1)} today` },
    { label: "Weeks needed at planned rate", value: Number.isFinite(weeksNeeded) ? numFmt(weeksNeeded, 1) : "—", note: `${numFmt(perWeek, 2)} per week` },
    { label: "Weeks available", value: numFmt(weeksAvailable, 1), note: "to your deadline" },
  ];
  const requiredRate = weeksAvailable > 0 ? remaining / weeksAvailable : Infinity;
  rows.push({
    label: "Rate the deadline demands",
    value: `${numFmt(requiredRate, 2)} ${unitLabel}/week`,
    note: requiredRate > perWeek ? `${numFmt(requiredRate / Math.max(perWeek, 0.0001), 1)}× your planned rate` : "within your planned rate",
  });

  let funnel: FunnelRow[] | undefined;
  if (input.stages?.length) {
    let need = remaining;
    const built: FunnelRow[] = [];
    for (let i = input.stages.length - 1; i >= 0; i--) {
      const rate = (input.stages[i].rate || 100) / 100;
      need = rate > 0 ? need / rate : need;
      built.unshift({
        label: input.stages[i].label || `Stage ${i + 1}`,
        total: numFmt(need, 0),
        perWeek: numFmt(need / Math.max(weeksAvailable, 1), 1),
      });
    }
    funnel = built;
  }

  let verdict: CoachNote;
  if (!Number.isFinite(weeksNeeded)) {
    verdict = {
      level: "stop",
      text: "No weekly rate entered, so nothing is actually scheduled. A goal without a weekly rate is a wish.",
    };
  } else if (weeksNeeded > weeksAvailable * 1.25) {
    verdict = {
      level: "stop",
      text: `At the planned rate this lands ${numFmt(weeksNeeded - weeksAvailable, 0)} weeks late. Change one of three things: the deadline, the target, or the weekly rate — do not just hope.`,
    };
  } else if (weeksNeeded > weeksAvailable) {
    verdict = {
      level: "warn",
      text: "Marginally behind. Any missed week breaks the plan, so build in a buffer or trim the target now.",
    };
  } else {
    verdict = {
      level: "ok",
      text: `The rate clears the deadline with ${numFmt(weeksAvailable - weeksNeeded, 1)} weeks of buffer.`,
    };
  }

  return { rows, verdict, funnel, model: "generic" };
}

function numberedLeadsFromMath(feasibility: Feasibility | null, type: GoalTypeKey): string[] {
  if (!feasibility) return GOAL_TYPES[type].leadMeasures;
  const leads: string[] = [];
  for (const row of feasibility.rows) {
    const perWeek = row.note?.match(/([\d,.]+)\s+per week/i);
    if (perWeek && /conversation|outreach|unit/i.test(row.label)) {
      leads.push(`${perWeek[1]} ${row.label.toLowerCase()} per week`);
    }
  }
  if (feasibility.funnel) {
    for (const stage of feasibility.funnel) {
      leads.push(`${stage.perWeek} ${stage.label.toLowerCase()} per week`);
    }
  }
  const merged = [...leads, ...GOAL_TYPES[type].leadMeasures];
  return merged.slice(0, 5);
}

function parseGenericQuantity(text: string): { qty: number; unit: string } | null {
  const kg = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kg) return { qty: Number(kg[1]), unit: "kg" };
  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:practice )?hours/i);
  if (hours) return { qty: Number(hours[1]), unit: "hours" };
  const sites = text.match(/(\d+)\s+sites/i);
  if (sites) return { qty: Number(sites[1]), unit: "sites" };
  return null;
}

function parseWeeklyRate(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:per|a)\s*week/i);
  return m ? Number(m[1]) : null;
}

export function feasibilityBlocksExecute(coach: GoalCoaching | null | undefined): boolean {
  return coach?.feasibility?.verdict?.level === "stop";
}

export function assessGoal(text: string, months?: number): GoalCoaching | null {
  const type = classifyGoalType(text);
  if (!type) return null;
  const meta = GOAL_TYPES[type];
  const horizonMonths = months ?? inferHorizonMonths(text);
  const target = parseMoneyTarget(text);
  const obstacles = meta.obstacles
    .map((key) => (OBSTACLES[key] ? { key, ...OBSTACLES[key] } : null))
    .filter((o): o is NamedObstacle => Boolean(o))
    .slice(0, 3);

  let feasibility: Feasibility | null = null;
  if (type === "money" && target) {
    feasibility = computeMoneyMath({
      target,
      months: horizonMonths,
      model: inferMoneyModel(text),
    });
  } else if (type !== "money") {
    const qty = parseGenericQuantity(text);
    const perWeek = parseWeeklyRate(text);
    if (qty) {
      feasibility = computeGenericMath({
        targetQty: qty.qty,
        unitLabel: qty.unit,
        current: 0,
        perWeek: perWeek || 0,
        weeksAvailable: Math.max(horizonMonths * 4.345, 1),
      });
    }
  }

  return {
    type,
    typeLabel: meta.label,
    blurb: meta.blurb,
    chainSeed: meta.chainSeed,
    outcomeNotes: diagnoseOutcome(text),
    horizonMonths,
    horizonNote: diagnoseHorizon(horizonMonths),
    feasibility,
    obstacles,
    phases: PHASE_TEMPLATES[type],
    leadMeasures: numberedLeadsFromMath(feasibility, type),
    reviewRules: REVIEW_RULES,
  };
}
