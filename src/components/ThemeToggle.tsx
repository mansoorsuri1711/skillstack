"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-md border border-line bg-bg-elevated text-ink transition hover:border-accent/40 hover:text-accent ${
        compact ? "h-9 w-9" : "gap-2 px-3 py-1.5 text-xs font-medium sm:text-sm"
      } ${className}`}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Dark mode" : "Light mode"}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {compact ? null : (
        <span className="hidden sm:inline">{isLight ? "Dark" : "Light"}</span>
      )}
    </button>
  );
}
