import { NextResponse } from "next/server";
import { researchMarketPrompts } from "@/lib/ai-visibility/research";
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

export async function GET(request: Request) {
  const result = await requireUser(request);
  if ("response" in result) return result.response;
  try {
    const usage = await getAiToolUsage(result.user.id, "promptResearch");
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
      { message: "Add DATAFORSEO_API_KEY to .env.local for Prompt Research." },
      { status: 503 },
    );
  }

  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const { user } = auth;

  try {
    await assertAiToolAvailable(user.id, "promptResearch");
    const project = await getProjectForUser(user.id);
    const body = (await request.json().catch(() => ({}))) as {
      keyword?: string;
      answerLimit?: number;
    };
    const keyword = String(body.keyword ?? "").trim();
    if (!keyword) {
      return NextResponse.json(
        { message: "Enter a keyword or market topic." },
        { status: 400 },
      );
    }

    const result = await researchMarketPrompts(
      keyword,
      project.locationCode,
      project.languageCode,
      { name: project.name, domain: project.domain },
      { answerLimit: Math.min(5, Math.max(1, Number(body.answerLimit) || 3)) },
    );

    const usage = await incrementAiToolUsage(user.id, "promptResearch");
    return NextResponse.json({ result, usage });
  } catch (error) {
    if (error instanceof AiToolLimitError) {
      return NextResponse.json(aiToolLimitJson(error), { status: 402 });
    }
    const message =
      error instanceof Error ? error.message : "Prompt research failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
