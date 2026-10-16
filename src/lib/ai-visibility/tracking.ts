import { runPromptAcrossEngines } from "@/lib/ai-visibility/engines";
import type {
  AiEngineId,
  PromptTrackingSettings,
  TrackedPrompt,
} from "@/lib/ai-visibility/types";
import { connectDB } from "@/lib/db";
import { PromptTracking } from "@/models/PromptTracking";

function nextWeekly(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + 7);
  return d;
}

export function serializeTrackingDoc(
  doc: InstanceType<typeof PromptTracking>,
  countryLabel: string,
): {
  id: string;
  name: string;
  settings: PromptTrackingSettings;
  prompts: TrackedPrompt[];
  history: Array<{
    date: string;
    brandMentionRate: number;
    ownedCitationRate: number;
  }>;
} {
  return {
    id: doc._id.toString(),
    name: doc.name || "Default",
    settings: {
      schedule: doc.schedule === "paused" ? "paused" : "weekly",
      nextRunAt: doc.nextRunAt ? new Date(doc.nextRunAt).toISOString() : null,
      lastRunAt: doc.lastRunAt ? new Date(doc.lastRunAt).toISOString() : null,
      scrapedEngines: (doc.scrapedEngines ?? ["chatgpt"]) as AiEngineId[],
      apiEngines: (doc.apiEngines ?? []) as AiEngineId[],
      locationCode: doc.locationCode ?? 2840,
      languageCode: doc.languageCode ?? "en",
      countryLabel,
    },
    prompts: (doc.prompts ?? []).map((p) => ({
      id: String(p._id),
      prompt: p.prompt,
      topic: p.topic || "General",
      branded: Boolean(p.branded),
      active: p.active !== false,
      engines: (p.engines ?? []).map((e) => ({
        engine: e.engine as AiEngineId,
        brandMentioned: Boolean(e.brandMentioned),
        ownedCited: Boolean(e.ownedCited),
        answerPreview: e.answerPreview || "",
        sources: (e.sources ?? []).map((s) => ({
          title: s.title || "",
          url: s.url,
        })),
        checkedAt: e.checkedAt
          ? new Date(e.checkedAt).toISOString()
          : new Date().toISOString(),
      })),
    })),
    history: (doc.history ?? []).map((h) => ({
      date: new Date(h.date).toISOString(),
      brandMentionRate: h.brandMentionRate ?? 0,
      ownedCitationRate: h.ownedCitationRate ?? 0,
    })),
  };
}

export async function getOrCreatePromptTracking(
  userId: string,
  projectId: string,
  defaults?: { locationCode?: number; languageCode?: string },
) {
  await connectDB();
  let doc = await PromptTracking.findOne({ userId, projectId });
  if (!doc) {
    doc = await PromptTracking.create({
      userId,
      projectId,
      schedule: "weekly",
      nextRunAt: nextWeekly(),
      scrapedEngines: ["chatgpt"],
      apiEngines: [],
      locationCode: defaults?.locationCode ?? 2840,
      languageCode: defaults?.languageCode ?? "en",
      prompts: [],
      history: [],
    });
  }
  return doc;
}

export async function runPromptTrackingCheck(
  doc: InstanceType<typeof PromptTracking>,
  project: { name: string; domain: string },
) {
  const engines = [
    ...new Set([
      ...(doc.scrapedEngines ?? ["chatgpt"]),
      ...(doc.apiEngines ?? []),
    ]),
  ] as AiEngineId[];

  const active = (doc.prompts ?? []).filter((p) => p.active !== false);
  let mentionHits = 0;
  let citationHits = 0;
  let checks = 0;

  for (const prompt of active) {
    const results = await runPromptAcrossEngines(
      prompt.prompt,
      engines.length ? engines : ["chatgpt"],
      doc.locationCode ?? 2840,
      doc.languageCode ?? "en",
      project,
    );

    prompt.set("engines", results.map((r) => ({
      engine: r.engine,
      brandMentioned: r.brandMentioned,
      ownedCited: r.ownedCited,
      answerPreview: r.answer.slice(0, 280),
      sources: r.sources,
      checkedAt: new Date(),
    })));

    for (const r of results) {
      checks += 1;
      if (r.brandMentioned) mentionHits += 1;
      if (r.ownedCited) citationHits += 1;
    }
  }

  const brandMentionRate = checks ? Math.round((mentionHits / checks) * 100) : 0;
  const ownedCitationRate = checks
    ? Math.round((citationHits / checks) * 100)
    : 0;

  const history = [...(doc.history ?? []).map((h) => ({
    date: h.date,
    brandMentionRate: h.brandMentionRate,
    ownedCitationRate: h.ownedCitationRate,
  })), {
    date: new Date(),
    brandMentionRate,
    ownedCitationRate,
  }].slice(-90);
  doc.set("history", history);

  doc.lastRunAt = new Date();
  if (doc.schedule === "weekly") {
    doc.nextRunAt = nextWeekly();
  }
  doc.markModified("prompts");
  doc.markModified("history");
  await doc.save();
  return doc;
}
