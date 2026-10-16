import {
  AUDIT_ISSUE_TYPES,
  type AuditIssueType,
} from "@/lib/audit/crawl/audit-issues";
import type { CrawledPage, DetectedCrawlIssue } from "@/lib/audit/crawl/types";

const TITLE_MAX_CHARS = 60;
const TITLE_MIN_CHARS = 10;
const META_DESCRIPTION_MAX_CHARS = 160;
const META_DESCRIPTION_MIN_CHARS = 70;
const THIN_CONTENT_WORDS = 150;
const SLOW_RESPONSE_MS = 1500;

function hasHeadingLevelSkip(headingOrder: number[]) {
  for (let i = 1; i < headingOrder.length; i++) {
    if (headingOrder[i]! > headingOrder[i - 1]! + 1) return true;
  }
  return false;
}

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

export function runPageChecks(page: CrawledPage): DetectedCrawlIssue[] {
  const issues: DetectedCrawlIssue[] = [];

  if (page.statusCode >= 500) {
    issues.push(issue("server-error", page.url, { statusCode: page.statusCode }));
    return issues;
  }
  if (page.statusCode >= 400) {
    issues.push(issue("broken-page", page.url, { statusCode: page.statusCode }));
    return issues;
  }
  if (page.statusCode >= 300) return issues;

  if (page.responseTimeMs > SLOW_RESPONSE_MS) {
    issues.push(
      issue("slow-response", page.url, { responseTimeMs: page.responseTimeMs }),
    );
  }

  if (!page.isHtml) return issues;

  if (!page.isIndexable) {
    issues.push(issue("noindex-page", page.url, { robotsMeta: page.robotsMeta }));
  }

  if (!page.title) {
    issues.push(issue("missing-title", page.url));
  } else if (page.title.length > TITLE_MAX_CHARS) {
    issues.push(
      issue("title-too-long", page.url, {
        length: page.title.length,
        max: TITLE_MAX_CHARS,
        title: page.title,
      }),
    );
  } else if (page.title.length < TITLE_MIN_CHARS) {
    issues.push(
      issue("title-too-short", page.url, {
        length: page.title.length,
        title: page.title,
      }),
    );
  }

  if (!page.metaDescription) {
    issues.push(issue("missing-meta-description", page.url));
  } else if (page.metaDescription.length > META_DESCRIPTION_MAX_CHARS) {
    issues.push(
      issue("meta-description-too-long", page.url, {
        length: page.metaDescription.length,
        max: META_DESCRIPTION_MAX_CHARS,
        description: page.metaDescription,
      }),
    );
  } else if (page.metaDescription.length < META_DESCRIPTION_MIN_CHARS) {
    issues.push(
      issue("meta-description-too-short", page.url, {
        length: page.metaDescription.length,
        description: page.metaDescription,
      }),
    );
  }

  if (page.h1Count === 0) {
    issues.push(issue("missing-h1", page.url));
  } else if (page.h1Count > 1) {
    issues.push(issue("multiple-h1", page.url, { h1Count: page.h1Count }));
  }

  if (hasHeadingLevelSkip(page.headingOrder)) {
    issues.push(issue("heading-order-skip", page.url));
  }

  if (page.isIndexable && page.wordCount < THIN_CONTENT_WORDS) {
    issues.push(issue("thin-content", page.url, { wordCount: page.wordCount }));
  }

  if (page.imagesMissingAlt > 0) {
    issues.push(
      issue("images-missing-alt", page.url, {
        imagesMissingAlt: page.imagesMissingAlt,
        imagesTotal: page.imagesTotal,
      }),
    );
  }

  if (page.isIndexable && page.outboundLinkCount === 0) {
    issues.push(issue("no-outgoing-links", page.url));
  }

  return issues;
}
