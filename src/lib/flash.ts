export type FlashKind = "signedIn" | "signedOut";

const MESSAGES: Record<FlashKind, string> = {
  signedIn: "You're signed in.",
  signedOut: "You've been signed out.",
};

/** Append `?flash=…` (or `&flash=…`) so the next page can show a toast. */
export function withFlash(url: string, kind: FlashKind): string {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}flash=${encodeURIComponent(kind)}${hash}`;
}

/** Read and strip `flash` from the current URL. Returns the toast message or null. */
export function consumeFlashMessage(): string | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const kind = url.searchParams.get("flash");
  if (!kind) return null;

  url.searchParams.delete("flash");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);

  if (kind === "signedIn" || kind === "signedOut") {
    return MESSAGES[kind];
  }
  return null;
}
