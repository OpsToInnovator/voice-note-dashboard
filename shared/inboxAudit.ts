// Weekly inbox audit: every new task lands uncontained, then must get a home.
// Home is an existing Project, Goal, or Reason. If none fits: remove, or
// recalibrate with a new project/goal. Matching is token overlap, not a prompt.

import { ageDays, calendarDate } from "./resurface";

export const INBOX_AUDIT_WINDOW_DAYS = 7;

export type InboxVerdict = "assign" | "remove" | "recalibrate";
export type ContainerKind = "project" | "goal" | "reason";
export type InboxCohort = "new" | "leftover";

export interface InboxContainer {
  id: string;
  name: string;
  kind: ContainerKind;
}

export interface InboxTask {
  id: string;
  name: string;
  status: string;
  due: string | null;
  created: string;
  lastEdited: string;
  url: string;
  archived: boolean;
  hasProject: boolean;
  hasGoal: boolean;
  hasReason: boolean;
}

export interface InboxMatch {
  id: string;
  name: string;
  kind: ContainerKind;
  score: number;
}

export interface ProposedContainer {
  name: string;
  kind: "project" | "goal";
}

export interface InboxAuditItem {
  id: string;
  name: string;
  due: string | null;
  created: string;
  lastEdited: string;
  url: string;
  cohort: InboxCohort;
  ageDays: number;
  verdict: InboxVerdict;
  reason: string;
  match: InboxMatch | null;
  proposedContainer: ProposedContainer | null;
}

export interface WeeklyInboxAudit {
  date: string;
  generatedAt: string;
  windowDays: number;
  headline: string;
  summary: string;
  newItems: InboxAuditItem[];
  leftoverItems: InboxAuditItem[];
  containers: InboxContainer[];
  stats: {
    uncontained: number;
    newlyAdded: number;
    leftover: number;
    assign: number;
    remove: number;
    recalibrate: number;
  };
}

export interface InboxAuditApplyRequest {
  id: string;
  verdict: InboxVerdict;
  projectId?: string;
  createContainer?: ProposedContainer;
}

export interface InboxAuditApplyResult {
  ok: boolean;
  id: string;
  verdict: InboxVerdict;
  action: "assigned" | "archived" | "recalibrated" | "fixture_noop";
  message: string;
  wrote: boolean;
  container?: { id: string; name: string; kind: string };
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "about",
  "into",
  "that",
  "this",
  "your",
  "our",
  "their",
  "use",
  "using",
  "used",
  "read",
  "later",
  "complete",
  "finish",
  "send",
  "remind",
  "make",
  "take",
  "get",
  "set",
  "put",
  "form",
  "forms",
  "task",
  "todo",
  "item",
  "please",
  "just",
  "note",
  "draft",
  "review",
]);

function isDone(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s === "done" || s === "complete" || s === "completed";
}

export function isUncontained(item: InboxTask): boolean {
  if (item.archived) return false;
  if (isDone(item.status)) return false;
  if (!item.name.trim()) return false;
  return !item.hasProject && !item.hasGoal && !item.hasReason;
}

export function isInWeeklyWindow(
  item: Pick<InboxTask, "created" | "lastEdited">,
  todayStr: string,
  windowDays = INBOX_AUDIT_WINDOW_DAYS,
): boolean {
  const created = calendarDate(item.created);
  const edited = calendarDate(item.lastEdited);
  const newest = edited && edited > created ? edited : created;
  if (!newest) return true;
  return ageDays(newest, todayStr) < windowDays;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function unique(tokens: string[]): string[] {
  return [...new Set(tokens)];
}

export function overlapScore(taskName: string, containerName: string): {
  overlap: number;
  score: number;
  containerCoverage: number;
  longest: number;
} {
  const task = unique(tokenize(taskName));
  const container = unique(tokenize(containerName));
  if (task.length === 0 || container.length === 0) {
    return { overlap: 0, score: 0, containerCoverage: 0, longest: 0 };
  }
  const containerSet = new Set(container);
  const shared = task.filter((t) => containerSet.has(t));
  const longest = shared.reduce((max, t) => Math.max(max, t.length), 0);
  return {
    overlap: shared.length,
    score: shared.length / Math.min(task.length, container.length),
    containerCoverage: shared.length / container.length,
    longest,
  };
}

export function isStrongMatch(taskName: string, containerName: string): boolean {
  const { overlap, score, containerCoverage, longest } = overlapScore(taskName, containerName);
  if (overlap >= 2 && (score >= 0.45 || containerCoverage >= 0.5)) return true;
  if (overlap >= 1 && containerCoverage >= 1 && longest >= 6) return true;
  if (overlap >= 1 && longest >= 7 && containerCoverage >= 0.66) return true;
  return false;
}

export function bestContainerMatch(
  taskName: string,
  containers: InboxContainer[],
): InboxMatch | null {
  let best: InboxMatch | null = null;
  for (const container of containers) {
    if (!isStrongMatch(taskName, container.name)) continue;
    const { score } = overlapScore(taskName, container.name);
    if (!best || score > best.score) {
      best = { id: container.id, name: container.name, kind: container.kind, score };
    }
  }
  return best;
}

const REMOVE_PATTERNS: RegExp[] = [
  /^read later$/i,
  /^bookmark[s]?$/i,
  /^someday$/i,
  /^maybe$/i,
  /^later$/i,
  /\bread later\b/i,
  /\bsave for later\b/i,
  /\bwatch later\b/i,
  /\bbookmark(s|ed|ing)?\b/i,
  /\bsomeday(\s*\/\s*maybe|\s+maybe)?\b/i,
  /\bmaybe someday\b/i,
  /\bread about\b/i,
  /\blook(?:ing)? into\b/i,
  /\bcheck out\b/i,
  /\bresearch pile\b/i,
  /\bundirected research\b/i,
];

export function looksLikeRemovePile(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  return REMOVE_PATTERNS.some((re) => re.test(trimmed));
}

function titleCaseWords(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .slice(0, 80);
}

export function proposeContainer(taskName: string): ProposedContainer {
  const cleaned = taskName.replace(/[.…]+$/g, "").trim();
  const kind: "project" | "goal" = /\b(grow|growth|value|values|health|habit|identity|learn)\b/i.test(
    cleaned,
  )
    ? "goal"
    : "project";

  const remind = cleaned.match(/^remind\s+([A-Za-z][A-Za-z'’\-]+)/i);
  if (remind) return { name: titleCaseWords(remind[1]), kind: "project" };

  const useFor = cleaned.match(/^use\s+(.+?)\s+for\s+(.+)$/i);
  if (useFor) return { name: titleCaseWords(useFor[2]), kind: "project" };

  const completeFor = cleaned.match(
    /^(?:complete|finish|submit|send|file)\s+(.+?)\s+for\s+(.+)$/i,
  );
  if (completeFor) return { name: titleCaseWords(completeFor[2]), kind: "project" };

  const stripped = cleaned.replace(
    /^(remind|complete|finish|submit|send|use|write|call|email|draft|book|schedule|review)\s+/i,
    "",
  );
  return { name: titleCaseWords(stripped || cleaned), kind };
}

export function decideInboxVerdict(
  task: InboxTask,
  containers: InboxContainer[],
): Pick<InboxAuditItem, "verdict" | "reason" | "match" | "proposedContainer"> {
  const match = bestContainerMatch(task.name, containers);
  if (match) {
    return {
      verdict: "assign",
      reason: `Strong name overlap with ${match.kind} “${match.name}”`,
      match,
      proposedContainer: null,
    };
  }

  if (looksLikeRemovePile(task.name)) {
    return {
      verdict: "remove",
      reason: "Read-later / bookmark / someday / undirected research — no home, drop it",
      match: null,
      proposedContainer: null,
    };
  }

  const proposed = proposeContainer(task.name);
  return {
    verdict: "recalibrate",
    reason: `Real work with no existing home — propose ${proposed.kind} “${proposed.name}”`,
    match: null,
    proposedContainer: proposed,
  };
}

function sortAuditItems(items: InboxAuditItem[]): InboxAuditItem[] {
  return [...items].sort((a, b) => {
    if (b.ageDays !== a.ageDays) return b.ageDays - a.ageDays;
    return a.name.localeCompare(b.name);
  });
}

export function composeWeeklyInboxAudit(
  tasks: InboxTask[],
  containers: InboxContainer[],
  opts: {
    dateLabel: string;
    nowIso: string;
    todayStr: string;
    windowDays?: number;
  },
): WeeklyInboxAudit {
  const windowDays = opts.windowDays ?? INBOX_AUDIT_WINDOW_DAYS;
  const newItems: InboxAuditItem[] = [];
  const leftoverItems: InboxAuditItem[] = [];

  for (const task of tasks) {
    if (!isUncontained(task)) continue;
    const verdict = decideInboxVerdict(task, containers);
    const cohort: InboxCohort = isInWeeklyWindow(task, opts.todayStr, windowDays)
      ? "new"
      : "leftover";
    const item: InboxAuditItem = {
      id: task.id,
      name: task.name,
      due: task.due,
      created: task.created,
      lastEdited: task.lastEdited,
      url: task.url,
      cohort,
      ageDays: ageDays(task.created || task.lastEdited, opts.todayStr),
      ...verdict,
    };
    if (cohort === "new") newItems.push(item);
    else leftoverItems.push(item);
  }

  const sortedNew = sortAuditItems(newItems);
  const sortedLeftover = sortAuditItems(leftoverItems);
  const all = [...sortedNew, ...sortedLeftover];
  const assign = all.filter((i) => i.verdict === "assign").length;
  const remove = all.filter((i) => i.verdict === "remove").length;
  const recalibrate = all.filter((i) => i.verdict === "recalibrate").length;

  const headline =
    all.length === 0
      ? "Inbox is contained"
      : `${all.length} uncontained · ${sortedNew.length} new this week`;

  const summary =
    all.length === 0
      ? "Every open task has a project, goal, or reason. Nothing to assign, remove, or recalibrate."
      : "Anything new lands in Inbox. Then it needs an existing Project, Goal, or Reason. If it cannot: remove it, or recalibrate with a new project or goal. Dates do not contain a task.";

  return {
    date: opts.dateLabel,
    generatedAt: opts.nowIso,
    windowDays,
    headline,
    summary,
    newItems: sortedNew,
    leftoverItems: sortedLeftover,
    containers,
    stats: {
      uncontained: all.length,
      newlyAdded: sortedNew.length,
      leftover: sortedLeftover.length,
      assign,
      remove,
      recalibrate,
    },
  };
}

export function formatInboxAuditLog(report: WeeklyInboxAudit): string {
  const lines: string[] = [
    `=== Weekly Inbox Audit ${report.date} ===`,
    report.headline,
    report.summary,
    `Uncontained: ${report.stats.uncontained} (${report.stats.newlyAdded} new · ${report.stats.leftover} leftover)`,
    `Assign ${report.stats.assign} · Remove ${report.stats.remove} · Recalibrate ${report.stats.recalibrate}`,
    "No writes. Confirm each item in Standup or POST /api/inbox-audit/apply.",
  ];

  const section = (title: string, items: InboxAuditItem[]) => {
    lines.push("", title);
    if (items.length === 0) {
      lines.push("(none)");
      return;
    }
    for (const item of items) {
      const due = item.due ? ` due ${calendarDate(item.due)}` : "";
      const dest =
        item.verdict === "assign" && item.match
          ? ` → ${item.match.name} (${item.match.kind})`
          : item.verdict === "recalibrate" && item.proposedContainer
            ? ` → new ${item.proposedContainer.kind} “${item.proposedContainer.name}”`
            : "";
      lines.push(`- [${item.verdict}] ${item.name}${due}${dest}`);
    }
  };

  section("NEW (created or edited in the last 7 days)", report.newItems);
  section("LEFTOVER (still uncontained)", report.leftoverItems);
  return lines.join("\n");
}

export const INBOX_AUDIT_FIXTURE_TODAY = "2026-08-30";

function daysAgoIso(today: string, n: number): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

function fixtureTask(
  id: string,
  name: string,
  extra: Partial<InboxTask> = {},
): InboxTask {
  return {
    id,
    name,
    status: "To Do",
    due: null,
    created: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 3),
    lastEdited: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 2),
    url: `https://www.notion.so/${id}`,
    archived: false,
    hasProject: false,
    hasGoal: false,
    hasReason: false,
    ...extra,
  };
}

/** Apex Hub → Tasks → Inbox sample (titles from the operator screenshot). */
export function buildInboxAuditFixture(): {
  tasks: InboxTask[];
  containers: InboxContainer[];
} {
  const containers: InboxContainer[] = [
    { id: "proj-apexform-life", name: "ApexForm Life", kind: "project" },
    { id: "proj-prospect-skill", name: "Prospect Skill", kind: "project" },
    { id: "goal-consulting", name: "Build consulting practice", kind: "goal" },
    { id: "reason-growth", name: "Growth", kind: "reason" },
    { id: "reason-values", name: "Values", kind: "reason" },
  ];

  const tasks: InboxTask[] = [
    fixtureTask("inbox-ei", "Read about emotional intelligence", {
      created: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 4),
      lastEdited: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 4),
    }),
    fixtureTask("inbox-sukunj", "Use Prospect Skill for Sukunj Mendpara", {
      due: "2026-09-02",
      created: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 2),
      lastEdited: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 1),
    }),
    fixtureTask("inbox-read-later", "Read Later", {
      created: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 5),
      lastEdited: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 5),
    }),
    fixtureTask("inbox-olivia", "Remind Olivia…", {
      due: "2026-08-31",
      created: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 1),
      lastEdited: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 1),
    }),
    fixtureTask("inbox-application", "Complete company application form for apexform life", {
      due: "2026-08-28",
      created: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 6),
      lastEdited: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 3),
    }),
    fixtureTask("inbox-leftover-gym", "Draft partnership note for local gym", {
      created: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 18),
      lastEdited: daysAgoIso(INBOX_AUDIT_FIXTURE_TODAY, 16),
    }),
    fixtureTask("contained-1", "Ship weekly update", {
      hasProject: true,
      due: INBOX_AUDIT_FIXTURE_TODAY,
    }),
    fixtureTask("done-1", "Already shipped", { status: "Done" }),
    fixtureTask("archived-1", "Old pile", { archived: true }),
    fixtureTask("goal-contained", "Practice morning pages", { hasGoal: true }),
    fixtureTask("reason-contained", "Journal values this week", { hasReason: true }),
  ];

  return { tasks, containers };
}
