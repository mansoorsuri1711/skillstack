import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { connectDB } from "@/lib/db";
import { getProjectForUser } from "@/lib/dashboard/project";
import {
  serializeTrackedDomain,
  serializeTrackedDomainDetail,
} from "@/lib/dashboard/rank-tracking";
import {
  SEARCH_DEPTH_OPTIONS,
  TRACKING_DEVICES,
  TRACKING_SCHEDULES,
  type SearchTargeting,
  type TrackingDevice,
  type TrackingSchedule,
} from "@/lib/dashboard/rank-tracking-config";
import { resolveLabsLocationCode } from "@/lib/dashboard/locations";
import { TrackedDomain } from "@/models/TrackedDomain";

type RouteContext = { params: Promise<{ id: string }> };

async function getTrackedDomainForUser(id: string, userId: string) {
  const project = await getProjectForUser(userId);
  await connectDB();
  const tracked = await TrackedDomain.findOne({ _id: id, projectId: project.id });
  if (!tracked) {
    return { error: NextResponse.json({ message: "Tracked domain not found." }, { status: 404 }) };
  }
  return { tracked, project };
}

export async function GET(_request: Request, context: RouteContext) {
  const result = await requireUser(_request);
  if ("response" in result) return result.response;
  const { user } = result;
  const { id } = await context.params;

  const lookup = await getTrackedDomainForUser(id, user.id);
  if ("error" in lookup) return lookup.error;

  return NextResponse.json({
    domain: serializeTrackedDomainDetail(lookup.tracked),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const result = await requireUser(_request);
  if ("response" in result) return result.response;
  const { user } = result;
  const { id } = await context.params;

  const lookup = await getTrackedDomainForUser(id, user.id);
  if ("error" in lookup) return lookup.error;

  await lookup.tracked.deleteOne();
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, context: RouteContext) {
  const result = await requireUser(request);
  if ("response" in result) return result.response;
  const { user } = result;
  const { id } = await context.params;

  const lookup = await getTrackedDomainForUser(id, user.id);
  if ("error" in lookup) return lookup.error;

  const body = await request.json();

  // Legacy / keyword removal: { keyword: "..." }
  if (
    typeof body.keyword === "string" &&
    body.locationCode == null &&
    body.languageCode == null &&
    body.device == null &&
    body.schedule == null &&
    body.searchDepth == null &&
    body.searchTargeting == null
  ) {
    const keyword = body.keyword.trim().toLowerCase();
    if (!keyword) {
      return NextResponse.json({ message: "Keyword required." }, { status: 400 });
    }

    lookup.tracked.keywords.pull({ keyword });
    await lookup.tracked.save();

    return NextResponse.json({ domain: serializeTrackedDomain(lookup.tracked) });
  }

  // Update initial tracking options (location, device, schedule, depth, etc.)
  try {
    if (body.locationCode != null) {
      lookup.tracked.locationCode = resolveLabsLocationCode(Number(body.locationCode));
    }
    if (body.languageCode != null) {
      lookup.tracked.languageCode = String(body.languageCode).trim() || "en";
    }
    if (body.searchTargeting != null) {
      const searchTargeting = String(body.searchTargeting) as SearchTargeting;
      if (!["national", "local"].includes(searchTargeting)) {
        return NextResponse.json({ message: "Invalid search targeting." }, { status: 400 });
      }
      lookup.tracked.searchTargeting = searchTargeting;
    }
    if (body.device != null) {
      const device = String(body.device) as TrackingDevice;
      if (!TRACKING_DEVICES.some((d) => d.value === device)) {
        return NextResponse.json({ message: "Invalid device." }, { status: 400 });
      }
      lookup.tracked.device = device;
    }
    if (body.schedule != null) {
      const schedule = String(body.schedule) as TrackingSchedule;
      if (!TRACKING_SCHEDULES.some((s) => s.value === schedule)) {
        return NextResponse.json({ message: "Invalid schedule." }, { status: 400 });
      }
      lookup.tracked.schedule = schedule;
    }
    if (body.searchDepth != null) {
      const searchDepth = Number(body.searchDepth);
      if (!SEARCH_DEPTH_OPTIONS.some((d) => d.depth === searchDepth)) {
        return NextResponse.json({ message: "Invalid search depth." }, { status: 400 });
      }
      lookup.tracked.searchDepth = searchDepth;
    }

    await lookup.tracked.save();
    return NextResponse.json({
      domain: serializeTrackedDomainDetail(lookup.tracked),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update tracking settings";
    return NextResponse.json({ message }, { status: 500 });
  }
}
