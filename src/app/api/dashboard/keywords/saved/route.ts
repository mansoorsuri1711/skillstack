import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireUser } from "@/lib/auth-session";
import { connectDB } from "@/lib/db";
import { getProjectForUser } from "@/lib/dashboard/project";
import { SavedKeyword } from "@/models/SavedKeyword";

function asObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

function toSavedDto(k: {
  _id: mongoose.Types.ObjectId;
  keyword: string;
  searchVolume?: number | null;
  cpc?: number | null;
  difficulty?: number | null;
  tags?: string[];
}) {
  return {
    id: k._id.toString(),
    keyword: k.keyword,
    searchVolume: k.searchVolume ?? null,
    cpc: k.cpc ?? null,
    difficulty: k.difficulty ?? null,
    tags: k.tags ?? [],
  };
}

export async function GET(request: Request) {
  const result = await requireUser(request);
  if ("response" in result) return result.response;
  const { user } = result;

  try {
    const project = await getProjectForUser(user.id);
    await connectDB();
    const keywords = await SavedKeyword.find({
      projectId: asObjectId(project.id),
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      keywords: keywords.map(toSavedDto),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.startsWith("No project yet")
        ? "Create a project first to save keywords to your library."
        : error instanceof Error
          ? error.message
          : "Load failed";
    const status = message.includes("Create a project") ? 400 : 500;
    return NextResponse.json({ message, keywords: [] }, { status });
  }
}

export async function POST(request: Request) {
  const result = await requireUser(request);
  if ("response" in result) return result.response;
  const { user } = result;

  try {
    const project = await getProjectForUser(user.id);
    const body = await request.json();
    const keywords = Array.isArray(body.keywords) ? body.keywords : [body];

    await connectDB();
    const projectId = asObjectId(project.id);
    const userId = asObjectId(user.id);
    const saved = [];

    for (const item of keywords) {
      const keyword = String(item.keyword ?? "").trim().toLowerCase();
      if (!keyword) continue;

      const searchVolume =
        item.searchVolume != null && item.searchVolume !== ""
          ? Number(item.searchVolume)
          : null;
      const cpc =
        item.cpc != null && item.cpc !== "" ? Number(item.cpc) : null;
      const difficulty =
        item.difficulty != null && item.difficulty !== ""
          ? Number(item.difficulty)
          : null;

      const doc = await SavedKeyword.findOneAndUpdate(
        { projectId, keyword },
        {
          $set: {
            userId,
            projectId,
            keyword,
            searchVolume: Number.isFinite(searchVolume) ? searchVolume : null,
            cpc: Number.isFinite(cpc) ? cpc : null,
            difficulty: Number.isFinite(difficulty) ? difficulty : null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      saved.push(toSavedDto(doc));
    }

    if (saved.length === 0) {
      return NextResponse.json(
        { message: "No valid keywords to save." },
        { status: 400 },
      );
    }

    return NextResponse.json({ saved, count: saved.length });
  } catch (error) {
    const message =
      error instanceof Error && error.message.startsWith("No project yet")
        ? "Create a project first to save keywords to your library."
        : error instanceof Error
          ? error.message
          : "Save failed";
    const status = message.includes("Create a project") ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(request: Request) {
  const result = await requireUser(request);
  if ("response" in result) return result.response;
  const { user } = result;

  try {
    const project = await getProjectForUser(user.id);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const keywordRaw = searchParams.get("keyword");
    const keyword = keywordRaw ? keywordRaw.trim().toLowerCase() : "";

    if (!id && !keyword) {
      return NextResponse.json(
        { message: "Missing id or keyword" },
        { status: 400 },
      );
    }

    await connectDB();
    const filter = id
      ? {
          _id: id,
          projectId: asObjectId(project.id),
          userId: asObjectId(user.id),
        }
      : {
          keyword,
          projectId: asObjectId(project.id),
          userId: asObjectId(user.id),
        };

    await SavedKeyword.deleteOne(filter);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
