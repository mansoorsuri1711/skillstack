"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Globe,
  Info,
  Radar,
  Search,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
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
import {
  getIssueDescriptor,
  ISSUE_SEVERITY_ORDER,
  type IssueSeverity,
} from "@/lib/audit/crawl/audit-issues";
import type {
  CrawlAuditReport,
  DetectedCrawlIssue,
} from "@/lib/audit/crawl/types";
import type { AiSiteAuditDiagnosticReport } from "@/lib/audit/ai-diagnostic-types";

type Mode = "crawl" | "ai";
type ResultTab = "issues" | "pages";

const severityStyles: Record<IssueSeverity, string> = {
  critical: "border-l-red-500/70 bg-red-500/5",
  warning: "border-l-amber-400/70 bg-amber-400/5",
  info: "border-l-sky-400/70 bg-sky-400/5",
};

const severityBadge: Record<IssueSeverity, string> = {
  critical: "bg-red-500/15 text-red-300 border-red-500/30",
  warning: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  info: "bg-sky-500/15 text-sky-200 border-sky-500/30",
};

type IssueGroup = {
  issueType: string;
  severity: IssueSeverity;
  title: string;
  explanation: string;
  howToFix: string;
  issues: DetectedCrawlIssue[];
};

function groupIssues(issues: DetectedCrawlIssue[]): IssueGroup[] {
  const map = new Map<string, IssueGroup>();
  for (const issue of issues) {
    let group = map.get(issue.issueType);
    if (!group) {
      const descriptor = getIssueDescriptor(issue.issueType);
      group = {
        issueType: issue.issueType,
        severity: issue.severity,
        title: descriptor?.title ?? issue.title,
        explanation: descriptor?.explanation ?? "",
        howToFix: descriptor?.howToFix ?? "",
        issues: [],
      };
      map.set(issue.issueType, group);
    }
    group.issues.push(issue);
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      ISSUE_SEVERITY_ORDER[a.severity] - ISSUE_SEVERITY_ORDER[b.severity] ||
      b.issues.length - a.issues.length,
  );
}

function formatDetails(details?: Record<string, unknown>) {
  if (!details) return null;
  const parts = Object.entries(details)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => {
      const value = Array.isArray(v) ? v.join(" → ") : String(v);
      const truncated =
        value.length > 180 ? `${value.slice(0, 180)}…` : value;
      return `${k}: ${truncated}`;
    });
  return parts.length ? parts.join(" · ") : null;
}

function IssueGroupRow({ group }: { group: IssueGroup }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-line border-l-4 ${severityStyles[group.severity]}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.02]"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-snow">{group.title}</p>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityBadge[group.severity]}`}
            >
              {group.severity}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm text-ink-muted">
          <span>
            {group.issues.length} {group.issues.length === 1 ? "page" : "pages"}
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-line/70 px-4 py-4">
          {group.explanation ? (
            <p className="text-sm leading-relaxed text-ink-muted">
              {group.explanation}
            </p>
          ) : null}
          {group.howToFix ? (
            <p className="text-sm leading-relaxed text-snow/90">
              <span className="font-semibold text-accent">How to fix: </span>
              {group.howToFix}
            </p>
          ) : null}
          <ul className="space-y-2">
            {group.issues.slice(0, 100).map((issue, idx) => {
              const details = formatDetails(issue.details);
              return (
                <li
                  key={`${issue.pageUrl}-${idx}`}
                  className="rounded-lg border border-line/70 bg-bg/60 px-3 py-2.5"
                >
                  <a
                    href={issue.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 break-all text-sm font-medium text-accent hover:underline"
                  >
                    {issue.pageUrl}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                  {details ? (
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {details}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function exportIssuesCsv(report: CrawlAuditReport) {
  const rows = [
    ["issue_type", "severity", "title", "page_url", "details"],
    ...report.issues.map((issue) => [
      issue.issueType,
      issue.severity,
      issue.title,
      issue.pageUrl,
      JSON.stringify(issue.details ?? {}),
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.domain}-site-audit-issues.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SiteAuditPage() {
  const { project, loading: projectLoading, dataForSeoConfigured } =
    useDashboardProject();
  const [mode, setMode] = useState<Mode>("crawl");
  const [domainInput, setDomainInput] = useState("");
  const [maxPages, setMaxPages] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [crawlReport, setCrawlReport] = useState<CrawlAuditReport | null>(null);
  const [aiReport, setAiReport] = useState<AiSiteAuditDiagnosticReport | null>(
    null,
  );
  const [resultTab, setResultTab] = useState<ResultTab>("issues");

  useEffect(() => {
    if (project?.domain && project.domain !== "example.com" && !domainInput) {
      setDomainInput(project.domain);
    }
  }, [project?.domain, domainInput]);

  const groups = useMemo(
    () => (crawlReport ? groupIssues(crawlReport.issues) : []),
    [crawlReport],
  );

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, warning: 0, info: 0 };
    for (const issue of crawlReport?.issues ?? []) {
      counts[issue.severity] += 1;
    }
    return counts;
  }, [crawlReport]);

  async function runCrawlAudit() {
    const target = domainInput.trim() || project?.domain || "";
    if (!target || target === "example.com") {
      setError("Enter a domain to run the site audit.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/audit/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, maxPages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Audit failed");
      setCrawlReport(data.report);
      setResultTab("issues");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed to run.");
    } finally {
      setLoading(false);
    }
  }

  async function runAiAudit() {
    const target = domainInput.trim() || project?.domain || "";
    if (!target || target === "example.com") {
      setError("Enter a domain to run the AI diagnosis.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/audit/ai-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI audit failed");
      setAiReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI audit failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Site Audit"
      description="Crawl your site for on-page SEO issues — titles, meta, headings, thin content, and more."
    >
      <PageStack>
        <DataForSeoBanner configured={dataForSeoConfigured} />
        {error ? <DashboardAlert variant="error">{error}</DashboardAlert> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("crawl")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === "crawl"
                ? "bg-accent text-[#010409]"
                : "border border-line text-ink-muted hover:text-snow"
            }`}
          >
            <Radar className="h-3.5 w-3.5" /> Crawl audit
          </button>
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === "ai"
                ? "bg-accent text-[#010409]"
                : "border border-line text-ink-muted hover:text-snow"
            }`}
          >
            <Bot className="h-3.5 w-3.5" /> AI diagnosis
          </button>
        </div>

        <DashboardCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-xs font-medium text-ink-muted">
              Domain / URL
              <div className="relative mt-1.5">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  className={`${inputClass} pl-9`}
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="example.com"
                  disabled={loading || projectLoading}
                />
              </div>
            </label>
            {mode === "crawl" ? (
              <label className="w-full text-xs font-medium text-ink-muted sm:w-36">
                Max pages
                <select
                  className={`${inputClass} mt-1.5`}
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                  disabled={loading}
                >
                  {[10, 20, 30, 40, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button
              type="button"
              onClick={() =>
                void (mode === "crawl" ? runCrawlAudit() : runAiAudit())
              }
              disabled={loading || projectLoading}
              className={buttonPrimaryClass}
            >
              <Search className="h-4 w-4" />
              {loading
                ? mode === "crawl"
                  ? "Crawling…"
                  : "Diagnosing…"
                : mode === "crawl"
                  ? "Run site audit"
                  : "Run AI diagnosis"}
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            {mode === "crawl"
              ? "Crawls internal pages and groups issues like title length, meta descriptions, heading skips, and duplicates — OpenSEO-style."
              : "AI diagnosis still available for ranking root-cause analysis using DataForSEO signals."}
          </p>
        </DashboardCard>

        {loading ? (
          <LoadingBlock
            label={
              mode === "crawl"
                ? "Crawling pages and checking on-page SEO…"
                : "Running AI site diagnosis…"
            }
          />
        ) : null}

        {mode === "crawl" && crawlReport ? (
          <>
            <DashboardCard>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-snow">
                      {crawlReport.domain}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Done
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    Site audit · Started{" "}
                    {new Date(crawlReport.preparedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportIssuesCsv(crawlReport)}
                  className={buttonGhostClass}
                >
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>

              <div className="mt-4">
                <MetricGrid>
                  <MetricTile
                    label="Pages crawled"
                    value={String(crawlReport.pagesCrawled)}
                  />
                  <MetricTile
                    label="Issues found"
                    value={String(crawlReport.issuesFound)}
                    hint={`Critical ${severityCounts.critical} · Warning ${severityCounts.warning} · Info ${severityCounts.info}`}
                  />
                  <MetricTile
                    label="Avg response"
                    value={`${crawlReport.averageResponseTimeMs}ms`}
                  />
                </MetricGrid>
              </div>
            </DashboardCard>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setResultTab("issues")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    resultTab === "issues"
                      ? "bg-accent text-[#010409]"
                      : "text-ink-muted hover:text-snow"
                  }`}
                >
                  Issues ({crawlReport.issuesFound})
                </button>
                <button
                  type="button"
                  onClick={() => setResultTab("pages")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    resultTab === "pages"
                      ? "bg-accent text-[#010409]"
                      : "text-ink-muted hover:text-snow"
                  }`}
                >
                  Pages ({crawlReport.pagesCrawled})
                </button>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-300" />{" "}
                  {severityCounts.critical} critical
                </span>
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />{" "}
                  {severityCounts.warning} warning
                </span>
                <span className="inline-flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-sky-300" />{" "}
                  {severityCounts.info} info
                </span>
              </div>
            </div>

            {resultTab === "issues" ? (
              groups.length === 0 ? (
                <EmptyBlock
                  icon={CheckCircle2}
                  title="No issues found"
                  description="Nice — the crawled pages passed the on-page checks we run."
                />
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <IssueGroupRow key={group.issueType} group={group} />
                  ))}
                </div>
              )
            ) : (
              <DashboardCard flush className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[720px] w-full text-left text-sm">
                    <thead className="border-b border-line bg-bg-elevated/80 text-[11px] uppercase tracking-wide text-ink-muted">
                      <tr>
                        <th className="px-4 py-3">URL</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Words</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crawlReport.pages.map((page) => (
                        <tr
                          key={page.url}
                          className="border-b border-line/60 last:border-0"
                        >
                          <td className="max-w-[320px] truncate px-4 py-3">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:underline"
                            >
                              {page.url}
                            </a>
                          </td>
                          <td className="px-4 py-3 tabular-nums text-ink-muted">
                            {page.statusCode || "—"}
                          </td>
                          <td className="max-w-[240px] truncate px-4 py-3 text-snow">
                            {page.title || "—"}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-ink-muted">
                            {page.responseTimeMs}ms
                          </td>
                          <td className="px-4 py-3 tabular-nums text-ink-muted">
                            {page.wordCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            )}
          </>
        ) : null}

        {mode === "ai" && aiReport ? (
          <DashboardCard>
            <h2 className="font-display text-lg font-semibold text-snow">
              AI diagnosis · {aiReport.domain}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {aiReport.executiveSummary?.headline ??
                "Diagnosis complete. Open technical and action-plan sections from the previous AI UI flow as needed."}
            </p>
            <div className="mt-4 space-y-2">
              {(aiReport.rootCauses ?? []).slice(0, 6).map((cause, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-line bg-bg/50 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-snow">{cause.headline}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {cause.whyGooglePenalizes}
                  </p>
                  <p className="mt-1 text-xs text-accent/90">
                    Fix: {cause.actionableFix}
                  </p>
                </div>
              ))}
            </div>
          </DashboardCard>
        ) : null}

        {!loading && mode === "crawl" && !crawlReport ? (
          <EmptyBlock
            icon={Radar}
            title="Run a crawl audit"
            description="We'll fetch internal pages and group SEO issues by type — titles, meta descriptions, headings, thin content, and duplicates."
          />
        ) : null}
      </PageStack>
    </DashboardShell>
  );
}
