import { NextResponse } from "next/server";
import { runPromptAcrossEngines } from "@/lib/ai-visibility/engines";
import type { AiEngineId } from "@/lib/ai-visibility/types";
import { requireUser } from "@/lib/auth-session";
import { isDataForSeoConfigured } from "@/lib/dataforseo/client";
import {
  aiToolLimitJson,
  AiToolLimitError,
  assertAiToolAvailable,
  getAiToolUsage,
  incrementAiToolUsage,
} from "@/lib/dashboard/ai-tool-limits";
import { getProjectForUser } from "@/lib/dashboard/project";

const DEFAULT_ENGINES: AiEngineId[] = [
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
];

export async function GET(request: Request) {
  const result = await requireUser(request);
  if ("response" in result) return result.response;
  try {
    const usage = await getAiToolUsage(result.user.id, "promptExplorer");
    return NextResponse.json({ usage });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load usage";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isDataForSeoConfigured()) {
    return NextResponse.json(
      { message: "Add DATAFORSEO_API_KEY to .env.local for Prompt Explorer." },
      { status: 503 },
    );
  }

  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const { user } = auth;

  try {
    await assertAiToolAvailable(user.id, "promptExplorer");
    const project = await getProjectForUser(user.id);
    const body = (await request.json().catch(() => ({}))) as {
      prompt?: string;
      engines?: AiEngineId[];
    };
    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) {
      return NextResponse.json(
        { message: "Enter a prompt to explore." },
        { status: 400 },
      );
    }

    const engines =
      Array.isArray(body.engines) && body.engines.length
        ? body.engines
        : DEFAULT_ENGINES;

    const results = await runPromptAcrossEngines(
      prompt,
      engines,
      project.locationCode,
      project.languageCode,
      { name: project.name, domain: project.domain },
    );

    const usage = await incrementAiToolUsage(user.id, "promptExplorer");
    return NextResponse.json({
      prompt,
      brand: project.name,
      domain: project.domain,
      results,
      usage,
    });
  } catch (error) {
    if (error instanceof AiToolLimitError) {
      return NextResponse.json(aiToolLimitJson(error), { status: 402 });
    }
    const message =
      error instanceof Error ? error.message : "Prompt explorer failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
