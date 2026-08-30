import {
  INBOX_AUDIT_FIXTURE_TODAY,
  buildInboxAuditFixture,
  composeWeeklyInboxAudit,
  formatInboxAuditLog,
  type InboxAuditApplyRequest,
  type InboxAuditApplyResult,
  type InboxContainer,
  type InboxTask,
  type InboxVerdict,
  type WeeklyInboxAudit,
} from "../shared/inboxAudit";
import {
  archiveNotionPage,
  assignTaskRelation,
  assignTaskSelect,
  cached,
  callNotionCli,
  createNamedPage,
  extractIdFromUrl,
  fetchDatabaseSchema,
  getAWSTDates,
  getCheckbox,
  getDate,
  getGoalLookup,
  getGoalsDbId,
  getProjectLookup,
  getProjectsDbId,
  getRelationIds,
  getSelect,
  getStatus,
  getTasksDbId,
  getTitle,
  invalidateCache,
  queryDatabasePages,
  relationOrSelectOptions,
  tasksActiveCliViewUrl,
} from "./notion";

const INBOX_AUDIT_CACHE_TTL = 15 * 60 * 1000;

const appliedFixtureIds = new Set<string>();

export type { InboxAuditApplyResult };

function hasApiKey(): boolean {
  return !!(process.env.NOTION_API_KEY || process.env.NOTION_TOKEN);
}

function fixtureKind(): "overflow" | "healthy" | null {
  const raw = (process.env.RESURFACE_FIXTURE || "").trim().toLowerCase();
  if (raw === "overflow" || raw === "healthy") return raw;
  return null;
}

function pageId(page: any): string {
  return String(page.id || "").replace(/-/g, "");
}

function hasAnyRelation(props: any, names: string[]): boolean {
  return names.some((name) => getRelationIds(props, name).length > 0);
}

function hasReasonProps(props: any): boolean {
  if (hasAnyRelation(props, ["Reason", "Why", "Area"])) return true;
  return Boolean(getSelect(props, "Reason") || getSelect(props, "Why") || getSelect(props, "Area"));
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

function mapTaskPage(page: any): InboxTask {
  const props = page.properties || {};
  return {
    id: pageId(page),
    name: getTitle(props, "Name") || "Untitled",
    status: getStatus(props, "Status"),
    due: getDate(props, "Due") || getDate(props, "Do Date"),
    created: page.created_time || "",
    lastEdited: page.last_edited_time || "",
    url: page.url || "",
    archived: getCheckbox(props, "Archived"),
    hasProject: hasAnyRelation(props, ["Project", "Projects"]),
    hasGoal: hasAnyRelation(props, ["Goal", "Goals"]),
    hasReason: hasReasonProps(props),
  };
}

async function fetchTasksDirect(): Promise<InboxTask[]> {
  const pages = await queryDatabasePages(getTasksDbId(), {
    filter: { property: "Status", status: { does_not_equal: "Done" } },
    sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
  });
  return pages.map(mapTaskPage);
}

function fetchTasksCli(): InboxTask[] {
  try {
    const result = callNotionCli("notion-query-database-view", {
      view_url: tasksActiveCliViewUrl(),
    });
    return (result.results || []).map((t: any) => {
      const created = t.Created || "";
      return {
        id: extractIdFromUrl(t.url || ""),
        name: t.Name || "Untitled",
        status: t.Status || "",
        due: t["date:Due:start"] || t["date:Do Date:start"] || null,
        created,
        lastEdited: t.Edited || t.Updated || created,
        url: t.url || "",
        archived: String(t.Archived || "").toLowerCase() === "true",
        hasProject: parseRelationUrls(t.Project || t.Projects || "").length > 0,
        hasGoal: parseRelationUrls(t.Goal || t.Goals || "").length > 0,
        hasReason:
          parseRelationUrls(t.Reason || t.Why || t.Area || "").length > 0 ||
          Boolean(
            (t.Reason || t.Why || t.Area) &&
              String(t.Reason || t.Why || t.Area) !== "<omitted />" &&
              !String(t.Reason || t.Why || t.Area).startsWith("["),
          ),
      };
    });
  } catch (err) {
    console.error("Inbox audit: CLI tasks query failed:", err);
    return [];
  }
}

async function loadReasonContainers(): Promise<InboxContainer[]> {
  try {
    const schema = await fetchDatabaseSchema(getTasksDbId());
    const found = relationOrSelectOptions(schema, ["Reason", "Why", "Area"]);
    const out: InboxContainer[] = [];
    for (const prop of found) {
      for (const opt of prop.options) {
        if (!opt.name) continue;
        out.push({
          id: `reason:${prop.property}:${opt.name}`,
          name: opt.name,
          kind: "reason",
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function loadContainers(): Promise<InboxContainer[]> {
  const [projects, goals, reasons] = await Promise.all([
    getProjectLookup(),
    getGoalLookup(),
    loadReasonContainers(),
  ]);
  const containers: InboxContainer[] = [];
  for (const [name, info] of projects) {
    containers.push({ id: info.id, name, kind: "project" });
  }
  for (const [name, info] of goals) {
    containers.push({ id: info.id, name, kind: "goal" });
  }
  containers.push(...reasons);
  return containers;
}

async function loadLiveAudit(): Promise<WeeklyInboxAudit> {
  const { todayStr, dateLabel } = getAWSTDates();
  const [tasks, containers] = await Promise.all([
    hasApiKey() ? fetchTasksDirect() : Promise.resolve(fetchTasksCli()),
    loadContainers(),
  ]);
  return composeWeeklyInboxAudit(tasks, containers, {
    dateLabel,
    nowIso: new Date().toISOString(),
    todayStr,
  });
}

function loadFixtureAudit(): WeeklyInboxAudit {
  const { tasks, containers } = buildInboxAuditFixture();
  const remaining = tasks.filter((t) => !appliedFixtureIds.has(t.id));
  return composeWeeklyInboxAudit(remaining, containers, {
    dateLabel: "30 Aug 2026",
    nowIso: new Date().toISOString(),
    todayStr: INBOX_AUDIT_FIXTURE_TODAY,
  });
}

async function computeInboxAudit(): Promise<WeeklyInboxAudit> {
  return fixtureKind() ? loadFixtureAudit() : loadLiveAudit();
}

export async function getWeeklyInboxAudit(): Promise<WeeklyInboxAudit> {
  return cached("weekly-inbox-audit", computeInboxAudit, INBOX_AUDIT_CACHE_TTL);
}

export async function runInboxAuditJob(): Promise<WeeklyInboxAudit> {
  const report = await computeInboxAudit();
  console.log(formatInboxAuditLog(report));
  return report;
}

function allAuditItems(report: WeeklyInboxAudit) {
  return [...report.newItems, ...report.leftoverItems];
}

async function resolveTaskProperty(candidates: string[]): Promise<string> {
  const schema = await fetchDatabaseSchema(getTasksDbId());
  if (schema?.properties) {
    for (const name of candidates) {
      if (schema.properties[name]) return name;
    }
  }
  return candidates[0];
}

function parseApplyBody(body: any): InboxAuditApplyRequest {
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const verdict = body?.verdict as InboxVerdict;
  if (!id) throw new Error("id is required");
  if (verdict !== "assign" && verdict !== "remove" && verdict !== "recalibrate") {
    throw new Error("verdict must be assign, remove, or recalibrate");
  }
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const rawContainer = body?.createContainer;
  const createContainer =
    rawContainer && typeof rawContainer.name === "string" && rawContainer.name.trim()
      ? {
          name: rawContainer.name.trim().slice(0, 80),
          kind: rawContainer.kind === "goal" ? ("goal" as const) : ("project" as const),
        }
      : undefined;
  return { id, verdict, projectId: projectId || undefined, createContainer };
}

async function applyAssign(
  itemId: string,
  report: WeeklyInboxAudit,
  projectId?: string,
): Promise<InboxAuditApplyResult> {
  const item = allAuditItems(report).find((i) => i.id === itemId);
  if (!item) throw Object.assign(new Error("Task is not in the current uncontained audit"), { status: 404 });

  const targetId = projectId || item.match?.id;
  if (!targetId) {
    throw Object.assign(new Error("Assign needs an existing container. Pass projectId."), { status: 400 });
  }

  const container =
    report.containers.find((c) => c.id === targetId) ||
    (item.match && item.match.id === targetId
      ? { id: item.match.id, name: item.match.name, kind: item.match.kind }
      : null);
  if (!container) {
    throw Object.assign(new Error("Unknown container id"), { status: 400 });
  }

  if (fixtureKind()) {
    appliedFixtureIds.add(itemId);
    return {
      ok: true,
      id: itemId,
      verdict: "assign",
      action: "fixture_noop",
      wrote: false,
      message: `Fixture: would assign “${item.name}” to ${container.kind} “${container.name}”. No Notion write.`,
      container,
    };
  }

  if (container.kind === "reason") {
    const parts = container.id.split(":");
    const property = parts[1] || "Area";
    await assignTaskSelect(itemId, property, container.name);
  } else if (container.kind === "goal") {
    const property = await resolveTaskProperty(["Goal", "Goals"]);
    await assignTaskRelation(itemId, property, container.id);
  } else {
    const property = await resolveTaskProperty(["Project", "Projects"]);
    await assignTaskRelation(itemId, property, container.id);
  }

  return {
    ok: true,
    id: itemId,
    verdict: "assign",
    action: "assigned",
    wrote: true,
    message: `Assigned “${item.name}” to ${container.kind} “${container.name}”.`,
    container,
  };
}

async function applyRemove(itemId: string, report: WeeklyInboxAudit): Promise<InboxAuditApplyResult> {
  const item = allAuditItems(report).find((i) => i.id === itemId);
  if (!item) throw Object.assign(new Error("Task is not in the current uncontained audit"), { status: 404 });

  if (fixtureKind()) {
    appliedFixtureIds.add(itemId);
    return {
      ok: true,
      id: itemId,
      verdict: "remove",
      action: "fixture_noop",
      wrote: false,
      message: `Fixture: would archive “${item.name}”. No Notion write.`,
    };
  }

  await archiveNotionPage(itemId);
  return {
    ok: true,
    id: itemId,
    verdict: "remove",
    action: "archived",
    wrote: true,
    message: `Archived “${item.name}” (not hard-deleted).`,
  };
}

async function applyRecalibrate(
  itemId: string,
  report: WeeklyInboxAudit,
  createContainer?: InboxAuditApplyRequest["createContainer"],
): Promise<InboxAuditApplyResult> {
  const item = allAuditItems(report).find((i) => i.id === itemId);
  if (!item) throw Object.assign(new Error("Task is not in the current uncontained audit"), { status: 404 });

  const proposed = createContainer || item.proposedContainer;
  if (!proposed?.name) {
    throw Object.assign(new Error("Recalibrate needs createContainer.name"), { status: 400 });
  }

  if (fixtureKind()) {
    appliedFixtureIds.add(itemId);
    return {
      ok: true,
      id: itemId,
      verdict: "recalibrate",
      action: "fixture_noop",
      wrote: false,
      message: `Fixture: would create ${proposed.kind} “${proposed.name}” and assign “${item.name}”. No Notion write.`,
      container: { id: `fixture-${proposed.kind}`, name: proposed.name, kind: proposed.kind },
    };
  }

  if (proposed.kind === "goal") {
    const goalsDb = getGoalsDbId();
    if (!goalsDb) {
      throw Object.assign(
        new Error("NOTION_GOALS_DB_ID is required to create a goal. Create a project instead, or set the env var."),
        { status: 400 },
      );
    }
    const created = await createNamedPage(goalsDb, proposed.name);
    const property = await resolveTaskProperty(["Goal", "Goals"]);
    await assignTaskRelation(itemId, property, created.id);
    return {
      ok: true,
      id: itemId,
      verdict: "recalibrate",
      action: "recalibrated",
      wrote: true,
      message: `Created goal “${proposed.name}” and assigned “${item.name}”.`,
      container: { id: created.id, name: proposed.name, kind: "goal" },
    };
  }

  const created = await createNamedPage(getProjectsDbId(), proposed.name);
  const property = await resolveTaskProperty(["Project", "Projects"]);
  await assignTaskRelation(itemId, property, created.id);
  return {
    ok: true,
    id: itemId,
    verdict: "recalibrate",
    action: "recalibrated",
    wrote: true,
    message: `Created project “${proposed.name}” and assigned “${item.name}”.`,
    container: { id: created.id, name: proposed.name, kind: "project" },
  };
}

export async function applyInboxAudit(body: unknown): Promise<InboxAuditApplyResult> {
  const request = parseApplyBody(body);
  const report = await computeInboxAudit();
  let result: InboxAuditApplyResult;

  if (request.verdict === "assign") {
    result = await applyAssign(request.id, report, request.projectId);
  } else if (request.verdict === "remove") {
    result = await applyRemove(request.id, report);
  } else {
    result = await applyRecalibrate(request.id, report, request.createContainer);
  }

  invalidateCache("weekly-inbox-audit");
  invalidateCache("daily-resurface");
  invalidateCache("daily-standup");
  invalidateCache("projects-health");
  return result;
}

export { formatInboxAuditLog };
