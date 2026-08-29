import OpenAI from "openai";
import {
  buildFrameworkPrompt,
  fixturePlan,
  normalizePlan,
  resolveFrameworkId,
  type ApplyFrameworkResult,
  type FrameworkId,
} from "../shared/frameworks";
import { getAWSTDates } from "./notion";

let client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!client) client = new OpenAI();
  return client;
}

export async function applyFramework(
  content: string,
  requested?: FrameworkId | "auto" | null,
): Promise<ApplyFrameworkResult> {
  const source = content.trim();
  if (!source) {
    throw new Error("Paste a goal, thought, or voice note before applying a framework.");
  }

  const recommendation = resolveFrameworkId(source, requested);
  const { todayStr } = getAWSTDates();

  if (process.env.RESURFACE_FIXTURE) {
    return {
      recommendation,
      plan: fixturePlan(recommendation.id, todayStr),
      usedFixture: true,
    };
  }

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1800,
    messages: [{ role: "user", content: buildFrameworkPrompt(recommendation.id, source, todayStr) }],
    response_format: { type: "json_object" },
  });

  const rawText = response.choices?.[0]?.message?.content || "";
  let parsed: Parameters<typeof normalizePlan>[1] = {};
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = {};
  }

  return {
    recommendation,
    plan: normalizePlan(recommendation.id, parsed, todayStr),
    usedFixture: false,
  };
}
