import {
  AUDIT_ISSUE_TYPES,
  type AuditIssueType,
} from "@/lib/audit/crawl/audit-issues";
import type { CrawledPage, DetectedCrawlIssue } from "@/lib/audit/crawl/types";

const DUPLICATE_GROUP_SAMPLE = 3;

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

/** Normalize for canonical vs page URL comparison (OpenSEO-style). */
function normalizeUrlKey(url: string) {
  try {
    const u = new URL(url);
    u.hash = "";
    u.hostname = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url.trim().toLowerCase();
  }
}

/**
 * OpenSEO rule: pages already de-duplicated via noindex or canonical→other URL
 * must not appear in duplicate-title / duplicate-meta groups.
 */
function isDuplicateCandidate(page: CrawledPage): boolean {
  if (!page.isHtml) return false;
  if (page.statusCode < 200 || page.statusCode >= 300) return false;
  if (!page.isIndexable) return false;
  if (
    page.canonicalUrl &&
    normalizeUrlKey(page.canonicalUrl) !== normalizeUrlKey(page.url)
  ) {
    return false;
  }
  return true;
}

export function runMultipageChecks(pages: CrawledPage[]): DetectedCrawlIssue[] {
  const issues: DetectedCrawlIssue[] = [];
  const candidates = pages.filter(isDuplicateCandidate);

  const titles = new Map<string, CrawledPage[]>();
  const descriptions = new Map<string, CrawledPage[]>();

  for (const page of candidates) {
    if (page.title) {
      const key = page.title.trim();
      const list = titles.get(key) ?? [];
      list.push(page);
      titles.set(key, list);
    }
    if (page.metaDescription) {
      const key = page.metaDescription.trim();
      const list = descriptions.get(key) ?? [];
      list.push(page);
      descriptions.set(key, list);
    }
  }

  for (const group of titles.values()) {
    if (group.length < 2) continue;
    for (const page of group) {
      issues.push(
        issue("duplicate-title", page.url, {
          groupSize: group.length,
          otherUrls: group
            .filter((other) => other.url !== page.url)
            .slice(0, DUPLICATE_GROUP_SAMPLE)
            .map((other) => other.url),
        }),
      );
    }
  }

  for (const group of descriptions.values()) {
    if (group.length < 2) continue;
    for (const page of group) {
      issues.push(
        issue("duplicate-meta-description", page.url, {
          groupSize: group.length,
          otherUrls: group
            .filter((other) => other.url !== page.url)
            .slice(0, DUPLICATE_GROUP_SAMPLE)
            .map((other) => other.url),
        }),
      );
    }
  }

  return issues;
}
