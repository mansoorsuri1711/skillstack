"use client";

import { ShieldAlert } from "lucide-react";
import {
  DashboardCard,
  DataTable,
  ResultsPanel,
} from "@/components/dashboard/ui";
import type { SiteAuditReport } from "@/lib/audit/types";

const severityStyles: Record<string, string> = {
  critical: "text-red-400 bg-red-400/10 border-red-400/20",
  high: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityStyles[severity] ?? severityStyles.low}`}
    >
      {severity}
    </span>
  );
}

export function ClassicSiteAuditReportView({ report }: { report: SiteAuditReport }) {
  return (
    <>
      <DashboardCard title="Executive Summary">
        <div className="space-y-3 text-sm leading-relaxed text-ink-muted">
          {report.executiveSummary.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
      </DashboardCard>

      <ResultsPanel title="Findings Summary" description="Prioritized issues across all audit areas">
        <DataTable
          rows={report.findings}
          rowKey={(row) => `${row.area}-${row.issue}`}
          columns={[
            {
              key: "severity",
              header: "Severity",
              cell: (row) => <SeverityBadge severity={row.severity} />,
            },
            { key: "area", header: "Area", cell: (row) => row.area },
            {
              key: "issue",
              header: "Issue",
              cell: (row) => <span className="text-snow">{row.issue}</span>,
            },
            {
              key: "impact",
              header: "Impact",
              cell: (row) => (
                <span className="text-ink-muted">{row.impact}</span>
              ),
            },
          ]}
        />
      </ResultsPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard
          title={`Security Headers — ${report.overallSecurityGrade} Rating`}
          description={`Scanned ${new Date(report.securityHeaders.scannedAt).toLocaleString()}`}
        >
          {report.securityHeaders.missing.length > 0 ? (
            <>
              <p className="mb-3 text-sm text-ink-muted">
                {report.securityHeaders.missing.length} header
                {report.securityHeaders.missing.length === 1 ? "" : "s"} missing:
              </p>
              <ul className="space-y-1.5 text-sm text-snow">
                {report.securityHeaders.missing.map((h) => (
                  <li key={h} className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-400" />
                    {h}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-accent">All six recommended security headers are present.</p>
          )}
        </DashboardCard>

        <DashboardCard title="On-Page SEO — H1 Tags">
          {report.onPageSeo.pagesMissingH1.length === 0 ? (
            <p className="text-sm text-accent">
              All {report.onPageSeo.pagesAnalyzed.length} analyzed pages include an H1.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {report.onPageSeo.pagesMissingH1.map((page) => (
                <li key={page.url} className="truncate text-snow">
                  {page.url}
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard title="Backlink Profile">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ink-muted">Domain Rating</dt>
              <dd className="font-semibold text-snow">
                {report.backlinks.domainRating ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Referring domains</dt>
              <dd className="font-semibold text-snow">
                {report.backlinks.referringDomains?.toLocaleString() ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Total backlinks</dt>
              <dd className="font-semibold text-snow">
                {report.backlinks.totalBacklinks?.toLocaleString() ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Organic keywords</dt>
              <dd className="font-semibold text-snow">
                {report.domainMetrics.organicKeywords?.toLocaleString() ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Top 3 rankings</dt>
              <dd className="font-semibold text-snow">
                {report.domainMetrics.top3Rankings ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Organic traffic (est.)</dt>
              <dd className="font-semibold text-snow">
                {report.domainMetrics.organicTraffic?.toLocaleString() ?? "—"}
              </dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard title="Page Performance">
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-2 font-medium text-snow">Mobile</p>
              <p className="text-ink-muted">
                Performance {report.performance.mobile.performance} · Accessibility{" "}
                {report.performance.mobile.accessibility} · Best Practices{" "}
                {report.performance.mobile.bestPractices} · SEO{" "}
                {report.performance.mobile.seo} · Agentic{" "}
                {report.performance.mobile.agenticBrowsing.score}/
                {report.performance.mobile.agenticBrowsing.max}
              </p>
            </div>
            <div>
              <p className="mb-2 font-medium text-snow">Desktop</p>
              <p className="text-ink-muted">
                Performance {report.performance.desktop.performance} · Accessibility{" "}
                {report.performance.desktop.accessibility} · Best Practices{" "}
                {report.performance.desktop.bestPractices} · SEO{" "}
                {report.performance.desktop.seo} · Agentic{" "}
                {report.performance.desktop.agenticBrowsing.score}/
                {report.performance.desktop.agenticBrowsing.max}
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {report.crawlability.issues.length > 0 ? (
        <DashboardCard title="Crawlability Issues">
          <ul className="space-y-3 text-sm">
            {report.crawlability.issues.map((issue) => (
              <li key={issue.url} className="rounded-xl border border-line bg-bg p-3">
                <p className="font-medium text-snow">{issue.url}</p>
                <p className="mt-1 text-ink-muted">
                  HTTP {issue.statusCode} — {issue.issue}
                </p>
              </li>
            ))}
          </ul>
        </DashboardCard>
      ) : null}

      <ResultsPanel title="Prioritized Action Plan">
        <DataTable
          rows={report.actionPlan}
          rowKey={(row) => String(row.priority)}
          columns={[
            {
              key: "priority",
              header: "#",
              cell: (row) => (
                <span className="font-semibold text-accent">{row.priority}</span>
              ),
            },
            {
              key: "action",
              header: "Action",
              cell: (row) => <span className="text-snow">{row.action}</span>,
            },
            {
              key: "severity",
              header: "Severity",
              cell: (row) => <SeverityBadge severity={row.severity} />,
            },
          ]}
        />
      </ResultsPanel>
    </>
  );
}

