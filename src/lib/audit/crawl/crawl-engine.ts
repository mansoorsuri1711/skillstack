import { extractFromHtml } from "@/lib/audit/crawl/html-extract";
import type { CrawledPage } from "@/lib/audit/crawl/types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; SkillStack-Audit/1.0; +https://skillstack.com.pk)";

function normalizeStartUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a domain or URL to audit.");
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/\//, "")}`;
  const url = new URL(withProtocol);
  url.hash = "";
  if (url.pathname === "") url.pathname = "/";
  return url;
}

function sameHost(a: URL, b: URL) {
  return a.hostname.replace(/^www\./i, "") === b.hostname.replace(/^www\./i, "");
}

function shouldEnqueue(url: URL, origin: URL) {
  if (!sameHost(url, origin)) return false;
  if (!["http:", "https:"].includes(url.protocol)) return false;
  const path = url.pathname.toLowerCase();
  if (
    /\.(pdf|jpg|jpeg|png|gif|webp|svg|ico|css|js|woff2?|ttf|zip|mp4|mp3)$/i.test(
      path,
    )
  ) {
    return false;
  }
  // Drop tracking params for crawl budget / duplicate control
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(
    (key) => url.searchParams.delete(key),
  );
  url.hash = "";
  return true;
}

async function fetchPage(url: string): Promise<{
  statusCode: number;
  responseTimeMs: number;
  contentType: string;
  html: string | null;
  finalUrl: string;
}> {
  const started = Date.now();
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
  });
  const responseTimeMs = Date.now() - started;
  const contentType = response.headers.get("content-type") ?? "";
  const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);
  const html = isHtml ? await response.text() : null;
  return {
    statusCode: response.status,
    responseTimeMs,
    contentType,
    html,
    finalUrl: response.url || url,
  };
}

export async function crawlSite(
  startInput: string,
  options?: { maxPages?: number },
): Promise<{ origin: URL; pages: CrawledPage[] }> {
  const maxPages = Math.min(Math.max(options?.maxPages ?? 30, 1), 50);
  const origin = normalizeStartUrl(startInput);
  const queue: Array<{ url: string; depth: number }> = [
    { url: origin.toString(), depth: 0 },
  ];
  const seen = new Set<string>();
  const pages: CrawledPage[] = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const batch = queue.splice(0, Math.min(3, maxPages - pages.length));
    const settled = await Promise.all(
      batch.map(async ({ url, depth }) => {
        if (seen.has(url)) return null;
        seen.add(url);
        try {
          const fetched = await fetchPage(url);
          const finalUrl = fetched.finalUrl.split("#")[0]!;
          if (seen.has(finalUrl) && finalUrl !== url) {
            // Already processed after redirect collapse
          }
          seen.add(finalUrl);

          let extracted = null;
          if (fetched.html) {
            extracted = extractFromHtml(fetched.html, finalUrl);
          }

          const page: CrawledPage = {
            url: finalUrl,
            statusCode: fetched.statusCode,
            responseTimeMs: fetched.responseTimeMs,
            isHtml: Boolean(fetched.html),
            title: extracted?.title ?? null,
            metaDescription: extracted?.metaDescription ?? null,
            h1Count: extracted?.h1Tags.length ?? 0,
            h1Tags: extracted?.h1Tags ?? [],
            headingOrder: extracted?.headingOrder ?? [],
            wordCount: extracted?.wordCount ?? 0,
            imagesTotal: extracted?.imagesTotal ?? 0,
            imagesMissingAlt: extracted?.imagesMissingAlt ?? 0,
            outboundLinkCount: extracted?.links.length ?? 0,
            isIndexable: !(extracted?.robotsMeta ?? "").includes("noindex"),
            robotsMeta: extracted?.robotsMeta ?? null,
            crawlDepth: depth,
          };

          const nextLinks: Array<{ url: string; depth: number }> = [];
          if (extracted && depth < 4) {
            for (const link of extracted.links) {
              try {
                const next = new URL(link);
                if (!shouldEnqueue(next, origin)) continue;
                const normalized = next.toString();
                if (seen.has(normalized)) continue;
                if (queue.some((q) => q.url === normalized)) continue;
                nextLinks.push({ url: normalized, depth: depth + 1 });
              } catch {
                // ignore
              }
            }
          }

          return { page, nextLinks };
        } catch {
          return {
            page: {
              url,
              statusCode: 0,
              responseTimeMs: 0,
              isHtml: false,
              title: null,
              metaDescription: null,
              h1Count: 0,
              h1Tags: [],
              headingOrder: [],
              wordCount: 0,
              imagesTotal: 0,
              imagesMissingAlt: 0,
              outboundLinkCount: 0,
              isIndexable: true,
              robotsMeta: null,
              crawlDepth: depth,
            } satisfies CrawledPage,
            nextLinks: [] as Array<{ url: string; depth: number }>,
          };
        }
      }),
    );

    for (const item of settled) {
      if (!item) continue;
      pages.push(item.page);
      for (const next of item.nextLinks) {
        if (pages.length + queue.length >= maxPages) break;
        if (!seen.has(next.url) && !queue.some((q) => q.url === next.url)) {
          queue.push(next);
        }
      }
    }
  }

  return { origin, pages };
}
