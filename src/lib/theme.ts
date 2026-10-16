export const THEME_STORAGE_KEY = "ss-theme";
export type ThemeMode = "dark" | "light";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "dark" || value === "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  // Ensure body/html paint from tokens even if a utility class lagged
  root.style.backgroundColor = "var(--bg)";
  if (document.body) {
    document.body.style.backgroundColor = "var(--bg)";
    document.body.style.color = "var(--ink)";
  }
}

/** Inline script — run before paint to avoid theme flash */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t="dark";}var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t;r.style.backgroundColor="var(--bg)";}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
