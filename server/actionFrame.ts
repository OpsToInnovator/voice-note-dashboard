import OpenAI from "openai";
import {
  actionCardToBlocks,
  buildActionFramePrompt,
  fixtureActionCards,
  normalizeCard,
  type ActionCard,
  type ClarifyResult,
} from "../shared/actionFrame";
import {
  createTaskInNotion,
  getAWSTDates,
  getProjectLookup,
  getVoiceNoteContent,
  invalidateCache,
} from "./notion";
import { getDailyResurface } from "./resurface";

let client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!client) client = new OpenAI();
  return client;
}

function notionChildrenForCard(card: ActionCard): any[] {
  const blocks: any[] = [
    {
      object: "block",
      type: "callout",
      callout: {
        icon: { type: "emoji", emoji: "➡️" },
        rich_text: [
          {
            type: "text",
            text: { content: "Thought → Decision → Next action → Evidence → Learning" },
          },
        ],
      },
    },
  ];

  for (const section of actionCardToBlocks(card)) {
    blocks.push({
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [{ type: "text", text: { content: section.heading.slice(0, 100) } }],
      },
    });
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: section.body.slice(0, 1900) } }],
      },
    });
  }

  return blocks;
}

export async function extractActionCards(content: string, projectNames: string[]): Promise<ActionCard[]> {
  const { todayStr } = getAWSTDates();
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1600,
    messages: [{ role: "user", content: buildActionFramePrompt(content, projectNames, todayStr) }],
    response_format: { type: "json_object" },
  });

  const rawText = response.choices?.[0]?.message?.content || "";
  let parsed: { cards?: Partial<ActionCard>[] };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { cards: [] };
  }

  return (parsed.cards || []).slice(0, 3).map((card) => normalizeCard(card, todayStr));
}

export async function writeActionCardAsTask(
  card: ActionCard,
  noteId: string,
  projectLookup: Map<string, { id: string; url: string }>,
): Promise<boolean> {
  if (card.decision !== "act" || !card.nextStep) return false;

  const matched = card.project ? projectLookup.get(card.project) || null : null;

  await createTaskInNotion(
    card.nextStep,
    card.type,
    card.priority,
    noteId,
    matched?.id || null,
    matched?.url || null,
    {
      due: card.due,
      children: notionChildrenForCard(card),
    },
  );
  return true;
}

export async function clarifyInbox(): Promise<ClarifyResult> {
  const { todayStr } = getAWSTDates();

  if (process.env.RESURFACE_FIXTURE) {
    const cards = fixtureActionCards(todayStr).map((card, i) => ({
      ...card,
      sourceId: `inbox-${i + 1}`,
      sourceName: i === 0 ? "Captured thought 1" : "Unassigned capture",
    }));
    return {
      notesClarified: cards.length,
      tasksCreated: cards.filter((c) => c.decision === "act").length,
      deferred: cards.filter((c) => c.decision === "not_now").length,
      cards,
    };
  }

  const resurface = await getDailyResurface();
  const inboxNotes = resurface.inbox.items.filter((item) => item.source === "note").slice(0, 8);
  const projectLookup = await getProjectLookup();
  const projectNames = Array.from(projectLookup.keys());

  const cards: ClarifyResult["cards"] = [];
  let tasksCreated = 0;
  let deferred = 0;

  for (const item of inboxNotes) {
    try {
      const content = await getVoiceNoteContent(item.id);
      const source = content.trim().length > 20 ? content : item.name;
      const extracted = await extractActionCards(source, projectNames);

      for (const card of extracted) {
        cards.push({ ...card, sourceId: item.id, sourceName: item.name });
        if (card.decision === "not_now") {
          deferred++;
          continue;
        }
        const wrote = await writeActionCardAsTask(card, item.id, projectLookup);
        if (wrote) tasksCreated++;
      }
    } catch (err) {
      console.error(`Failed to clarify inbox item ${item.id}:`, err);
    }
  }

  invalidateCache("daily-resurface");

  return {
    notesClarified: inboxNotes.length,
    tasksCreated,
    deferred,
    cards,
  };
}
