import {
  AUDIT_ISSUE_TYPES,
  type AuditIssueType,
} from "@/lib/audit/crawl/audit-issues";
import type { CrawledPage, DetectedCrawlIssue } from "@/lib/audit/crawl/types";

function issue(
  issueType: AuditIssueType,
  pageUrl: string,
  details?: Record<string, unknown>,
): DetectedCrawlIssue {
  const descriptor = AUDIT_ISSUE_TYPES[issueType];
  return {
    issueType,
    severity: descriptor.severity,
    title: descriptor.title,
    pageUrl,
    details,
  };
}

export function runMultipageChecks(pages: CrawledPage[]): DetectedCrawlIssue[] {
  const issues: DetectedCrawlIssue[] = [];
  const htmlPages = pages.filter(
    (p) => p.isHtml && p.statusCode >= 200 && p.statusCode < 300,
  );

  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();

  for (const page of htmlPages) {
    if (page.title) {
      const key = page.title.trim().toLowerCase();
      const list = titles.get(key) ?? [];
      list.push(page.url);
      titles.set(key, list);
    }
    if (page.metaDescription) {
      const key = page.metaDescription.trim().toLowerCase();
      const list = descriptions.get(key) ?? [];
      list.push(page.url);
      descriptions.set(key, list);
    }
  }

  for (const [title, urls] of titles) {
    if (urls.length < 2) continue;
    for (const url of urls) {
      issues.push(
        issue("duplicate-title", url, {
          title,
          duplicateCount: urls.length,
        }),
      );
    }
  }

  for (const [description, urls] of descriptions) {
    if (urls.length < 2) continue;
    for (const url of urls) {
      issues.push(
        issue("duplicate-meta-description", url, {
          description,
          duplicateCount: urls.length,
        }),
      );
    }
  }

  return issues;
}
