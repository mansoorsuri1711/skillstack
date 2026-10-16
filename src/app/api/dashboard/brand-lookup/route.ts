import { NextResponse } from "next/server";

/** Legacy Brand Lookup endpoint — use Prompt Research / Explorer instead. */
export async function GET() {
  return NextResponse.json(
    {
      message:
        "Brand Lookup has moved to AI Visibility. Use /api/dashboard/prompt-research.",
      redirect: "/dashboard/prompt-research-tool",
    },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Brand Lookup has moved to AI Visibility. Use /api/dashboard/prompt-research or /api/dashboard/prompt-explorer.",
      redirect: "/dashboard/prompt-research-tool",
    },
    { status: 410 },
  );
}
