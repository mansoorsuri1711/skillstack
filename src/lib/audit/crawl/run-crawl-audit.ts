import { crawlSite } from "@/lib/audit/crawl/crawl-engine";
import { runMultipageChecks } from "@/lib/audit/crawl/multipage-checks";
import { runPageChecks } from "@/lib/audit/crawl/page-checks";
import type { CrawlAuditReport } from "@/lib/audit/crawl/types";

export async function runCrawlAudit(
  startInput: string,
  options?: { maxPages?: number },
): Promise<CrawlAuditReport> {
  const maxPages = options?.maxPages ?? 30;
  const { origin, pages } = await crawlSite(startInput, { maxPages });

  const issues = [
    ...pages.flatMap((page) => runPageChecks(page)),
    ...runMultipageChecks(pages),
  ];

  const timed = pages.filter((p) => p.responseTimeMs > 0);
  const averageResponseTimeMs =
    timed.length === 0
      ? 0
      : Math.round(
          timed.reduce((sum, p) => sum + p.responseTimeMs, 0) / timed.length,
        );

  return {
    kind: "crawl",
    domain: origin.hostname.replace(/^www\./i, ""),
    startUrl: origin.toString(),
    preparedAt: new Date().toISOString(),
    pagesCrawled: pages.length,
    issuesFound: issues.length,
    averageResponseTimeMs,
    maxPages,
    pages,
    issues,
  };
}
