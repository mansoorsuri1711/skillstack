/**
 * Site-audit issue registry — adapted from OpenSEO's AUDIT_ISSUE_TYPES
 * (https://github.com/every-app/open-seo) for SkillStack crawl audits.
 */

export type IssueSeverity = "critical" | "warning" | "info";

export type AuditIssueDescriptor = {
  severity: IssueSeverity;
  title: string;
  explanation: string;
  howToFix: string;
};

export const AUDIT_ISSUE_TYPES = {
  "server-error": {
    severity: "critical",
    title: "Server error (5xx)",
    explanation:
      "The page returned a 5xx server error. Search engines that repeatedly see server errors will crawl the site less and may drop the page from the index.",
    howToFix:
      "Check the server logs for this URL and fix the underlying error. If the page is gone, return a 404/410 or redirect it to a relevant page instead of erroring.",
  },
  "broken-page": {
    severity: "warning",
    title: "Page returns an error (4xx)",
    explanation:
      "This crawled URL returned a client error (e.g. 404). If it is referenced from your sitemap or other pages, crawlers keep wasting requests on it.",
    howToFix:
      "If the page should exist, restore it. If it is intentionally gone, remove it from the sitemap and internal links, and consider a 301 redirect to the closest live page.",
  },
  "missing-title": {
    severity: "critical",
    title: "Missing title tag",
    explanation:
      "The page has no title tag. The title is the strongest on-page relevance signal and the headline shown in search results.",
    howToFix:
      "Add a unique, descriptive title of roughly 50–60 characters that includes the page's primary topic.",
  },
  "title-too-long": {
    severity: "info",
    title: "Title too long",
    explanation:
      "The title exceeds ~60 characters, so search results will truncate it and the ending may be cut off mid-phrase.",
    howToFix:
      "Shorten the title to roughly 50–60 characters, front-loading the most important words.",
  },
  "title-too-short": {
    severity: "info",
    title: "Title too short",
    explanation:
      "The title is under ~10 characters, which is usually too generic to describe the page or attract clicks.",
    howToFix:
      "Expand the title into a descriptive phrase (roughly 30–60 characters) that states what the page offers.",
  },
  "missing-meta-description": {
    severity: "warning",
    title: "Missing meta description",
    explanation:
      "The page has no meta description. Search engines will assemble a snippet from page text, which is often less compelling.",
    howToFix:
      "Add a meta description of roughly 70–160 characters that summarizes the page and gives a reason to click.",
  },
  "meta-description-too-long": {
    severity: "info",
    title: "Meta description too long",
    explanation:
      "The meta description exceeds ~160 characters, so search engines will truncate the snippet.",
    howToFix:
      "Trim the description to roughly 70–160 characters while keeping the core message and call to action.",
  },
  "meta-description-too-short": {
    severity: "info",
    title: "Meta description too short",
    explanation:
      "The meta description is under ~70 characters. Short descriptions waste snippet space in search results.",
    howToFix:
      "Expand the description to roughly 70–160 characters that summarize the page and give a reason to click.",
  },
  "missing-h1": {
    severity: "warning",
    title: "Missing H1 heading",
    explanation:
      "The page has no H1. The H1 tells users and search engines what the page is about.",
    howToFix:
      "Add a single H1 that states the page's main topic, consistent with the title tag.",
  },
  "multiple-h1": {
    severity: "warning",
    title: "Multiple H1 headings",
    explanation:
      "The page has more than one H1, which dilutes the main-topic signal and usually indicates a templating mistake.",
    howToFix:
      "Keep one H1 for the page's main heading and demote the others to H2/H3.",
  },
  "heading-order-skip": {
    severity: "info",
    title: "Heading levels skip",
    explanation:
      "The heading hierarchy skips levels (e.g. an H4 directly after an H2). This weakens document structure for accessibility and content parsing.",
    howToFix:
      "Adjust heading levels so they descend one step at a time (H1 → H2 → H3) without skipping.",
  },
  "thin-content": {
    severity: "warning",
    title: "Thin content",
    explanation:
      "The page has very little visible text. Thin pages rarely rank and can drag down sitewide quality assessments.",
    howToFix:
      "Expand the page with useful content, noindex it, or consolidate it into a stronger page.",
  },
  "images-missing-alt": {
    severity: "warning",
    title: "Images missing alt text",
    explanation:
      "One or more images on the page lack alt attributes. Alt text is an accessibility requirement and helps search engines understand images.",
    howToFix:
      'Add descriptive alt text to meaningful images; use an empty alt (alt="") only for purely decorative ones.',
  },
  "no-outgoing-links": {
    severity: "warning",
    title: "Page has no outgoing links",
    explanation:
      "The page contains no links at all — a dead end for users and crawlers.",
    howToFix:
      "Add links to related pages, the parent category, or the homepage.",
  },
  "slow-response": {
    severity: "info",
    title: "Slow server response",
    explanation:
      "The HTML response took over 1.5 seconds. Slow time-to-first-byte drags down performance and crawl rate.",
    howToFix:
      "Investigate server/database time and caching; serving cached or statically generated HTML usually fixes it.",
  },
  "noindex-page": {
    severity: "info",
    title: "Page is noindex",
    explanation:
      "The page asks search engines not to index it via robots meta. Often intentional — this is a heads-up.",
    howToFix:
      "If this page should rank, remove the noindex directive. Otherwise no action is needed.",
  },
  "duplicate-title": {
    severity: "warning",
    title: "Duplicate title",
    explanation:
      "Multiple pages share the same title tag. Duplicates make pages compete with each other and depress click-through rates.",
    howToFix:
      "Write a unique title for each page describing its specific content.",
  },
  "duplicate-meta-description": {
    severity: "warning",
    title: "Duplicate meta description",
    explanation:
      "Multiple pages share the same meta description, so search results show identical snippets.",
    howToFix:
      "Write a unique meta description per page, or remove the duplicated one.",
  },
} as const satisfies Record<string, AuditIssueDescriptor>;

export type AuditIssueType = keyof typeof AUDIT_ISSUE_TYPES;

export const ISSUE_SEVERITY_ORDER: Record<IssueSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function getIssueDescriptor(
  issueType: string,
): AuditIssueDescriptor | null {
  return (
    (AUDIT_ISSUE_TYPES as Record<string, AuditIssueDescriptor>)[issueType] ??
    null
  );
}
