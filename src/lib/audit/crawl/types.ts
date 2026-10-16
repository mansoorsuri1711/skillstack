import type { AuditIssueType, IssueSeverity } from "@/lib/audit/crawl/audit-issues";

export type CrawledPage = {
  url: string;
  statusCode: number;
  responseTimeMs: number;
  isHtml: boolean;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  h1Tags: string[];
  headingOrder: number[];
  wordCount: number;
  imagesTotal: number;
  imagesMissingAlt: number;
  outboundLinkCount: number;
  isIndexable: boolean;
  robotsMeta: string | null;
  canonicalUrl: string | null;
  crawlDepth: number;
};

export type DetectedCrawlIssue = {
  issueType: AuditIssueType;
  severity: IssueSeverity;
  title: string;
  pageUrl: string;
  details?: Record<string, unknown>;
};

export type CrawlAuditReport = {
  kind: "crawl";
  domain: string;
  startUrl: string;
  preparedAt: string;
  pagesCrawled: number;
  issuesFound: number;
  averageResponseTimeMs: number;
  maxPages: number;
  pages: CrawledPage[];
  issues: DetectedCrawlIssue[];
};
