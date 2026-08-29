// Daily resurface: hand back what's actually open, plus anything stale.
// Capture without return only closes the loop clerically.

import { lintActionName, type ActionLint } from "./actionFrame";

export const INBOX_CAP = 15;
export const OPEN_TODAY_LIMIT = 7;
export const STALE_LIMIT = 7;
export const INBOX_STALE_AFTER_DAYS = 7;
export const UNDATED_STALE_AFTER_DAYS = 14;

export type ResurfaceLead = "inbox_overflow" | "today";
export type CaptureSource = "note" | "task";
export type BucketKind = "inbox" | "today" | "stale" | "skip";

export interface RawCapture {
  id: string;
  name: string;
  source: CaptureSource;
  status: string;
  due: string | null;
  created: string;
  lastEdited: string;
  url: string;
  priority: string;
  type: string;
  hasProject: boolean;
  hasTag: boolean;
  hasPerson: boolean;
  archived: boolean;
  noteType: string;
}

export interface ResurfaceItem {
  id: string;
  name: string;
  source: CaptureSource;
  reason: string;
  due: string | null;
  ageDays: number;
  daysOverdue: number | null;
  url: string;
  priority: string;
  status: string;
  type: string;
  actionLint: ActionLint;
}

export interface BucketSnapshot {
  inbox: ResurfaceItem[];
  openToday: ResurfaceItem[];
  stale: ResurfaceItem[];
}

export interface DailyResurface {
  date: string;
  generatedAt: string;
  lead: ResurfaceLead;
  headline: string;
  summary: string;
  inbox: {
    count: number;
    cap: number;
    overflow: boolean;
    items: ResurfaceItem[];
  };
  openToday: ResurfaceItem[];
  stale: ResurfaceItem[];
}

const FILED_NOTE_TYPES = new Set([
  "voice note",
  "journal",
  "meeting",
  "web clip",
  "lecture",
  "reference",
  "book",
  "idea",
  "plan",
  "recipe",
  "daily",
]);

export function calendarDate(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ageDays(iso: string, todayStr: string): number {
  const day = calendarDate(iso);
  if (!day) return 0;
  const ms = new Date(`${todayStr}T00:00:00Z`).getTime() - new Date(`${day}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function daysOverdue(due: string | null, todayStr: string): number | null {
  if (!due) return null;
  const dueDay = calendarDate(due);
  if (!dueDay || dueDay >= todayStr) return null;
  return ageDays(dueDay, todayStr);
}

function isDone(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s === "done" || s === "complete" || s === "completed";
}

function isDoing(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s === "doing" || s === "in progress" || s === "in-progress";
}

function isInboxNoteType(noteType: string): boolean {
  const t = noteType.trim().toLowerCase();
  if (!t || t === "inbox") return true;
  return !FILED_NOTE_TYPES.has(t);
}

function isFiledAway(item: RawCapture): boolean {
  return item.hasProject || item.hasTag || item.hasPerson;
}

export function classifyCapture(item: RawCapture, todayStr: string): BucketKind {
  if (item.archived) return "skip";
  if (!item.name.trim()) return "skip";

  if (item.source === "note") {
    if (!isInboxNoteType(item.noteType)) return "skip";
    if (isFiledAway(item)) return "skip";
    return "inbox";
  }

  if (isDone(item.status)) return "skip";

  const dueDay = calendarDate(item.due || "");
  if (isDoing(item.status) || dueDay === todayStr) return "today";
  if (dueDay && dueDay < todayStr) return "stale";
  if (!item.hasProject && !dueDay) return "inbox";

  const lastTouch = item.lastEdited || item.created;
  if (!dueDay && ageDays(lastTouch, todayStr) >= UNDATED_STALE_AFTER_DAYS) return "stale";

  return "skip";
}

function itemReason(item: RawCapture, bucket: Exclude<BucketKind, "skip">, todayStr: string): string {
  if (bucket === "inbox") {
    const age = ageDays(item.created || item.lastEdited, todayStr);
    if (age >= INBOX_STALE_AFTER_DAYS) return `Unprocessed for ${age}d`;
    return item.source === "note" ? "Unprocessed capture" : "No project, no date";
  }
  if (bucket === "today") {
    if (isDoing(item.status)) return "In progress";
    return "Due today";
  }
  const overdue = daysOverdue(item.due, todayStr);
  if (overdue != null) return `${overdue}d overdue`;
  const age = ageDays(item.lastEdited || item.created, todayStr);
  if (item.source === "note" || (!item.hasProject && !item.due)) return `Sitting in Inbox ${age}d`;
  return `No date, untouched ${age}d`;
}

export function toResurfaceItem(item: RawCapture, todayStr: string, bucket: Exclude<BucketKind, "skip">): ResurfaceItem {
  return {
    id: item.id,
    name: item.name,
    source: item.source,
    reason: itemReason(item, bucket, todayStr),
    due: item.due,
    ageDays: ageDays(item.created || item.lastEdited, todayStr),
    daysOverdue: daysOverdue(item.due, todayStr),
    url: item.url,
    priority: item.priority,
    status: item.status,
    type: item.type || item.noteType,
    actionLint: lintActionName(item.name),
  };
}

export function partitionBuckets(items: RawCapture[], todayStr: string): BucketSnapshot {
  const inbox: ResurfaceItem[] = [];
  const openToday: ResurfaceItem[] = [];
  const stale: ResurfaceItem[] = [];

  for (const item of items) {
    const bucket = classifyCapture(item, todayStr);
    if (bucket === "skip") continue;
    const mapped = toResurfaceItem(item, todayStr, bucket);
    if (bucket === "inbox") inbox.push(mapped);
    else if (bucket === "today") openToday.push(mapped);
    else stale.push(mapped);
  }

  return { inbox, openToday, stale };
}

function priorityRank(priority: string): number {
  const p = priority.trim().toLowerCase();
  if (p.includes("urgent") || p.includes("high")) return 0;
  if (p.includes("medium")) return 1;
  if (p.includes("low")) return 2;
  return 3;
}

function sortOpenToday(items: ResurfaceItem[]): ResurfaceItem[] {
  return [...items].sort((a, b) => {
    const aDoing = a.status.toLowerCase() === "doing" ? 0 : 1;
    const bDoing = b.status.toLowerCase() === "doing" ? 0 : 1;
    if (aDoing !== bDoing) return aDoing - bDoing;
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
    if (byPriority !== 0) return byPriority;
    return a.name.localeCompare(b.name);
  });
}

function sortInbox(items: ResurfaceItem[]): ResurfaceItem[] {
  return [...items].sort((a, b) => {
    if (b.ageDays !== a.ageDays) return b.ageDays - a.ageDays;
    return a.name.localeCompare(b.name);
  });
}

function sortStale(items: ResurfaceItem[]): ResurfaceItem[] {
  return [...items].sort((a, b) => {
    const aOver = a.daysOverdue ?? -1;
    const bOver = b.daysOverdue ?? -1;
    if (bOver !== aOver) return bOver - aOver;
    if (b.ageDays !== a.ageDays) return b.ageDays - a.ageDays;
    return a.name.localeCompare(b.name);
  });
}

export function isInboxOverflow(count: number, cap = INBOX_CAP): boolean {
  return count > cap;
}

export function composeDailyResurface(
  buckets: BucketSnapshot,
  opts: {
    dateLabel: string;
    nowIso: string;
    inboxCap?: number;
    openTodayLimit?: number;
    staleLimit?: number;
  },
): DailyResurface {
  const cap = opts.inboxCap ?? INBOX_CAP;
  const todayLimit = opts.openTodayLimit ?? OPEN_TODAY_LIMIT;
  const staleLimit = opts.staleLimit ?? STALE_LIMIT;

  const inboxItems = sortInbox(buckets.inbox);
  const overflow = isInboxOverflow(inboxItems.length, cap);
  const lead: ResurfaceLead = overflow ? "inbox_overflow" : "today";

  const agedInbox = inboxItems.filter((item) => item.ageDays >= INBOX_STALE_AFTER_DAYS);
  const stalePool = overflow
    ? buckets.stale
    : [...buckets.stale, ...agedInbox.filter((item) => !buckets.stale.some((s) => s.id === item.id))];

  const openToday = sortOpenToday(buckets.openToday).slice(0, todayLimit);
  const stale = sortStale(stalePool).slice(0, staleLimit);

  const headline = overflow
    ? `Inbox is backed up — ${inboxItems.length} items (cap ${cap})`
    : openToday.length === 0 && stale.length === 0
      ? "Nothing to hand back today"
      : `${openToday.length} open today${stale.length ? ` · ${stale.length} stale` : ""}`;

  const summary = overflow
    ? `Process Inbox first. Capture without return is how this becomes a graveyard. Clear below ${cap} before anything else.`
    : inboxItems.length === 0
      ? "Inbox is clear. Here's what's genuinely open today, plus anything going stale."
      : `Inbox is ${inboxItems.length}/${cap}. Here's what's genuinely open today, plus anything going stale.`;

  return {
    date: opts.dateLabel,
    generatedAt: opts.nowIso,
    lead,
    headline,
    summary,
    inbox: {
      count: inboxItems.length,
      cap,
      overflow,
      items: inboxItems,
    },
    openToday,
    stale,
  };
}

export function formatResurfaceLog(report: DailyResurface): string {
  const lines: string[] = [
    `=== Daily Resurface ${report.date} ===`,
    `LEAD: ${report.lead === "inbox_overflow" ? "INBOX OVERFLOW" : "TODAY"}`,
    report.headline,
    report.summary,
    `Inbox: ${report.inbox.count} / ${report.inbox.cap}${report.inbox.overflow ? " — backed up" : ""}`,
    `Open today: ${report.openToday.length}`,
    `Stale: ${report.stale.length}`,
  ];

  const section = (title: string, items: ResurfaceItem[]) => {
    lines.push("", title);
    if (items.length === 0) {
      lines.push("(none)");
      return;
    }
    for (const item of items) {
      const age = item.daysOverdue != null ? `${item.daysOverdue}d overdue` : `${item.ageDays}d old`;
      lines.push(`- ${item.name} [${item.source}] ${item.reason} (${age})`);
    }
  };

  if (report.lead === "inbox_overflow") {
    section("INBOX (process first)", report.inbox.items);
    section("Open today (held back)", report.openToday);
    section("Stale (held back)", report.stale);
  } else {
    section("Open today", report.openToday);
    section("Stale", report.stale);
    if (report.inbox.count > 0) {
      section(`Inbox (${report.inbox.count}/${report.inbox.cap})`, report.inbox.items);
    }
  }

  return lines.join("\n");
}

export function buildFixtureCaptures(kind: "overflow" | "healthy"): RawCapture[] {
  const today = "2026-08-29";
  const daysAgo = (n: number) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString();
  };

  const note = (
    id: string,
    name: string,
    age: number,
    extra: Partial<RawCapture> = {},
  ): RawCapture => ({
    id,
    name,
    source: "note",
    status: "",
    due: null,
    created: daysAgo(age),
    lastEdited: daysAgo(Math.max(0, age - 1)),
    url: `https://www.notion.so/${id}`,
    priority: "",
    type: "",
    hasProject: false,
    hasTag: false,
    hasPerson: false,
    archived: false,
    noteType: "",
    ...extra,
  });

  const task = (
    id: string,
    name: string,
    extra: Partial<RawCapture>,
  ): RawCapture => ({
    id,
    name,
    source: "task",
    status: "To Do",
    due: null,
    created: daysAgo(3),
    lastEdited: daysAgo(1),
    url: `https://www.notion.so/${id}`,
    priority: "",
    type: "Process",
    hasProject: true,
    hasTag: false,
    hasPerson: false,
    archived: false,
    noteType: "",
    ...extra,
  });

  const openToday = [
    task("doing-1", "Ship resurface job", { status: "Doing", priority: "High", due: today }),
    task("today-1", "Send weekly update", { due: today, priority: "High" }),
    task("today-2", "Review invoices", { due: today, priority: "Medium" }),
    task("today-3", "Book dentist", { due: today, priority: "Low" }),
    task("today-4", "Water plants", { due: today }),
    task("today-5", "Call plumber", { due: today, priority: "Medium" }),
    task("today-6", "File BAS draft", { due: today, priority: "High" }),
    task("today-7", "Tidy desk", { due: today }),
    task("today-8", "zzz should be capped out", { due: today }),
  ];

  const stale = [
    task("overdue-1", "Renew domain", { due: calendarDate(daysAgo(12)), hasProject: true }),
    task("overdue-2", "Reply to insurer", { due: calendarDate(daysAgo(4)), hasProject: true, priority: "High" }),
    task("stale-1", "Sketch onboarding", {
      hasProject: true,
      due: null,
      created: daysAgo(20),
      lastEdited: daysAgo(18),
    }),
  ];

  const filed = [
    note("filed-1", "Filed meeting notes", 2, { noteType: "Meeting", hasProject: true }),
    task("future-1", "Plan Q4 offsite", { due: "2026-10-01", hasProject: true }),
    task("done-1", "Already shipped", { status: "Done", due: today }),
  ];

  if (kind === "healthy") {
    return [
      note("inbox-1", "Idea: morning pages", 2),
      note("inbox-2", "Quote from podcast", 9),
      ...openToday.slice(0, 4),
      ...stale,
      ...filed,
    ];
  }

  const overflowInbox = Array.from({ length: 18 }, (_, i) =>
    note(`inbox-${i + 1}`, `Captured thought ${i + 1}`, i === 0 ? 21 : i + 1),
  );
  overflowInbox.push(
    task("inbox-task-1", "Unassigned capture", {
      hasProject: false,
      due: null,
      created: daysAgo(11),
      lastEdited: daysAgo(11),
    }),
  );

  return [...overflowInbox, ...openToday, ...stale, ...filed];
}
