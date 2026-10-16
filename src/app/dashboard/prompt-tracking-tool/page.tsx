"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Play,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { TopUpgradeBanner } from "@/components/dashboard/PaidFeatureUnlockCard";
import { DataForSeoBanner } from "@/components/dashboard/ProjectDomainBanner";
import {
  buttonGhostClass,
  buttonPrimaryClass,
  DashboardAlert,
  DashboardCard,
  EmptyBlock,
  inputClass,
  LoadingBlock,
  MetricGrid,
  MetricTile,
  PageStack,
} from "@/components/dashboard/ui";
import { useDashboardProject } from "@/components/dashboard/useDashboardProject";
import { RESEARCH_LOCATIONS } from "@/lib/dashboard/locations";
import type {
  AiEngineId,
  PromptTrackingSettings,
  TrackedPrompt,
} from "@/lib/ai-visibility/types";

type TrackingPayload = {
  id: string;
  name: string;
  settings: PromptTrackingSettings;
  prompts: TrackedPrompt[];
  history: Array<{
    date: string;
    brandMentionRate: number;
    ownedCitationRate: number;
  }>;
};

type Tab = "prompts" | "competitors" | "citations";

function rateLabel(hits: number, total: number) {
  if (!total) return "—";
  const pct = Math.round((hits / total) * 100);
  return `${pct}% (${hits} of ${total})`;
}

function VisibilityChart({
  history,
  range,
}: {
  history: TrackingPayload["history"];
  range: 7 | 28 | 90;
}) {
  const points = history.slice(-range);
  if (points.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-line text-sm text-ink-muted">
        Run tracking to build a visibility chart.
      </div>
    );
  }

  const w = 640;
  const h = 180;
  const pad = 16;
  const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / (points.length - 1));
  const y = (v: number) => pad + ((100 - v) / 100) * (h - pad * 2);

  const brandPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${y(p.brandMentionRate)}`)
    .join(" ");
  const citePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${y(p.ownedCitationRate)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-48 w-full">
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line
            x1={pad}
            x2={w - pad}
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-line"
            strokeWidth={1}
          />
          <text
            x={4}
            y={y(tick) + 3}
            className="fill-ink-muted"
            fontSize={10}
          >
            {tick}%
          </text>
        </g>
      ))}
      <path d={brandPath} fill="none" stroke="#38bdf8" strokeWidth={2.5} />
      <path d={citePath} fill="none" stroke="#2dd4bf" strokeWidth={2.5} />
    </svg>
  );
}

export default function PromptTrackingPage() {
  const { project, dataForSeoConfigured, loading: projectLoading } =
    useDashboardProject();
  const [tracking, setTracking] = useState<TrackingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("prompts");
  const [range, setRange] = useState<7 | 28 | 90>(7);
  const [search, setSearch] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/prompt-tracking");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTracking(data.tracking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tracking");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!projectLoading) void load();
  }, [projectLoading, load]);

  const grouped = useMemo(() => {
    const map = new Map<string, TrackedPrompt[]>();
    const q = search.trim().toLowerCase();
    for (const p of tracking?.prompts ?? []) {
      if (q && !p.prompt.toLowerCase().includes(q)) continue;
      const list = map.get(p.topic) ?? [];
      list.push(p);
      map.set(p.topic, list);
    }
    return [...map.entries()];
  }, [tracking?.prompts, search]);

  const summary = useMemo(() => {
    const prompts = tracking?.prompts ?? [];
    let mentionHits = 0;
    let citeHits = 0;
    let total = 0;
    for (const p of prompts) {
      for (const e of p.engines) {
        total += 1;
        if (e.brandMentioned) mentionHits += 1;
        if (e.ownedCited) citeHits += 1;
      }
    }
    return { mentionHits, citeHits, total };
  }, [tracking?.prompts]);

  async function addPrompt() {
    const text = newPrompt.trim();
    if (!text) return;
    setError("");
    try {
      const res = await fetch("/api/dashboard/prompt-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          prompts: [{ prompt: text, topic: "General" }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTracking(data.tracking);
      setNewPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add prompt");
    }
  }

  async function removePrompt(id: string) {
    try {
      const res = await fetch("/api/dashboard/prompt-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", promptId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTracking(data.tracking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove prompt");
    }
  }

  async function runNow() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/prompt-tracking/run", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTracking(data.tracking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  async function saveSettings(patch: Partial<PromptTrackingSettings> & {
    scrapedEngines?: AiEngineId[];
    apiEngines?: AiEngineId[];
  }) {
    try {
      const res = await fetch("/api/dashboard/prompt-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "settings", ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTracking(data.tracking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    }
  }

  return (
    <DashboardShell
      title="Prompt Tracking"
      description="Track the prompts your customers use with AI. Inspect where your business is mentioned or cited."
    >
      <PageStack className="max-w-6xl">
        <TopUpgradeBanner />
        <DataForSeoBanner configured={dataForSeoConfigured} />
        {error ? <DashboardAlert variant="error">{error}</DashboardAlert> : null}

        {loading || projectLoading ? (
          <LoadingBlock label="Loading prompt tracking…" />
        ) : null}

        {tracking && !loading ? (
          <>
            <DashboardCard>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-snow">
                      {tracking.name}
                    </h2>
                    <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-muted">
                      {tracking.settings.schedule === "weekly"
                        ? "Weekly tracking"
                        : "Paused"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    Last update{" "}
                    {tracking.settings.lastRunAt
                      ? new Date(tracking.settings.lastRunAt).toLocaleString()
                      : "never"}
                    {tracking.settings.nextRunAt
                      ? ` · Next ${new Date(tracking.settings.nextRunAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={buttonGhostClass}
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Settings2 className="h-4 w-4" /> Tracking settings
                  </button>
                  <button
                    type="button"
                    className={buttonPrimaryClass}
                    disabled={running || !dataForSeoConfigured}
                    onClick={() => void runNow()}
                  >
                    <Play className="h-4 w-4" />
                    {running ? "Running…" : "Run now"}
                  </button>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Visibility over time">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-3 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-400" /> Brand
                    mentions
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-accent" /> Owned
                    citations
                  </span>
                </div>
                <div className="flex gap-1">
                  {([7, 28, 90] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRange(n)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        range === n
                          ? "bg-accent text-[#010409]"
                          : "text-ink-muted hover:text-snow"
                      }`}
                    >
                      {n}d
                    </button>
                  ))}
                </div>
              </div>
              <VisibilityChart history={tracking.history} range={range} />
              <div className="mt-4">
                <MetricGrid>
                  <MetricTile
                    label="Brand mentions"
                    value={rateLabel(summary.mentionHits, summary.total)}
                  />
                  <MetricTile
                    label="Owned citations"
                    value={rateLabel(summary.citeHits, summary.total)}
                  />
                  <MetricTile
                    label="Tracked prompts"
                    value={String(tracking.prompts.length)}
                  />
                </MetricGrid>
              </div>
            </DashboardCard>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["prompts", "Prompts"],
                  ["competitors", "Competitors"],
                  ["citations", "Citations"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    tab === id
                      ? "bg-accent text-[#010409]"
                      : "text-ink-muted hover:text-snow"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "prompts" ? (
              <DashboardCard>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    className={`${inputClass} flex-1`}
                    placeholder="Search prompts"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="flex min-w-0 flex-1 gap-2">
                    <input
                      className={inputClass}
                      placeholder="Add a prompt…"
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void addPrompt();
                      }}
                    />
                    <button
                      type="button"
                      className={buttonPrimaryClass}
                      onClick={() => void addPrompt()}
                    >
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  </div>
                </div>

                {grouped.length === 0 ? (
                  <EmptyBlock
                    icon={Plus}
                    title="No prompts yet"
                    description="Add prompts manually or send them from Prompt Research."
                  />
                ) : (
                  <div className="space-y-3">
                    {grouped.map(([topic, rows]) => {
                      const open = openTopics[topic] ?? true;
                      const mentionHits = rows.reduce(
                        (n, p) =>
                          n + p.engines.filter((e) => e.brandMentioned).length,
                        0,
                      );
                      const citeHits = rows.reduce(
                        (n, p) =>
                          n + p.engines.filter((e) => e.ownedCited).length,
                        0,
                      );
                      const total = rows.reduce(
                        (n, p) => n + Math.max(1, p.engines.length),
                        0,
                      );
                      return (
                        <div
                          key={topic}
                          className="overflow-hidden rounded-xl border border-line"
                        >
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 bg-bg-soft/60 px-4 py-3 text-left"
                            onClick={() =>
                              setOpenTopics((prev) => ({
                                ...prev,
                                [topic]: !open,
                              }))
                            }
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold text-snow">
                              {open ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {topic}
                              <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                                {rows.length} prompts
                              </span>
                            </span>
                            <span className="text-[11px] text-ink-muted">
                              Mentions {rateLabel(mentionHits, total)} ·
                              Citations {rateLabel(citeHits, total)}
                            </span>
                          </button>
                          {open ? (
                            <ul className="divide-y divide-line">
                              {rows.map((row) => {
                                const eng = row.engines[0];
                                return (
                                  <li
                                    key={row.id}
                                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm text-snow">
                                        {row.prompt}
                                      </p>
                                      <p className="mt-1 text-[11px] text-ink-muted">
                                        {row.active ? "Active" : "Paused"} ·{" "}
                                        {row.branded
                                          ? "Branded"
                                          : "Non-branded"}
                                        {eng
                                          ? ` · ${eng.engine}`
                                          : " · Not checked yet"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                                      <span>
                                        Mentions{" "}
                                        {rateLabel(
                                          row.engines.filter(
                                            (e) => e.brandMentioned,
                                          ).length,
                                          Math.max(1, row.engines.length),
                                        )}
                                      </span>
                                      <span>
                                        Citations{" "}
                                        {rateLabel(
                                          row.engines.filter((e) => e.ownedCited)
                                            .length,
                                          Math.max(1, row.engines.length),
                                        )}
                                      </span>
                                      <button
                                        type="button"
                                        className="rounded-md border border-line p-1.5 hover:text-red-300"
                                        onClick={() => void removePrompt(row.id)}
                                        aria-label="Remove prompt"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </DashboardCard>
            ) : null}

            {tab === "competitors" ? (
              <EmptyBlock
                title="Competitors"
                description="Competitor mention comparison will appear here after you add competitor brands in project context and run tracking."
              />
            ) : null}

            {tab === "citations" ? (
              <DashboardCard title="Recent citations">
                <ul className="space-y-2">
                  {(tracking.prompts ?? [])
                    .flatMap((p) =>
                      p.engines.flatMap((e) =>
                        (e.sources ?? []).map((s) => ({
                          ...s,
                          prompt: p.prompt,
                          engine: e.engine,
                        })),
                      ),
                    )
                    .slice(0, 40)
                    .map((row, idx) => (
                      <li
                        key={`${row.url}-${idx}`}
                        className="rounded-lg border border-line bg-bg px-3 py-2 text-xs"
                      >
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-accent hover:underline"
                        >
                          {row.title || row.url}
                        </a>
                        <p className="mt-1 text-ink-muted">
                          {row.engine} · {row.prompt}
                        </p>
                      </li>
                    ))}
                </ul>
                {(tracking.prompts ?? []).every((p) =>
                  p.engines.every((e) => !(e.sources ?? []).length),
                ) ? (
                  <p className="text-sm text-ink-muted">
                    No citations yet — run tracking after adding prompts.
                  </p>
                ) : null}
              </DashboardCard>
            ) : null}
          </>
        ) : null}

        {settingsOpen && tracking ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
            <div className="w-full max-w-lg rounded-2xl border border-line bg-bg-elevated p-5 shadow-xl">
              <h3 className="font-display text-lg font-semibold text-snow">
                Tracking settings
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                Brand details come from your project ({project?.name} ·{" "}
                {project?.domain}).
              </p>

              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-xl border border-line bg-bg px-3 py-3">
                  <p className="font-medium text-snow">Schedule</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {tracking.settings.schedule === "weekly"
                      ? `Weekly · Next ${
                          tracking.settings.nextRunAt
                            ? new Date(
                                tracking.settings.nextRunAt,
                              ).toLocaleString()
                            : "—"
                        }`
                      : "Paused"}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className={buttonGhostClass}
                      onClick={() =>
                        void saveSettings({
                          schedule:
                            tracking.settings.schedule === "weekly"
                              ? "paused"
                              : "weekly",
                        })
                      }
                    >
                      {tracking.settings.schedule === "weekly"
                        ? "Pause"
                        : "Resume weekly"}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 font-medium text-snow">Scraped responses</p>
                  <label className="flex items-center gap-2 text-ink">
                    <input
                      type="checkbox"
                      checked={tracking.settings.scrapedEngines.includes(
                        "chatgpt",
                      )}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...new Set([...tracking.settings.scrapedEngines, "chatgpt" as const])]
                          : tracking.settings.scrapedEngines.filter(
                              (x) => x !== "chatgpt",
                            );
                        void saveSettings({ scrapedEngines: next });
                      }}
                    />
                    ChatGPT
                  </label>
                </div>

                <div>
                  <p className="mb-2 font-medium text-snow">API responses</p>
                  {(
                    [
                      ["claude", "Claude"],
                      ["perplexity", "Perplexity"],
                      ["gemini", "Gemini"],
                    ] as const
                  ).map(([id, label]) => (
                    <label
                      key={id}
                      className="mb-1 flex items-center gap-2 text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={tracking.settings.apiEngines.includes(id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...new Set([...tracking.settings.apiEngines, id])]
                            : tracking.settings.apiEngines.filter(
                                (x) => x !== id,
                              );
                          void saveSettings({ apiEngines: next });
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <label className="block">
                  <span className="text-xs text-ink-muted">Country</span>
                  <select
                    className={`${inputClass} mt-1`}
                    value={tracking.settings.locationCode}
                    onChange={(e) =>
                      void saveSettings({
                        locationCode: Number(e.target.value),
                      })
                    }
                  >
                    {RESEARCH_LOCATIONS.map((loc) => (
                      <option key={loc.code} value={loc.code}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  className={buttonPrimaryClass}
                  onClick={() => setSettingsOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </PageStack>
    </DashboardShell>
  );
}
