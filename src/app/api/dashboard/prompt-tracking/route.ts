import { NextResponse } from "next/server";
import {
  getOrCreatePromptTracking,
  serializeTrackingDoc,
} from "@/lib/ai-visibility/tracking";
import type { AiEngineId } from "@/lib/ai-visibility/types";
import { requireUser } from "@/lib/auth-session";
import { getLocationLabel } from "@/lib/dashboard/locations";
import { getProjectForUser } from "@/lib/dashboard/project";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  try {
    const project = await getProjectForUser(auth.user.id);
    const doc = await getOrCreatePromptTracking(auth.user.id, project.id, {
      locationCode: project.locationCode,
      languageCode: project.languageCode,
    });
    return NextResponse.json({
      tracking: serializeTrackingDoc(
        doc,
        getLocationLabel(doc.locationCode ?? project.locationCode),
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load tracking";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  try {
    const project = await getProjectForUser(auth.user.id);
    const doc = await getOrCreatePromptTracking(auth.user.id, project.id, {
      locationCode: project.locationCode,
      languageCode: project.languageCode,
    });

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      prompts?: Array<{ prompt: string; topic?: string; branded?: boolean }>;
      promptId?: string;
      schedule?: "weekly" | "paused";
      scrapedEngines?: AiEngineId[];
      apiEngines?: AiEngineId[];
      locationCode?: number;
      languageCode?: string;
    };

    if (body.action === "add" && Array.isArray(body.prompts)) {
      for (const row of body.prompts) {
        const text = String(row.prompt ?? "").trim();
        if (!text) continue;
        doc.prompts.push({
          prompt: text,
          topic: String(row.topic ?? "General").trim() || "General",
          branded: Boolean(row.branded),
          active: true,
          engines: [],
        } as never);
      }
      doc.markModified("prompts");
      await doc.save();
    } else if (body.action === "remove" && body.promptId) {
      doc.prompts = (doc.prompts ?? []).filter(
        (p) => String(p._id) !== body.promptId,
      ) as typeof doc.prompts;
      doc.markModified("prompts");
      await doc.save();
    } else if (body.action === "settings") {
      if (body.schedule === "weekly" || body.schedule === "paused") {
        doc.schedule = body.schedule;
        if (body.schedule === "weekly" && !doc.nextRunAt) {
          const next = new Date();
          next.setDate(next.getDate() + 7);
          doc.nextRunAt = next;
        }
      }
      if (Array.isArray(body.scrapedEngines)) {
        doc.scrapedEngines = body.scrapedEngines;
      }
      if (Array.isArray(body.apiEngines)) {
        doc.apiEngines = body.apiEngines;
      }
      if (typeof body.locationCode === "number") {
        doc.locationCode = body.locationCode;
      }
      if (typeof body.languageCode === "string" && body.languageCode) {
        doc.languageCode = body.languageCode;
      }
      await doc.save();
    } else {
      return NextResponse.json({ message: "Unknown action." }, { status: 400 });
    }

    return NextResponse.json({
      tracking: serializeTrackingDoc(
        doc,
        getLocationLabel(doc.locationCode ?? project.locationCode),
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update tracking";
    return NextResponse.json({ message }, { status: 500 });
  }
}
