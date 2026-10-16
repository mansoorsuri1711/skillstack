import { NextResponse } from "next/server";
import {
  getOrCreatePromptTracking,
  runPromptTrackingCheck,
  serializeTrackingDoc,
} from "@/lib/ai-visibility/tracking";
import { requireUser } from "@/lib/auth-session";
import { isDataForSeoConfigured } from "@/lib/dataforseo/client";
import { getLocationLabel } from "@/lib/dashboard/locations";
import { getProjectForUser } from "@/lib/dashboard/project";

export async function POST(request: Request) {
  if (!isDataForSeoConfigured()) {
    return NextResponse.json(
      { message: "Add DATAFORSEO_API_KEY to .env.local to run prompt tracking." },
      { status: 503 },
    );
  }

  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  try {
    const project = await getProjectForUser(auth.user.id);
    const doc = await getOrCreatePromptTracking(auth.user.id, project.id, {
      locationCode: project.locationCode,
      languageCode: project.languageCode,
    });

    if (!(doc.prompts ?? []).some((p) => p.active !== false)) {
      return NextResponse.json(
        { message: "Add at least one prompt before running tracking." },
        { status: 400 },
      );
    }

    const updated = await runPromptTrackingCheck(doc, {
      name: project.name,
      domain: project.domain,
    });

    return NextResponse.json({
      tracking: serializeTrackingDoc(
        updated,
        getLocationLabel(updated.locationCode ?? project.locationCode),
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tracking run failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
