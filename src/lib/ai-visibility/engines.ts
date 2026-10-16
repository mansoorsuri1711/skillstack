import {
  AiOptimizationChatGptLlmScraperLiveAdvancedRequestInfo,
  AiOptimizationClaudeLlmResponsesLiveRequestInfo,
  AiOptimizationGeminiLlmResponsesLiveRequestInfo,
  AiOptimizationPerplexityLlmResponsesLiveRequestInfo,
} from "dataforseo-client";
import {
  brandHintsFromProject,
  citationsOwnDomain,
  textMentionsBrand,
} from "@/lib/ai-visibility/mention";
import type {
  AiEngineId,
  PromptCitation,
  PromptEngineResult,
} from "@/lib/ai-visibility/types";
import { aiOptimizationApi, taskItems, taskResult } from "@/lib/dataforseo/client";

const ENGINE_LABELS: Record<AiEngineId, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  google_ai_overviews: "Google AI Overviews",
};

function extractResponseTextAndSources(response: unknown): {
  answer: string;
  sources: PromptCitation[];
} {
  const result = taskResult<{
    items?: Array<{
      type?: string | null;
      sections?: Array<{
        text?: string | null;
        annotations?: Array<{
          title?: string | null;
          url?: string | null;
        }> | null;
      }> | null;
    }> | null;
  }>(response);

  const parts: string[] = [];
  const sources: PromptCitation[] = [];
  const seen = new Set<string>();

  for (const item of result?.items ?? []) {
    for (const section of item.sections ?? []) {
      if (section.text) parts.push(section.text);
      for (const ann of section.annotations ?? []) {
        const url = ann.url?.trim();
        if (!url || seen.has(url)) continue;
        seen.add(url);
        sources.push({ title: ann.title?.trim() || url, url });
      }
    }
  }

  return {
    answer: parts.join("\n\n").trim() || "No response returned.",
    sources: sources.slice(0, 12),
  };
}

function scoreMentions(
  answer: string,
  sources: PromptCitation[],
  project?: { name: string; domain: string } | null,
) {
  const hints = project ? brandHintsFromProject(project) : [];
  return {
    brandMentioned: hints.length
      ? textMentionsBrand(answer, hints) ||
        sources.some((s) => textMentionsBrand(`${s.title} ${s.url}`, hints))
      : false,
    ownedCited: citationsOwnDomain(sources, project?.domain),
  };
}

export async function scrapeChatGptPrompt(
  prompt: string,
  locationCode: number,
  languageCode: string,
  project?: { name: string; domain: string } | null,
): Promise<PromptEngineResult> {
  const api = aiOptimizationApi();
  const response = await api.chatGptLlmScraperLiveAdvanced([
    {
      keyword: prompt.slice(0, 2000),
      language_code: languageCode,
      location_code: locationCode,
      force_web_search: true,
    } as unknown as AiOptimizationChatGptLlmScraperLiveAdvancedRequestInfo,
  ]);

  const item = taskItems<{
    markdown?: string | null;
    sources?: Array<{ url?: string | null; title?: string | null }> | null;
  }>(response)[0];

  const answer = item?.markdown?.trim() || "No response returned.";
  const sources = (item?.sources ?? [])
    .filter((s) => s.url)
    .slice(0, 12)
    .map((s) => ({ title: s.title?.trim() || s.url!, url: s.url! }));

  return {
    engine: "chatgpt",
    label: ENGINE_LABELS.chatgpt,
    answer,
    sources,
    ...scoreMentions(answer, sources, project),
  };
}

async function runClaude(
  prompt: string,
  project?: { name: string; domain: string } | null,
): Promise<PromptEngineResult> {
  const api = aiOptimizationApi();
  const response = await api.claudeLlmResponsesLive([
    {
      user_prompt: prompt.slice(0, 500),
      model_name: "claude-sonnet-4-0",
      max_output_tokens: 1024,
      web_search: true,
      force_web_search: true,
    } as unknown as AiOptimizationClaudeLlmResponsesLiveRequestInfo,
  ]);
  const { answer, sources } = extractResponseTextAndSources(response);
  return {
    engine: "claude",
    label: ENGINE_LABELS.claude,
    answer,
    sources,
    ...scoreMentions(answer, sources, project),
  };
}

async function runGemini(
  prompt: string,
  project?: { name: string; domain: string } | null,
): Promise<PromptEngineResult> {
  const api = aiOptimizationApi();
  const response = await api.geminiLlmResponsesLive([
    {
      user_prompt: prompt.slice(0, 500),
      model_name: "gemini-2.5-flash",
      max_output_tokens: 1024,
      web_search: true,
      force_web_search: true,
    } as unknown as AiOptimizationGeminiLlmResponsesLiveRequestInfo,
  ]);
  const { answer, sources } = extractResponseTextAndSources(response);
  return {
    engine: "gemini",
    label: ENGINE_LABELS.gemini,
    answer,
    sources,
    ...scoreMentions(answer, sources, project),
  };
}

async function runPerplexity(
  prompt: string,
  project?: { name: string; domain: string } | null,
): Promise<PromptEngineResult> {
  const api = aiOptimizationApi();
  const response = await api.perplexityLlmResponsesLive([
    {
      user_prompt: prompt.slice(0, 500),
      model_name: "sonar",
      max_output_tokens: 1024,
      web_search: true,
    } as unknown as AiOptimizationPerplexityLlmResponsesLiveRequestInfo,
  ]);
  const { answer, sources } = extractResponseTextAndSources(response);
  return {
    engine: "perplexity",
    label: ENGINE_LABELS.perplexity,
    answer,
    sources,
    ...scoreMentions(answer, sources, project),
  };
}

export async function runPromptAcrossEngines(
  prompt: string,
  engines: AiEngineId[],
  locationCode: number,
  languageCode: string,
  project?: { name: string; domain: string } | null,
): Promise<PromptEngineResult[]> {
  const unique = [...new Set(engines)].filter(
    (e) => e !== "google_ai_overviews",
  );

  const jobs = unique.map(async (engine) => {
    try {
      if (engine === "chatgpt") {
        return await scrapeChatGptPrompt(
          prompt,
          locationCode,
          languageCode,
          project,
        );
      }
      if (engine === "claude") return await runClaude(prompt, project);
      if (engine === "gemini") return await runGemini(prompt, project);
      if (engine === "perplexity") return await runPerplexity(prompt, project);
      return {
        engine,
        label: ENGINE_LABELS[engine],
        answer: "",
        sources: [],
        brandMentioned: false,
        ownedCited: false,
        error: "Engine not supported yet.",
      } satisfies PromptEngineResult;
    } catch (error) {
      return {
        engine,
        label: ENGINE_LABELS[engine],
        answer: "",
        sources: [],
        brandMentioned: false,
        ownedCited: false,
        error: error instanceof Error ? error.message : "Request failed",
      } satisfies PromptEngineResult;
    }
  });

  return Promise.all(jobs);
}

export { ENGINE_LABELS };
