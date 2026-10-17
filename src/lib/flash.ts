export type FlashKind = "signedIn" | "signedOut";

const STORAGE_KEY = "skillstack:flash";

const MESSAGES: Record<FlashKind, string> = {
  signedIn: "You're signed in.",
  signedOut: "You've been signed out.",
};

/** Persist a flash message so it survives auth redirects and React Strict Mode remounts. */
export function setFlash(kind: FlashKind) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, MESSAGES[kind]);
  } catch {
    /* private mode / blocked storage */
  }
}

/** Append `?flash=…` as a URL fallback (e.g. OAuth callback). */
export function withFlash(url: string, kind: FlashKind): string {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}flash=${encodeURIComponent(kind)}${hash}`;
}

/**
 * Read the pending flash message without clearing it (Strict Mode safe).
 * Also migrates `?flash=` from the URL into sessionStorage once.
 */
export function readFlashMessage(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const url = new URL(window.location.href);
    const kind = url.searchParams.get("flash");
    if (kind === "signedIn" || kind === "signedOut") {
      sessionStorage.setItem(STORAGE_KEY, MESSAGES[kind]);
      url.searchParams.delete("flash");
      window.history.replaceState(
        {},
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }

    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearFlashMessage() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
