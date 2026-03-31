import type {
  VoiceNoteListItem,
  VoiceNoteDetail,
  TaskItem,
  ParsedContent,
  ProjectHealth,
  ProjectTaskSummary,
} from "../shared/schema";
// --- Notion API client ---
// CLI fallback for sandbox environments (optional)
let execSync: any;
try { execSync = require("child_process").execSync; } catch {}
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function getNotionKey(): string {
  const key = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || "";
  if (!key) {
    throw new Error(
      "NOTION_API_KEY is not set. Create a Notion integration at https://www.notion.so/my-integrations and add the token to your .env file."
    );
  }
  return key;
}

// Database IDs (set via env or fallback to Jake's workspace)
function getNotesDbId(): string {
  return process.env.NOTION_NOTES_DB_ID || "592d777bf7438256ad348129ae94a20d";
}

function getTasksDbId(): string {
  return process.env.NOTION_TASKS_DB_ID || "6bfd777bf7438394a98c01400b00f442";
}

async function notionFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${NOTION_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getNotionKey()}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API error ${res.status}: ${body}`);
  }

  return res.json();
}

// --- Simple in-memory cache ---
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return entry.data as T;
  }
  const data = await fn();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

// --- Extract page ID helpers ---
function extractPageId(urlOrId: string): string {
  const match = urlOrId.match(/([a-f0-9]{32})$/);
  if (match) return match[1];
  return urlOrId.replace(/-/g, "");
}

function formatUuid(id: string): string {
  const clean = id.replace(/-/g, "");
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

// --- Notion property extractors ---
function getTitle(props: any, propName: string): string {
  const prop = props[propName];
  if (!prop || !prop.title) return "";
  return prop.title.map((t: any) => t.plain_text || "").join("");
}

function getRichText(props: any, propName: string): string {
  const prop = props[propName];
  if (!prop || !prop.rich_text) return "";
  return prop.rich_text.map((t: any) => t.plain_text || "").join("");
}

function getSelect(props: any, propName: string): string {
  const prop = props[propName];
  if (!prop || !prop.select) return "";
  return prop.select.name || "";
}

function getStatus(props: any, propName: string): string {
  const prop = props[propName];
  if (!prop || !prop.status) return "";
  return prop.status.name || "";
}

function getNumber(props: any, propName: string): number | null {
  const prop = props[propName];
  if (!prop || prop.number === null || prop.number === undefined) return null;
  return prop.number;
}

function getDate(props: any, propName: string): string | null {
  const prop = props[propName];
  if (!prop || !prop.date) return null;
  return prop.date.start || null;
}

function getRelationIds(props: any, propName: string): string[] {
  const prop = props[propName];
  if (!prop || !prop.relation) return [];
  return prop.relation.map((r: any) => r.id.replace(/-/g, ""));
}

function getCreatedTime(props: any): string {
  const prop = props["Created"];
  if (prop && prop.created_time) return prop.created_time;
  return "";
}

function getLastEditedTime(props: any): string {
  const prop = props["Updated"] || props["Edited"];
  if (prop && prop.last_edited_time) return prop.last_edited_time;
  return "";
}

// --- Extract page content as text ---
async function getPageContent(pageId: string): Promise<string> {
  const uuid = formatUuid(pageId);
  const blocks = await notionFetch(`/blocks/${uuid}/children?page_size=100`);
  const lines: string[] = [];

  for (const block of blocks.results || []) {
    const type = block.type;
    const data = block[type];
    if (!data) continue;

    switch (type) {
      case "heading_1":
        lines.push(`# ${richTextToPlain(data.rich_text)}`);
        break;
      case "heading_2":
        lines.push(`## ${richTextToPlain(data.rich_text)}`);
        break;
      case "heading_3":
        lines.push(`### ${richTextToPlain(data.rich_text)}`);
        break;
      case "paragraph":
        lines.push(richTextToPlain(data.rich_text));
        break;
      case "bulleted_list_item":
        lines.push(`- ${richTextToPlain(data.rich_text)}`);
        break;
      case "numbered_list_item":
        lines.push(`- ${richTextToPlain(data.rich_text)}`);
        break;
      case "to_do":
        const checked = data.checked ? "x" : " ";
        lines.push(`- [${checked}] ${richTextToPlain(data.rich_text)}`);
        break;
      case "toggle":
        lines.push(`<details><summary>${richTextToPlain(data.rich_text)}</summary>`);
        // Fetch children of toggle
        if (block.has_children) {
          try {
            const children = await notionFetch(`/blocks/${block.id}/children?page_size=100`);
            for (const child of children.results || []) {
              const cType = child.type;
              const cData = child[cType];
              if (cData && cData.rich_text) {
                lines.push(`\t${richTextToPlain(cData.rich_text)}`);
              }
            }
          } catch {}
        }
        lines.push(`</details>`);
        break;
      case "quote":
        lines.push(`> ${richTextToPlain(data.rich_text)}`);
        break;
      case "callout":
        const icon = data.icon?.emoji || "";
        lines.push(`> ${icon} ${richTextToPlain(data.rich_text)}`);
        break;
      case "divider":
        lines.push("---");
        break;
      case "table_row":
        break;
      default:
        if (data.rich_text) {
          lines.push(richTextToPlain(data.rich_text));
        }
    }
  }

  return lines.join("\n");
}

function richTextToPlain(richText: any[]): string {
  if (!richText) return "";
  return richText
    .map((t: any) => {
      let text = t.plain_text || "";
      if (t.annotations?.bold) text = `**${text}**`;
      return text;
    })
    .join("");
}

// --- Thomas Frank voice note format parser ---
const threadIcons = ["📋", "💬", "🎯", "⚡", "🔧", "📊", "🧠", "🔍", "💡", "🚀"];

function parseThomasFrankFormat(content: string, result: ParsedContent): ParsedContent {
  function getSection(heading: string): string {
    const regex = new RegExp(`(?:^|\n)# ${heading}[^\n]*\n([\\s\\S]*?)(?=\n# |$)`);
    const match = content.match(regex);
    return match ? match[1].trim() : "";
  }

  // Summary
  const summaryText = getSection("Summary");
  if (summaryText) result.summary = summaryText;

  // Main Points → key threads
  const mainPoints = getSection("Main Points");
  if (mainPoints) {
    const bullets = mainPoints.match(/^[\t ]*[-*]\s+(.+)/gm);
    if (bullets) {
      bullets.forEach((b, i) => {
        const text = b.replace(/^[\t ]*[-*]\s+/, "").trim();
        if (text.length > 5) {
          result.keyThreads.push({
            title: text.length > 60 ? text.slice(0, 60) + "…" : text,
            description: text,
            icon: threadIcons[i % threadIcons.length],
          });
        }
      });
    }
  }

  // Action Items → insights
  const actionItems = getSection("Action Items");
  if (actionItems) {
    const bullets = actionItems.match(/^[\t ]*[-*]\s+(.+)/gm);
    if (bullets) {
      bullets.forEach((b) => {
        const text = b.replace(/^[\t ]*[-*]\s+/, "").trim();
        if (text.length > 5) result.insights.push(text);
      });
    }
  }

  // Cleaned Transcription Text metadata
  const cleanedSection = getSection("Cleaned Transcription Text");
  if (cleanedSection) {
    const fieldMap: Record<string, string> = {};
    const fieldRegex = /[\t ]*[-*]\s+\*\*([^*]+)\*\*:\s*(.+)/g;
    let m;
    while ((m = fieldRegex.exec(cleanedSection)) !== null) {
      fieldMap[m[1].trim()] = m[2].trim();
    }

    if (fieldMap["concise_summary"] && !result.summary) {
      result.summary = fieldMap["concise_summary"];
    }

    if (fieldMap["direct_points"]) {
      fieldMap["direct_points"]
        .split(/[.;]/)
        .filter((p) => p.trim().length > 10)
        .forEach((p) => {
          const trimmed = p.trim();
          if (!result.insights.includes(trimmed)) result.insights.push(trimmed);
        });
    }

    if (fieldMap["emerging_concepts"]) {
      fieldMap["emerging_concepts"].split(/[.,;]/).forEach((c) => {
        const trimmed = c.trim();
        if (trimmed.length > 5) result.emergingConcepts.push(trimmed);
      });
    }

    if (fieldMap["notable_insights"]) {
      const text = fieldMap["notable_insights"];
      if (text.length > 10 && !result.insights.includes(text)) {
        result.insights.unshift(text);
      }
    }

    if (fieldMap["latent_opportunities"]) {
      fieldMap["latent_opportunities"].split(/[.;]/).forEach((o) => {
        const trimmed = o.trim();
        if (trimmed.length > 10) result.opportunities.push({ text: trimmed, context: "" });
      });
    }

    if (fieldMap["tensions_or_conflicts"]) {
      fieldMap["tensions_or_conflicts"].split(/[.;]/).forEach((t) => {
        const trimmed = t.trim();
        if (trimmed.length > 10) result.tensions.push({ text: trimmed, context: "" });
      });
    }

    if (fieldMap["assumptions"]) {
      fieldMap["assumptions"].split(/[.;]/).forEach((a) => {
        const trimmed = a.trim();
        if (trimmed.length > 10) result.assumptions.push(trimmed);
      });
    }

    if (fieldMap["questions_to_explore"]) {
      fieldMap["questions_to_explore"].split(/[?]/).forEach((q) => {
        const trimmed = q.trim();
        if (trimmed.length > 10) result.questions.push(trimmed + "?");
      });
    }
  }

  return result;
}

// --- Content parser ---
function parseVoiceNoteContent(text: string): ParsedContent {
  const result: ParsedContent = {
    summary: "",
    keyThreads: [],
    insights: [],
    emergingConcepts: [],
    tensions: [],
    opportunities: [],
    questions: [],
    assumptions: [],
    rawContent: text,
    isStructured: false,
  };

  const content = text;

  const isOurFormat = content.includes("## Summary") || content.includes("## Key Threads");
  const isTFFormat = /^# Summary\b/m.test(content) || /^# Main Points\b/m.test(content);

  if (isOurFormat || isTFFormat) {
    result.isStructured = true;
  }

  if (isTFFormat && !isOurFormat) {
    return parseThomasFrankFormat(content, result);
  }

  // Our structured format (## headings)
  const summaryMatch = content.match(/## Summary\s*\n([\s\S]*?)(?=\n---|\n## )/);
  if (summaryMatch) result.summary = summaryMatch[1].trim();

  // Key Threads
  const threadsMatch = content.match(/## Key Threads[^\n]*\n([\s\S]*?)(?=\n---|\n## )/);
  if (threadsMatch) {
    const threadsBlock = threadsMatch[1];
    let m;
    let idx = 0;

    const detailsRegex = /<details>\s*<summary>([^<]*)<\/summary>\s*([\s\S]*?)\s*<\/details>/g;
    while ((m = detailsRegex.exec(threadsBlock)) !== null) {
      const rawTitle = m[1].trim();
      const emojiMatch = rawTitle.match(/^([\p{Emoji}\u200d]+)\s*(.*)/u);
      const icon = emojiMatch ? emojiMatch[1] : threadIcons[idx % threadIcons.length];
      const title = emojiMatch ? emojiMatch[2].trim() : rawTitle;
      result.keyThreads.push({ title, description: m[2].trim(), icon });
      idx++;
    }

    if (result.keyThreads.length === 0) {
      const bulletRegex = /[-*]\s+\*\*([^*]+)\*\*[:\s]*(.*)/g;
      while ((m = bulletRegex.exec(threadsBlock)) !== null) {
        result.keyThreads.push({
          title: m[1].trim(),
          description: m[2].trim(),
          icon: threadIcons[idx % threadIcons.length],
        });
        idx++;
      }
    }

    if (result.keyThreads.length === 0) {
      const headingRegex = /###\s+(.+)\n([\s\S]*?)(?=\n###|\n## |$)/g;
      while ((m = headingRegex.exec(threadsBlock)) !== null) {
        result.keyThreads.push({
          title: m[1].trim(),
          description: m[2].trim().replace(/^[-*]\s+/gm, "").trim(),
          icon: threadIcons[idx % threadIcons.length],
        });
        idx++;
      }
    }
  }

  // Notable Insights
  const insightsMatch = content.match(/## Notable Insights\s*\n([\s\S]*?)(?=\n---|\n## )/);
  if (insightsMatch) {
    const block = insightsMatch[1];
    const quoteRegex = />\s*(.+)/g;
    let m;
    while ((m = quoteRegex.exec(block)) !== null) {
      const text = m[1].trim();
      if (text && !text.startsWith("📊") && !text.startsWith("[")) result.insights.push(text);
    }
    if (result.insights.length === 0) {
      const bulletRegex = /[-*]\s+(.+)/g;
      while ((m = bulletRegex.exec(block)) !== null) result.insights.push(m[1].trim());
    }
  }

  // Emerging Concepts
  const conceptsMatch = content.match(/## Emerging Concepts\s*\n([\s\S]*?)(?=\n---|\n## )/);
  if (conceptsMatch) {
    const bulletRegex = /[-*]\s+(.+)/g;
    let m;
    while ((m = bulletRegex.exec(conceptsMatch[1])) !== null) {
      result.emergingConcepts.push(m[1].trim().replace(/\*\*/g, ""));
    }
  }

  // Tensions & Conflicts
  const tensionsMatch = content.match(/## Tensions & Conflicts[^\n]*\n([\s\S]*?)(?=\n---|\n## )/);
  if (tensionsMatch) {
    const block = tensionsMatch[1];
    let m;
    const bqCtx = />\s*[⚠️💡]*\s*(.+?)\n([^>\n-][^\n]*)/g;
    while ((m = bqCtx.exec(block)) !== null) {
      const text = m[1].trim().replace(/^\*\*|\*\*$/g, "");
      if (text) result.tensions.push({ text, context: m[2].trim() });
    }
    if (result.tensions.length === 0) {
      const quoteRegex = />\s*[⚠️]*\s*(.+)/g;
      while ((m = quoteRegex.exec(block)) !== null) {
        const text = m[1].trim().replace(/^\*\*|\*\*$/g, "");
        if (text) result.tensions.push({ text, context: "" });
      }
    }
    if (result.tensions.length === 0) {
      const simpleBullet = /[-*]\s+(.+)/g;
      while ((m = simpleBullet.exec(block)) !== null) {
        result.tensions.push({ text: m[1].trim().replace(/\*\*/g, ""), context: "" });
      }
    }
  }

  // Latent Opportunities
  const oppsMatch = content.match(/## Latent Opportunities[^\n]*\n([\s\S]*?)(?=\n---|\n## )/);
  if (oppsMatch) {
    const block = oppsMatch[1];
    let m;
    const bqCtx = />\s*[💡⚠️]*\s*(.+?)\n([^>\n-][^\n]*)/g;
    while ((m = bqCtx.exec(block)) !== null) {
      const text = m[1].trim().replace(/^\*\*|\*\*$/g, "");
      if (text) result.opportunities.push({ text, context: m[2].trim() });
    }
    if (result.opportunities.length === 0) {
      const quoteRegex = />\s*[💡]*\s*(.+)/g;
      while ((m = quoteRegex.exec(block)) !== null) {
        const text = m[1].trim().replace(/^\*\*|\*\*$/g, "");
        if (text) result.opportunities.push({ text, context: "" });
      }
    }
    if (result.opportunities.length === 0) {
      const simpleBullet = /[-*]\s+(.+)/g;
      while ((m = simpleBullet.exec(block)) !== null) {
        result.opportunities.push({ text: m[1].trim().replace(/\*\*/g, ""), context: "" });
      }
    }
  }

  // Questions to Explore
  const questionsMatch = content.match(/## Questions to Explore\s*\n([\s\S]*?)(?=\n---|\n## |$)/);
  if (questionsMatch) {
    const block = questionsMatch[1];
    const todoRegex = /\[[ x]?\]\s*(.+)/g;
    let m;
    while ((m = todoRegex.exec(block)) !== null) result.questions.push(m[1].trim());
    if (result.questions.length === 0) {
      const bulletRegex = /[-*]\s+(.+)/g;
      while ((m = bulletRegex.exec(block)) !== null) result.questions.push(m[1].trim());
    }
  }

  // Assumptions
  const assumptionsMatch = content.match(/## Assumptions Being Made\s*\n([\s\S]*?)(?=\n---|\n## |$)/);
  if (assumptionsMatch) {
    const bulletRegex = /[-*]\s+(.+)/g;
    let m;
    while ((m = bulletRegex.exec(assumptionsMatch[1])) !== null) {
      result.assumptions.push(m[1].trim().replace(/\*\*/g, ""));
    }
  }

  return result;
}

// --- Query Voice Notes from Notion database ---
async function queryVoiceNotes(): Promise<any[]> {
  const dbId = formatUuid(getNotesDbId());
  let allResults: any[] = [];
  let startCursor: string | undefined;

  do {
    const body: any = {
      filter: {
        property: "Type",
        select: { equals: "Voice Note" },
      },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 100,
    };
    if (startCursor) body.start_cursor = startCursor;

    const response = await notionFetch(`/databases/${dbId}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    allResults = allResults.concat(response.results || []);
    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);

  return allResults;
}

// --- Fetch a single task ---
async function fetchTask(taskId: string): Promise<TaskItem | null> {
  try {
    const uuid = formatUuid(taskId);
    const page = await notionFetch(`/pages/${uuid}`);
    const props = page.properties || {};

    return {
      id: taskId,
      name: getTitle(props, "Name"),
      status: getStatus(props, "Status"),
      type: getSelect(props, "P/I"),
      location: getSelect(props, "Location"),
      priority: getStatus(props, "Priority"),
      energy: getSelect(props, "Energy"),
      due: getDate(props, "Due"),
      completed: getDate(props, "Completed"),
      url: page.url || "",
    };
  } catch (err) {
    console.error(`Failed to fetch task ${taskId}:`, err);
    return null;
  }
}

// --- Public API ---

export async function listVoiceNotes(): Promise<VoiceNoteListItem[]> {
  return cached("voice-notes-list", async () => {
    const pages = await queryVoiceNotes();

    return pages
      .filter((p: any) => p.properties)
      .map((p: any) => {
        const props = p.properties;
        const id = p.id.replace(/-/g, "");
        const taskIds = getRelationIds(props, "Tasks");

        return {
          id,
          name: getTitle(props, "Name") || "Untitled",
          noteDate: getDate(props, "Note Date"),
          created: p.created_time || "",
          updated: p.last_edited_time || "",
          durationSeconds: getNumber(props, "Duration (Seconds)"),
          taskCount: taskIds.length,
          url: p.url || "",
        };
      });
  });
}

export async function getVoiceNoteDetail(pageId: string): Promise<VoiceNoteDetail> {
  return cached(`voice-note-${pageId}`, async () => {
    const uuid = formatUuid(pageId);
    const page = await notionFetch(`/pages/${uuid}`);
    const props = page.properties || {};

    // Get page content
    const contentText = await getPageContent(pageId);
    const content = parseVoiceNoteContent(contentText);

    // Fetch linked tasks
    const taskIds = getRelationIds(props, "Tasks");
    const tasks: TaskItem[] = [];
    
    // Fetch tasks in parallel (batches of 5 to avoid rate limits)
    for (let i = 0; i < taskIds.length; i += 5) {
      const batch = taskIds.slice(i, i + 5);
      const results = await Promise.all(batch.map((id) => fetchTask(id)));
      results.forEach((t) => { if (t) tasks.push(t); });
    }

    return {
      id: pageId,
      name: getTitle(props, "Name") || "Untitled Voice Note",
      noteDate: getDate(props, "Note Date"),
      created: page.created_time || "",
      updated: page.last_edited_time || "",
      durationSeconds: getNumber(props, "Duration (Seconds)"),
      url: page.url || "",
      content,
      tasks,
    };
  });
}

export async function getTasksForVoiceNote(voiceNoteId: string): Promise<TaskItem[]> {
  const detail = await getVoiceNoteDetail(voiceNoteId);
  return detail.tasks;
}

// --- Project Health Monitor ---

const PROJECTS_DB_ID = "f7cd777bf74383818c5c8152d47dbf1f";
const PROJECTS_VIEW_ID = "c46d777b-f743-83ca-8031-88dcb99b88a3";
const TASKS_DB_ID = "6bfd777bf7438394a98c01400b00f442";
const TASKS_ACTIVE_VIEW_ID = "b57d777b-f743-8353-9302-084e5c538a60";
const TASKS_COMPLETE_VIEW_ID = "0a8d777b-f743-83e8-b14f-888fe9865b80";

function callNotionCli(toolName: string, args: Record<string, unknown>): any {
  const params = JSON.stringify({ source_id: "notion_mcp", tool_name: toolName, arguments: args });
  const escaped = params.replace(/'/g, "'\\'");
  return JSON.parse(
    execSync(`external-tool call '${escaped}'`, { maxBuffer: 10 * 1024 * 1024 }).toString()
  );
}

function extractIdFromUrl(url: string): string {
  const match = url.match(/([a-f0-9]{32})$/);
  return match ? match[1] : url.replace(/-/g, "");
}

// Fetch all tasks from both Active and Complete views (2 CLI calls total)
function fetchAllTasksViaCli(): Map<string, ProjectTaskSummary[]> {
  const tasksByProjectUrl = new Map<string, ProjectTaskSummary[]>();

  const views = [TASKS_ACTIVE_VIEW_ID, TASKS_COMPLETE_VIEW_ID];
  for (const viewId of views) {
    try {
      const viewUrl = `https://www.notion.so/${TASKS_DB_ID}?v=${viewId}`;
      const result = callNotionCli("notion-query-database-view", { view_url: viewUrl });
      const tasks = result.results || [];

      for (const t of tasks) {
        const projectRaw = t.Project || "";
        if (!projectRaw || projectRaw === "<omitted />") continue;

        let projectUrls: string[] = [];
        try {
          projectUrls = JSON.parse(projectRaw);
        } catch {
          continue;
        }

        const task: ProjectTaskSummary = {
          name: t.Name || "",
          status: t.Status || "",
          type: t["P/I"] || "",
          due: t["date:Due:start"] || null,
        };

        for (const pUrl of projectUrls) {
          const existing = tasksByProjectUrl.get(pUrl) || [];
          existing.push(task);
          tasksByProjectUrl.set(pUrl, existing);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch tasks view ${viewId}:`, err);
    }
  }

  return tasksByProjectUrl;
}

function computeHealth(
  status: string,
  tasksDone: number,
  totalTasks: number,
  daysSinceActivity: number,
  overdueCount: number
): ProjectHealth["health"] {
  if (status === "Planned") return "waiting";
  if (status === "On Hold") return "paused";

  const completionRate = totalTasks > 0 ? tasksDone / totalTasks : 0;

  // Stalled check first
  if (daysSinceActivity > 14 || overdueCount > 2) return "stalled";

  // Needs Attention
  if (
    (daysSinceActivity >= 7 && daysSinceActivity <= 14) ||
    (overdueCount >= 1 && overdueCount <= 2) ||
    (completionRate < 0.1 && totalTasks > 3)
  ) {
    return "attention";
  }

  // Healthy
  if (completionRate > 0.3 || (daysSinceActivity < 7 && overdueCount === 0)) {
    return "healthy";
  }

  return "attention";
}

export async function listProjects(): Promise<ProjectHealth[]> {
  return cached("projects-health", async () => {
    const hasApiKey = !!(process.env.NOTION_API_KEY || process.env.NOTION_TOKEN);
    const now = new Date();
    const projects: ProjectHealth[] = [];

    if (hasApiKey) {
      // Direct Notion API path
      const dbId = formatUuid(PROJECTS_DB_ID);
      let allResults: any[] = [];
      let startCursor: string | undefined;

      do {
        const body: any = {
          filter: { property: "Archived", checkbox: { equals: false } },
          sorts: [
            { property: "Status", direction: "ascending" },
            { timestamp: "last_edited_time", direction: "descending" },
          ],
          page_size: 100,
        };
        if (startCursor) body.start_cursor = startCursor;

        const response = await notionFetch(`/databases/${dbId}/query`, {
          method: "POST",
          body: JSON.stringify(body),
        });

        allResults = allResults.concat(response.results || []);
        startCursor = response.has_more ? response.next_cursor : undefined;
      } while (startCursor);

      for (const proj of allResults) {
        const props = proj.properties || {};
        const id = proj.id.replace(/-/g, "");
        const name = getTitle(props, "Name");
        const status = getStatus(props, "Status");
        if (status === "Done") continue;

        const editedTime = proj.last_edited_time || "";
        const targetDeadline = getDate(props, "Target Deadline");
        const taskIds = getRelationIds(props, "Tasks");
        const noteCount = getRelationIds(props, "Notes").length;
        const tagIds = getRelationIds(props, "Tag");
        const url = proj.url || "";

        // Fetch tasks in batches of 5
        const tasks: ProjectTaskSummary[] = [];
        for (let i = 0; i < taskIds.length; i += 5) {
          const batch = taskIds.slice(i, i + 5);
          const results = await Promise.all(
            batch.map(async (tid: string) => {
              try {
                const uuid = formatUuid(tid);
                const page = await notionFetch(`/pages/${uuid}`);
                const p = page.properties || {};
                return {
                  name: getTitle(p, "Name"),
                  status: getStatus(p, "Status"),
                  type: getSelect(p, "P/I"),
                  due: getDate(p, "Due"),
                };
              } catch { return null; }
            })
          );
          results.forEach((t) => { if (t) tasks.push(t); });
        }

        const tasksDone = tasks.filter((t) => t.status === "Done").length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? tasksDone / totalTasks : 0;
        const editedDate = editedTime ? new Date(editedTime) : now;
        const daysSinceActivity = Math.floor((now.getTime() - editedDate.getTime()) / 86400000);
        const overdueCount = tasks.filter((t) => t.status !== "Done" && t.due && new Date(t.due) < now).length;
        let daysUntilDeadline: number | null = null;
        if (targetDeadline) daysUntilDeadline = Math.ceil((new Date(targetDeadline).getTime() - now.getTime()) / 86400000);

        const health = computeHealth(status, tasksDone, totalTasks, daysSinceActivity, overdueCount);

        projects.push({
          id, name, status, health, taskCount: totalTasks, tasksDone,
          tasksOverdue: overdueCount, completionRate, daysSinceActivity,
          targetDeadline, daysUntilDeadline, noteCount,
          tag: tagIds.length > 0 ? tagIds[0] : "", url, tasks,
        });
      }
    } else {
      // CLI path: 3 calls total (projects + active tasks + complete tasks)
      const viewUrl = `https://www.notion.so/${PROJECTS_DB_ID}?v=${PROJECTS_VIEW_ID}`;
      const projResult = callNotionCli("notion-query-database-view", { view_url: viewUrl });
      const rawProjects = projResult.results || [];

      // Fetch all tasks in 2 bulk calls and index by project URL
      const tasksByProjectUrl = fetchAllTasksViaCli();

      for (const proj of rawProjects) {
        const id = extractIdFromUrl(proj.url || "");
        const name = proj.Name || "";
        const status = proj.Status || "";
        if (status === "Done") continue;

        const editedTime = proj.Edited || "";
        const targetDeadline = proj["date:Target Deadline:start"] || null;
        const url = proj.url || "";

        // Parse notes count
        let noteCount = 0;
        try {
          const notesRaw = proj.Notes || "";
          const notesParsed = notesRaw ? JSON.parse(notesRaw) : [];
          noteCount = Array.isArray(notesParsed) ? notesParsed.length : 0;
        } catch { noteCount = 0; }

        // Parse tag
        let tag = "";
        try {
          const tagRaw = proj.Tag || "";
          const tagParsed = tagRaw ? JSON.parse(tagRaw) : "";
          tag = Array.isArray(tagParsed) ? (tagParsed[0] || "") : (tagRaw || "");
        } catch { tag = ""; }
        const tagName = tag ? tag.replace(/https:\/\/www\.notion\.so\//, "") : "";

        // Get tasks for this project from the indexed map
        // Match by project URL
        const tasks = tasksByProjectUrl.get(url) || [];

        // Also try matching tasks that were linked in the project's Tasks field
        // but might not have the Project back-relation set
        const tasksRaw = proj.Tasks || "";
        let linkedTaskUrls: string[] = [];
        try {
          linkedTaskUrls = tasksRaw ? JSON.parse(tasksRaw) : [];
        } catch { linkedTaskUrls = []; }

        const tasksDone = tasks.filter((t) => t.status === "Done").length;
        // Use the max of linked count vs actual fetched count for total
        const totalTasks = Math.max(tasks.length, linkedTaskUrls.length);
        const completionRate = totalTasks > 0 ? tasksDone / totalTasks : 0;

        const editedDate = editedTime ? new Date(editedTime) : now;
        const daysSinceActivity = Math.floor((now.getTime() - editedDate.getTime()) / 86400000);
        const overdueCount = tasks.filter((t) => t.status !== "Done" && t.due && new Date(t.due) < now).length;

        let daysUntilDeadline: number | null = null;
        if (targetDeadline) daysUntilDeadline = Math.ceil((new Date(targetDeadline).getTime() - now.getTime()) / 86400000);

        const health = computeHealth(status, tasksDone, totalTasks, daysSinceActivity, overdueCount);

        projects.push({
          id, name, status, health, taskCount: totalTasks, tasksDone,
          tasksOverdue: overdueCount, completionRate, daysSinceActivity,
          targetDeadline, daysUntilDeadline, noteCount,
          tag: tagName, url, tasks,
        });
      }
    }

    return projects;
  });
}
