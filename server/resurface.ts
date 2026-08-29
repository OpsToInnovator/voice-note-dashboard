import {
  buildFixtureCaptures,
  composeDailyResurface,
  formatResurfaceLog,
  partitionBuckets,
  type DailyResurface,
  type RawCapture,
} from "../shared/resurface";
import {
  cached,
  callNotionCli,
  extractIdFromUrl,
  getAWSTDates,
  getCheckbox,
  getDate,
  getNotesDbId,
  getRelationIds,
  getSelect,
  getStatus,
  getTasksDbId,
  getTitle,
  queryDatabasePages,
  TASKS_ACTIVE_VIEW_ID,
} from "./notion";

const RESURFACE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes — return should stay fresh

function hasApiKey(): boolean {
  return !!(process.env.NOTION_API_KEY || process.env.NOTION_TOKEN);
}

function pageId(page: any): string {
  return String(page.id || "").replace(/-/g, "");
}

function hasAnyRelation(props: any, names: string[]): boolean {
  return names.some((name) => getRelationIds(props, name).length > 0);
}

function mapNotePage(page: any): RawCapture {
  const props = page.properties || {};
  return {
    id: pageId(page),
    name: getTitle(props, "Name") || "Untitled",
    source: "note",
    status: "",
    due: getDate(props, "Note Date"),
    created: page.created_time || "",
    lastEdited: page.last_edited_time || "",
    url: page.url || "",
    priority: "",
    type: "",
    hasProject: hasAnyRelation(props, ["Project", "Projects"]),
    hasTag: hasAnyRelation(props, ["Tag", "Tags"]),
    hasPerson: hasAnyRelation(props, ["Person", "People", "Related to Person (People)"]),
    archived: getCheckbox(props, "Archived"),
    noteType: getSelect(props, "Type"),
  };
}

function mapTaskPage(page: any): RawCapture {
  const props = page.properties || {};
  return {
    id: pageId(page),
    name: getTitle(props, "Name") || "Untitled",
    source: "task",
    status: getStatus(props, "Status"),
    due: getDate(props, "Due") || getDate(props, "Do Date"),
    created: page.created_time || "",
    lastEdited: page.last_edited_time || "",
    url: page.url || "",
    priority: getStatus(props, "Priority") || getSelect(props, "Priority"),
    type: getSelect(props, "P/I"),
    hasProject: hasAnyRelation(props, ["Project", "Projects"]),
    hasTag: hasAnyRelation(props, ["Tag", "Tags"]),
    hasPerson: hasAnyRelation(props, ["Person", "People"]),
    archived: getCheckbox(props, "Archived"),
    noteType: "",
  };
}

async function fetchNotesDirect(): Promise<RawCapture[]> {
  try {
    const pages = await queryDatabasePages(getNotesDbId(), {
      filter: { property: "Archived", checkbox: { equals: false } },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });
    return pages.map(mapNotePage);
  } catch (err) {
    console.error("Resurface: archived filter failed, querying notes without it:", err);
    const pages = await queryDatabasePages(getNotesDbId(), {
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });
    return pages.map(mapNotePage);
  }
}

async function fetchTasksDirect(): Promise<RawCapture[]> {
  const pages = await queryDatabasePages(getTasksDbId(), {
    filter: { property: "Status", status: { does_not_equal: "Done" } },
    sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
  });
  return pages.map(mapTaskPage);
}

function parseRelationUrls(raw: string): string[] {
  if (!raw || raw === "<omitted />") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function fetchNotesCli(): RawCapture[] {
  try {
    const notesDbId = getNotesDbId();
    const result = callNotionCli("notion-query-database-view", {
      view_url: `https://www.notion.so/${notesDbId}`,
      page_size: 100,
    });
    return (result.results || []).map((n: any) => {
      const created = n.Created || "";
      return {
        id: extractIdFromUrl(n.url || ""),
        name: n.Name || "Untitled",
        source: "note" as const,
        status: "",
        due: n["date:Note Date:start"] || null,
        created,
        lastEdited: n.Edited || n.Updated || created,
        url: n.url || "",
        priority: "",
        type: "",
        hasProject: parseRelationUrls(n.Project || n.Projects || "").length > 0,
        hasTag: parseRelationUrls(n.Tag || n.Tags || "").length > 0,
        hasPerson: parseRelationUrls(n.Person || n.People || "").length > 0,
        archived: String(n.Archived || "").toLowerCase() === "true",
        noteType: n.Type || "",
      };
    });
  } catch (err) {
    console.error("Resurface: CLI notes query failed:", err);
    return [];
  }
}

function fetchTasksCli(): RawCapture[] {
  try {
    const viewUrl = `https://www.notion.so/${getTasksDbId()}?v=${TASKS_ACTIVE_VIEW_ID}`;
    const result = callNotionCli("notion-query-database-view", { view_url: viewUrl });
    return (result.results || []).map((t: any) => {
      const created = t.Created || "";
      return {
        id: extractIdFromUrl(t.url || ""),
        name: t.Name || "Untitled",
        source: "task" as const,
        status: t.Status || "",
        due: t["date:Due:start"] || t["date:Do Date:start"] || null,
        created,
        lastEdited: t.Edited || t.Updated || created,
        url: t.url || "",
        priority: t.Priority || "",
        type: t["P/I"] || "",
        hasProject: parseRelationUrls(t.Project || t.Projects || "").length > 0,
        hasTag: parseRelationUrls(t.Tag || "").length > 0,
        hasPerson: parseRelationUrls(t.Person || t.People || "").length > 0,
        archived: false,
        noteType: "",
      };
    });
  } catch (err) {
    console.error("Resurface: CLI tasks query failed:", err);
    return [];
  }
}

async function readBuckets(): Promise<RawCapture[]> {
  if (hasApiKey()) {
    const [notes, tasks] = await Promise.all([fetchNotesDirect(), fetchTasksDirect()]);
    return [...notes, ...tasks];
  }
  return [...fetchNotesCli(), ...fetchTasksCli()];
}

function fixtureKind(): "overflow" | "healthy" | null {
  const raw = (process.env.RESURFACE_FIXTURE || "").trim().toLowerCase();
  if (raw === "overflow" || raw === "healthy") return raw;
  return null;
}

async function computeDailyResurface(): Promise<DailyResurface> {
  const { todayStr, dateLabel } = getAWSTDates();
  const fixture = fixtureKind();
  const captures = fixture ? buildFixtureCaptures(fixture) : await readBuckets();
  const buckets = partitionBuckets(captures, fixture ? "2026-08-29" : todayStr);

  return composeDailyResurface(buckets, {
    dateLabel: fixture ? "29 Aug 2026" : dateLabel,
    nowIso: new Date().toISOString(),
  });
}

export async function getDailyResurface(): Promise<DailyResurface> {
  return cached("daily-resurface", computeDailyResurface, RESURFACE_CACHE_TTL);
}

export async function runResurfaceJob(): Promise<DailyResurface> {
  const report = await computeDailyResurface();
  console.log(formatResurfaceLog(report));
  return report;
}

export { formatResurfaceLog };
