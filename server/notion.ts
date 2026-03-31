import { execSync } from "child_process";
import type {
  VoiceNoteListItem,
  VoiceNoteDetail,
  TaskItem,
  ParsedContent,
} from "../shared/schema";

// --- Notion CLI helper ---
function callNotion(toolName: string, args: Record<string, unknown>): any {
  const params = JSON.stringify({
    source_id: "notion_mcp",
    tool_name: toolName,
    arguments: args,
  });
  const escaped = params.replace(/'/g, "'\\''");
  const result = execSync(`external-tool call '${escaped}'`, {
    maxBuffer: 10 * 1024 * 1024,
  }).toString();
  return JSON.parse(result);
}

// --- Simple in-memory cache ---
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

function cached<T>(key: string, fn: () => T): T {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return entry.data as T;
  }
  const data = fn();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

// --- Extract page ID from URL ---
function extractPageId(urlOrId: string): string {
  // Handle full Notion URLs
  const match = urlOrId.match(/([a-f0-9]{32})$/);
  if (match) return match[1];
  // Already a bare ID
  return urlOrId.replace(/-/g, "");
}

// --- Content parser ---
const threadIcons = ["📋", "💬", "🎯", "⚡", "🔧", "📊", "🧠", "🔍", "💡", "🚀"];

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

  // Extract just the <content> section
  const contentMatch = text.match(/<content>([\s\S]*?)<\/content>/);
  const content = contentMatch ? contentMatch[1] : text;

  // Check if structured format
  if (content.includes("## Summary") || content.includes("## Key Threads")) {
    result.isStructured = true;
  }

  // Extract summary
  const summaryMatch = content.match(/## Summary\s*\n([\s\S]*?)(?=\n---|\n## )/);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  }

  // Extract Key Threads — toggles in Notion markdown
  const threadsMatch = content.match(/## Key Threads\s*\n([\s\S]*?)(?=\n---|\n## )/);
  if (threadsMatch) {
    const threadsBlock = threadsMatch[1];
    // Notion toggles: <toggle summary="Title">Description</toggle>
    const toggleRegex = /<toggle summary="([^"]*)">\s*([\s\S]*?)\s*<\/toggle>/g;
    let m;
    let idx = 0;
    while ((m = toggleRegex.exec(threadsBlock)) !== null) {
      result.keyThreads.push({
        title: m[1].trim(),
        description: m[2].trim(),
        icon: threadIcons[idx % threadIcons.length],
      });
      idx++;
    }
    // Fallback: bullet list style
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
    // Fallback: ### headings
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

  // Extract Notable Insights
  const insightsMatch = content.match(/## Notable Insights\s*\n([\s\S]*?)(?=\n---|\n## )/);
  if (insightsMatch) {
    const block = insightsMatch[1];
    // blockquotes
    const quoteRegex = />\s*(.+)/g;
    let m;
    while ((m = quoteRegex.exec(block)) !== null) {
      const text = m[1].trim();
      if (text && !text.startsWith("📊") && !text.startsWith("[")) {
        result.insights.push(text);
      }
    }
    // fallback: bullets
    if (result.insights.length === 0) {
      const bulletRegex = /[-*]\s+(.+)/g;
      while ((m = bulletRegex.exec(block)) !== null) {
        result.insights.push(m[1].trim());
      }
    }
  }

  // Extract Emerging Concepts
  const conceptsMatch = content.match(/## Emerging Concepts\s*\n([\s\S]*?)(?=\n---|\n## )/);
  if (conceptsMatch) {
    const block = conceptsMatch[1];
    const bulletRegex = /[-*]\s+(.+)/g;
    let m;
    while ((m = bulletRegex.exec(block)) !== null) {
      result.emergingConcepts.push(m[1].trim().replace(/\*\*/g, ""));
    }
  }

  // Extract Tensions & Conflicts
  const tensionsMatch = content.match(/## Tensions & Conflicts\s*\n([\s\S]*?)(?=\n---|\n## )/);
  if (tensionsMatch) {
    const block = tensionsMatch[1];
    const bulletRegex = /[-*]\s+\*\*([^*]+)\*\*[:\s]*(.*)/g;
    let m;
    while ((m = bulletRegex.exec(block)) !== null) {
      result.tensions.push({ text: m[1].trim(), context: m[2].trim() });
    }
    // Fallback: plain bullets
    if (result.tensions.length === 0) {
      const simpleBullet = /[-*]\s+(.+)/g;
      while ((m = simpleBullet.exec(block)) !== null) {
        result.tensions.push({ text: m[1].trim().replace(/\*\*/g, ""), context: "" });
      }
    }
  }

  // Extract Latent Opportunities
  const oppsMatch = content.match(/## Latent Opportunities\s*\n([\s\S]*?)(?=\n---|\n## )/);
  if (oppsMatch) {
    const block = oppsMatch[1];
    const bulletRegex = /[-*]\s+\*\*([^*]+)\*\*[:\s]*(.*)/g;
    let m;
    while ((m = bulletRegex.exec(block)) !== null) {
      result.opportunities.push({ text: m[1].trim(), context: m[2].trim() });
    }
    if (result.opportunities.length === 0) {
      const simpleBullet = /[-*]\s+(.+)/g;
      while ((m = simpleBullet.exec(block)) !== null) {
        result.opportunities.push({ text: m[1].trim().replace(/\*\*/g, ""), context: "" });
      }
    }
  }

  // Extract Questions to Explore
  const questionsMatch = content.match(/## Questions to Explore\s*\n([\s\S]*?)(?=\n---|\n## |$)/);
  if (questionsMatch) {
    const block = questionsMatch[1];
    // to-do items
    const todoRegex = /\[[ x]?\]\s*(.+)/g;
    let m;
    while ((m = todoRegex.exec(block)) !== null) {
      result.questions.push(m[1].trim());
    }
    // fallback: bullets
    if (result.questions.length === 0) {
      const bulletRegex = /[-*]\s+(.+)/g;
      while ((m = bulletRegex.exec(block)) !== null) {
        result.questions.push(m[1].trim());
      }
    }
  }

  // Extract Assumptions
  const assumptionsMatch = content.match(/## Assumptions Being Made\s*\n([\s\S]*?)(?=\n---|\n## |$)/);
  if (assumptionsMatch) {
    const block = assumptionsMatch[1];
    const bulletRegex = /[-*]\s+(.+)/g;
    let m;
    while ((m = bulletRegex.exec(block)) !== null) {
      result.assumptions.push(m[1].trim().replace(/\*\*/g, ""));
    }
  }

  return result;
}

// --- Task fetcher helper ---
function fetchTask(taskUrl: string): TaskItem | null {
  try {
    const pageId = extractPageId(taskUrl);
    const page = callNotion("notion-fetch", { id: pageId });
    const text = page.text || "";

    // Extract properties from the <properties> block
    const propsMatch = text.match(/<properties>\s*(\{[\s\S]*?\})\s*<\/properties>/);
    let props: any = {};
    if (propsMatch) {
      try {
        props = JSON.parse(propsMatch[1]);
      } catch {}
    }

    return {
      id: pageId,
      name: props.Name || "Untitled Task",
      status: props.Status || "To Do",
      type: props["P/I"] || "",
      location: props.Location || "",
      priority: props.Priority || "",
      energy: props.Energy || "",
      due: props["date:Due:start"] || null,
      completed: props["date:Completed:start"] || null,
      url: props.url || taskUrl,
    };
  } catch (err) {
    console.error(`Failed to fetch task ${taskUrl}:`, err);
    return null;
  }
}

// --- Public API ---

export function listVoiceNotes(): VoiceNoteListItem[] {
  return cached("voice-notes-list", () => {
    const response = callNotion("notion-query-database-view", {
      database_id: "592d777bf7438256ad348129ae94a20d",
      view_url: "view://727d777b-f743-834f-ba73-8817f4c83cf4",
      filter: '"Type" = "Voice Note"',
      page_size: 50,
    });

    const results = response.results || [];
    return results
      .filter((r: any) => r.Type === "Voice Note" && r.Name)
      .map((r: any) => {
        const url = r.url || "";
        const id = extractPageId(url);
        let taskCount = 0;
        try {
          const tasks = typeof r.Tasks === "string" ? JSON.parse(r.Tasks) : r.Tasks;
          taskCount = Array.isArray(tasks) ? tasks.length : 0;
        } catch {}

        return {
          id,
          name: r.Name || "Untitled",
          noteDate: r["date:Note Date:start"] || null,
          created: r.Created || "",
          updated: r.Updated || "",
          durationSeconds: r["Duration (Seconds)"] || null,
          taskCount,
          url,
        };
      })
      .sort(
        (a: VoiceNoteListItem, b: VoiceNoteListItem) =>
          new Date(b.created).getTime() - new Date(a.created).getTime()
      );
  });
}

export function getVoiceNoteDetail(pageId: string): VoiceNoteDetail {
  return cached(`voice-note-${pageId}`, () => {
    const page = callNotion("notion-fetch", { id: pageId });
    const text = page.text || "";

    // Extract properties
    const propsMatch = text.match(/<properties>\s*(\{[\s\S]*?\})\s*<\/properties>/);
    let props: any = {};
    if (propsMatch) {
      try {
        props = JSON.parse(propsMatch[1]);
      } catch {}
    }

    // Parse content
    const content = parseVoiceNoteContent(text);

    // Fetch tasks
    let taskUrls: string[] = [];
    try {
      const tasksRaw = props.Tasks;
      if (typeof tasksRaw === "string") {
        taskUrls = JSON.parse(tasksRaw);
      } else if (Array.isArray(tasksRaw)) {
        taskUrls = tasksRaw;
      }
    } catch {}

    const tasks: TaskItem[] = [];
    for (const taskUrl of taskUrls) {
      const task = fetchTask(taskUrl);
      if (task) tasks.push(task);
    }

    return {
      id: pageId,
      name: props.Name || "Untitled Voice Note",
      noteDate: props["date:Note Date:start"] || null,
      created: props.Created || "",
      updated: props.Updated || "",
      durationSeconds: props["Duration (Seconds)"] || null,
      url: props.url || "",
      content,
      tasks,
    };
  });
}

export function getTasksForVoiceNote(voiceNoteId: string): TaskItem[] {
  const detail = getVoiceNoteDetail(voiceNoteId);
  return detail.tasks;
}
