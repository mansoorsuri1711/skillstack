"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { AiToolLimitNotice } from "@/components/dashboard/AiToolLimitNotice";
import { PromptResearchUnlock } from "@/components/dashboard/ai-visibility/AiVisibilityUnlock";
import { TopUpgradeBanner } from "@/components/dashboard/PaidFeatureUnlockCard";
import { DataForSeoBanner } from "@/components/dashboard/ProjectDomainBanner";
import { SearchToolbar } from "@/components/dashboard/SearchToolbar";
import {
  buttonGhostClass,
  buttonPrimaryClass,
  DashboardAlert,
  DashboardCard,
  LoadingBlock,
  PageStack,
  ResultsPanel,
} from "@/components/dashboard/ui";
import { useDashboardProject } from "@/components/dashboard/useDashboardProject";
import type { AiToolUsage } from "@/lib/dashboard/ai-tool-limits";
import type { PromptResearchItem } from "@/lib/ai-visibility/types";

export default function PromptResearchPage() {
  const { project, dataForSeoConfigured, loading: projectLoading } =
    useDashboardProject();
  const [keyword, setKeyword] = useState("");
  const [usage, setUsage] = useState<AiToolUsage | null>(null);
  const [prompts, setPrompts] = useState<PromptResearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/prompt-research");
      const data = await res.json();
      if (res.ok) setUsage(data.usage ?? null);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    if (!projectLoading) void loadUsage();
  }, [projectLoading, loadUsage]);

  useEffect(() => {
    if (project?.domain && !keyword) setKeyword(project.domain.split(".")[0] ?? "");
  }, [project?.domain, keyword]);

  async function onSubmit() {
    if (!keyword.trim() || usage?.remaining === 0) return;
    setLoading(true);
    setError("");
    setNotice("");
    setPrompts([]);
    try {
      const res = await fetch("/api/dashboard/prompt-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.usage) setUsage(data.usage);
        throw new Error(data.message);
      }
      if (data.usage) setUsage(data.usage);
      setPrompts(data.result?.prompts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed");
    } finally {
      setLoading(false);
    }
  }

  async function addToTracking(questions: string[]) {
    if (!questions.length) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/dashboard/prompt-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          prompts: questions.map((prompt) => ({
            prompt,
            topic: keyword.trim() || "General",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotice(
        `Added ${questions.length} prompt${questions.length === 1 ? "" : "s"} to Prompt Tracking.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add prompts");
    } finally {
      setSaving(false);
    }
  }

  const limitReached = Boolean(usage && !usage.unlimited && usage.remaining === 0);
  const ready = dataForSeoConfigured && !limitReached;

  const form = ready ? (
    <div className="space-y-3">
      <AiToolLimitNotice usage={usage} featureLabel="Prompt Research" />
      {error ? <DashboardAlert variant="error">{error}</DashboardAlert> : null}
      {notice ? <DashboardAlert variant="success">{notice}</DashboardAlert> : null}
      <SearchToolbar
        value={keyword}
        onChange={setKeyword}
        onSubmit={() => void onSubmit()}
        placeholder="Keyword or market topic"
        inputLabel="Keyword"
        loading={loading}
        submitLabel={loading ? "Researching…" : "Research prompts"}
      />
    </div>
  ) : limitReached ? (
    <AiToolLimitNotice usage={usage} featureLabel="Prompt Research" />
  ) : null;

  return (
    <DashboardShell
      title="Prompt Research"
      description="Find questions people ask about your market, see how ChatGPT answers them, and check which sites the answers cite."
    >
      <PageStack className="max-w-5xl">
        <TopUpgradeBanner />
        <DataForSeoBanner configured={dataForSeoConfigured} />
        <PromptResearchUnlock footer={form} />

        {loading ? (
          <LoadingBlock label="Fetching market questions and ChatGPT answers…" />
        ) : null}

        {prompts.length > 0 ? (
          <ResultsPanel
            title={`${prompts.length} prompts for “${keyword}”`}
            description="ChatGPT answers load for the top questions. Add any to Prompt Tracking."
          >
            <div className="mb-4">
              <button
                type="button"
                className={buttonPrimaryClass}
                disabled={saving}
                onClick={() =>
                  void addToTracking(prompts.map((p) => p.question))
                }
              >
                <Plus className="h-4 w-4" /> Add all to tracking
              </button>
            </div>
            <div className="space-y-3">
              {prompts.map((row) => (
                <DashboardCard key={row.question} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-snow">
                        {row.question}
                      </h3>
                      <p className="mt-1 text-[11px] text-ink-muted">
                        {row.brandMentioned ? "Brand mentioned · " : ""}
                        {row.ownedCited
                          ? "Your domain cited"
                          : "Your domain not cited"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={buttonGhostClass}
                      disabled={saving}
                      onClick={() => void addToTracking([row.question])}
                    >
                      <Plus className="h-3.5 w-3.5" /> Track
                    </button>
                  </div>
                  {row.answer ? (
                    <div className="whitespace-pre-wrap rounded-lg border border-line bg-bg px-3 py-2.5 text-xs leading-relaxed text-ink">
                      {row.answer.length > 900
                        ? `${row.answer.slice(0, 900)}…`
                        : row.answer}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted">
                      Answer not loaded for this question (top results only).
                    </p>
                  )}
                  {row.sources.length > 0 ? (
                    <ul className="space-y-1.5">
                      {row.sources.slice(0, 5).map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
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
