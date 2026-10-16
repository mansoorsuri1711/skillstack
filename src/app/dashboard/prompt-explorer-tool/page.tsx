"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { AiToolLimitNotice } from "@/components/dashboard/AiToolLimitNotice";
import { PromptExplorerUnlock } from "@/components/dashboard/ai-visibility/AiVisibilityUnlock";
import { TopUpgradeBanner } from "@/components/dashboard/PaidFeatureUnlockCard";
import { DataForSeoBanner } from "@/components/dashboard/ProjectDomainBanner";
import { SearchToolbar } from "@/components/dashboard/SearchToolbar";
import {
  DashboardAlert,
  DashboardCard,
  LoadingBlock,
  PageStack,
  ResultsPanel,
} from "@/components/dashboard/ui";
import { useDashboardProject } from "@/components/dashboard/useDashboardProject";
import type { AiToolUsage } from "@/lib/dashboard/ai-tool-limits";
import type { PromptEngineResult } from "@/lib/ai-visibility/types";

export default function PromptExplorerPage() {
  const { project, dataForSeoConfigured, loading: projectLoading } =
    useDashboardProject();
  const [prompt, setPrompt] = useState("");
  const [usage, setUsage] = useState<AiToolUsage | null>(null);
  const [results, setResults] = useState<PromptEngineResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/prompt-explorer");
      const data = await res.json();
      if (res.ok) setUsage(data.usage ?? null);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    if (!projectLoading) void loadUsage();
  }, [projectLoading, loadUsage]);

  async function onSubmit() {
    if (!prompt.trim() || usage?.remaining === 0) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch("/api/dashboard/prompt-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.usage) setUsage(data.usage);
        throw new Error(data.message);
      }
      if (data.usage) setUsage(data.usage);
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Explorer failed");
    } finally {
      setLoading(false);
    }
  }

  const limitReached = Boolean(usage && !usage.unlimited && usage.remaining === 0);
  const ready = dataForSeoConfigured && !limitReached;

  const form = ready ? (
    <div className="space-y-3">
      <AiToolLimitNotice usage={usage} featureLabel="Prompt Explorer" />
      {error ? <DashboardAlert variant="error">{error}</DashboardAlert> : null}
      <SearchToolbar
        value={prompt}
        onChange={setPrompt}
        onSubmit={() => void onSubmit()}
        placeholder="Ask anything your customers might ask AI…"
        inputLabel="Prompt"
        loading={loading}
        submitLabel={loading ? "Running…" : "Run across models"}
      />
      {project ? (
        <p className="text-xs text-ink-muted">
          Brand highlight: <span className="text-snow">{project.name}</span> ·{" "}
          {project.domain}
        </p>
      ) : null}
    </div>
  ) : limitReached ? (
    <AiToolLimitNotice usage={usage} featureLabel="Prompt Explorer" />
  ) : null;

  return (
    <DashboardShell
      title="Prompt Explorer"
      description="Run one prompt across ChatGPT, Claude, Gemini, and Perplexity — compare answers and citations."
    >
      <PageStack className="max-w-6xl">
        <TopUpgradeBanner />
        <DataForSeoBanner configured={dataForSeoConfigured} />
        <PromptExplorerUnlock footer={form} />

        {loading ? (
          <LoadingBlock label="Querying AI engines — this can take a minute…" />
        ) : null}

        {results.length > 0 ? (
          <ResultsPanel title="Model comparison">
            <div className="grid gap-4 lg:grid-cols-2">
              {results.map((row) => (
                <DashboardCard key={row.engine} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-snow">
                      {row.label}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
                      <span
                        className={`rounded-full border px-2 py-0.5 ${
                          row.brandMentioned
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-line text-ink-muted"
                        }`}
                      >
                        {row.brandMentioned ? "Mentioned" : "Not mentioned"}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 ${
                          row.ownedCited
                            ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                            : "border-line text-ink-muted"
                        }`}
                      >
                        {row.ownedCited ? "Cited you" : "No owned cite"}
                      </span>
                    </div>
                  </div>
                  {row.error ? (
                    <DashboardAlert variant="error">{row.error}</DashboardAlert>
                  ) : (
                    <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-bg px-3 py-2.5 text-xs leading-relaxed text-ink">
                      {row.answer}
                    </div>
                  )}
                  {row.sources.length > 0 ? (
                    <ul className="space-y-1">
                      {row.sources.slice(0, 6).map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                          >
                            {s.title || s.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </DashboardCard>
              ))}
            </div>
          </ResultsPanel>
        ) : null}
      </PageStack>
    </DashboardShell>
  );
}
