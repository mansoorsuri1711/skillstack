function decodeEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num: string) =>
      String.fromCodePoint(Number.parseInt(num, 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export type ExtractedPage = {
  title: string | null;
  metaDescription: string | null;
  h1Tags: string[];
  headingOrder: number[];
  wordCount: number;
  imagesTotal: number;
  imagesMissingAlt: number;
  links: string[];
  robotsMeta: string | null;
};

export function extractFromHtml(html: string, pageUrl: string): ExtractedPage {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).trim() || null : null;

  const metaDescMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i,
    );
  const metaDescription = metaDescMatch
    ? decodeEntities(metaDescMatch[1]).trim() || null
    : null;

  const robotsMatch =
    html.match(
      /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["'][^>]*>/i,
    );
  const robotsMeta = robotsMatch ? robotsMatch[1].trim().toLowerCase() : null;

  const h1Tags: string[] = [];
  for (const match of html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)) {
    const text = stripTags(match[1]).trim();
    if (text) h1Tags.push(text);
  }

  const headingOrder: number[] = [];
  for (const match of html.matchAll(/<h([1-6])\b[^>]*>/gi)) {
    headingOrder.push(Number(match[1]));
  }

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const bodyText = stripTags(bodyHtml);
  const wordCount = bodyText
    ? bodyText.split(/\s+/).filter(Boolean).length
    : 0;

  let imagesTotal = 0;
  let imagesMissingAlt = 0;
  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    imagesTotal += 1;
    const attrs = match[1] ?? "";
    if (!/\balt\s*=/i.test(attrs)) imagesMissingAlt += 1;
  }

  const links: string[] = [];
  const base = new URL(pageUrl);
  for (const match of html.matchAll(/<a\b[^>]+href=["']([^"']+)["'][^>]*>/gi)) {
    const href = match[1]?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      continue;
    }
    try {
      const absolute = new URL(href, base).toString();
      links.push(absolute.split("#")[0]);
    } catch {
      // ignore bad hrefs
    }
  }

  return {
    title,
    metaDescription,
    h1Tags,
    headingOrder,
    wordCount,
    imagesTotal,
    imagesMissingAlt,
    links: [...new Set(links)],
    robotsMeta,
  };
}
