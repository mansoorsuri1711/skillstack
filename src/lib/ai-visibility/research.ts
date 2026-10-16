import { SerpGoogleOrganicLiveAdvancedRequestInfo } from "dataforseo-client";
import { scrapeChatGptPrompt } from "@/lib/ai-visibility/engines";
import type { PromptResearchItem } from "@/lib/ai-visibility/types";
import { serpApi, taskResult } from "@/lib/dataforseo/client";

function extractPeopleAlsoAsk(response: unknown): string[] {
  const result = taskResult<{
    items?: Array<{
      type?: string | null;
      items?: Array<{
        type?: string | null;
        title?: string | null;
      }> | null;
    }> | null;
  }>(response);

  const questions: string[] = [];
  const seen = new Set<string>();

  for (const item of result?.items ?? []) {
    if (item.type !== "people_also_ask") continue;
    for (const child of item.items ?? []) {
      const title = child.title?.trim();
      if (!title) continue;
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      questions.push(title);
    }
  }

  return questions;
}

/** Question-shaped related keywords as a cheap fallback when PAA is empty. */
function questionizeSeed(seed: string): string[] {
  const s = seed.trim();
  if (!s) return [];
  return [
    `What is ${s}?`,
    `How does ${s} work?`,
    `Best ${s} options`,
    `${s} vs alternatives`,
    `How to choose ${s}`,
  ];
}

export async function researchMarketPrompts(
  seed: string,
  locationCode: number,
  languageCode: string,
  project: { name: string; domain: string } | null,
  options: { answerLimit?: number } = {},
): Promise<{ keyword: string; prompts: PromptResearchItem[] }> {
  const answerLimit = options.answerLimit ?? 3;
  const api = serpApi();
  const serp = await api.googleOrganicLiveAdvanced([
    {
      keyword: seed,
      location_code: locationCode,
      language_code: languageCode,
      depth: 20,
      device: "desktop",
      people_also_ask_click_depth: 2,
    } as SerpGoogleOrganicLiveAdvancedRequestInfo,
  ]);

  let questions = extractPeopleAlsoAsk(serp);
  if (questions.length === 0) {
    questions = questionizeSeed(seed);
  }

  const prompts: PromptResearchItem[] = questions.slice(0, 12).map((question) => ({
    question,
    answer: null,
    sources: [],
    brandMentioned: false,
    ownedCited: false,
  }));

  const toAnswer = prompts.slice(0, answerLimit);
  await Promise.all(
    toAnswer.map(async (row) => {
      try {
        const result = await scrapeChatGptPrompt(
          row.question,
          locationCode,
          languageCode,
          project,
        );
        row.answer = result.answer;
        row.sources = result.sources;
        row.brandMentioned = result.brandMentioned;
        row.ownedCited = result.ownedCited;
      } catch (error) {
        row.answer =
          error instanceof Error
            ? `Could not load ChatGPT answer: ${error.message}`
            : "Could not load ChatGPT answer.";
      }
    }),
  );

  return { keyword: seed, prompts };
}
