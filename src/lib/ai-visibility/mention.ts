import type { PromptCitation } from "@/lib/ai-visibility/types";

function normalizeHost(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export function textMentionsBrand(text: string, brandHints: string[]) {
  const hay = text.toLowerCase();
  return brandHints.some((hint) => {
    const needle = hint.trim().toLowerCase();
    return needle.length >= 2 && hay.includes(needle);
  });
}

export function citationsOwnDomain(
  sources: PromptCitation[],
  domain?: string | null,
) {
  if (!domain) return false;
  const host = normalizeHost(domain);
  return sources.some((s) => {
    try {
      return normalizeHost(new URL(s.url).hostname) === host ||
        normalizeHost(s.url).includes(host);
    } catch {
      return normalizeHost(s.url).includes(host);
    }
  });
}

export function brandHintsFromProject(project: {
  name: string;
  domain: string;
}) {
  const domain = normalizeHost(project.domain);
  const name = project.name.trim();
  const hints = [name, domain, domain.split(".")[0]].filter(Boolean);
  return [...new Set(hints.map((h) => h.toLowerCase()))];
}
