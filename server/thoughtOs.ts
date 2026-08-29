import OpenAI from "openai";
import {
  buildThoughtPrompt,
  fixtureThought,
  normalizeThought,
  thoughtCatalog,
  type ThoughtRecord,
} from "../shared/thoughtOs";
import { getAWSTDates } from "./notion";

let client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!client) client = new OpenAI();
  return client;
}

export { thoughtCatalog };

export async function processThought(
  content: string,
  confirmedMeaningId?: string | null,
): Promise<ThoughtRecord> {
  const source = content.trim();
  if (!source) {
    throw new Error("Capture a thought before the system can decide what happens to it.");
  }

  const { todayStr } = getAWSTDates();

  if (process.env.RESURFACE_FIXTURE) {
    return fixtureThought(source, todayStr, confirmedMeaningId ?? null);
  }

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2000,
    messages: [{ role: "user", content: buildThoughtPrompt(source, confirmedMeaningId ?? null, todayStr) }],
    response_format: { type: "json_object" },
  });

  const rawText = response.choices?.[0]?.message?.content || "";
  let parsed: Partial<ThoughtRecord> = {};
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = {};
  }

  return normalizeThought(
    {
      ...parsed,
      original: source,
      confirmedMeaningId: confirmedMeaningId ?? parsed.confirmedMeaningId ?? null,
      usedFixture: false,
    },
    todayStr,
  );
}
