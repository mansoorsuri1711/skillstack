export type AiEngineId =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "google_ai_overviews";

export type PromptCitation = {
  title: string;
  url: string;
};

export type PromptEngineResult = {
  engine: AiEngineId;
  label: string;
  answer: string;
  sources: PromptCitation[];
  brandMentioned: boolean;
  ownedCited: boolean;
  error?: string;
};

export type PromptResearchItem = {
  question: string;
  answer: string | null;
  sources: PromptCitation[];
  brandMentioned: boolean;
  ownedCited: boolean;
  loadingAnswer?: boolean;
};

export type TrackedPromptEngineSnapshot = {
  engine: AiEngineId;
  brandMentioned: boolean;
  ownedCited: boolean;
  answerPreview?: string;
  sources?: PromptCitation[];
  checkedAt: string;
};

export type TrackedPrompt = {
  id: string;
  prompt: string;
  topic: string;
  branded: boolean;
  active: boolean;
  engines: TrackedPromptEngineSnapshot[];
};

export type PromptTrackingSettings = {
  schedule: "weekly" | "paused";
  nextRunAt: string | null;
  lastRunAt: string | null;
  scrapedEngines: AiEngineId[];
  apiEngines: AiEngineId[];
  locationCode: number;
  languageCode: string;
  countryLabel: string;
};
