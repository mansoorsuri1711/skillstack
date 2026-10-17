"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { consumeFlashMessage } from "@/lib/flash";

export default function FlashToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const text = consumeFlashMessage();
    if (!text) return;
    setMessage(text);

    const timer = window.setTimeout(() => setMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:top-6"
    >
      <div className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border border-success-border bg-success-bg px-4 py-3 text-sm text-success shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
        <p className="flex-1 font-medium leading-snug">{message}</p>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setMessage(null)}
          className="shrink-0 rounded-md p-0.5 text-success/70 transition hover:bg-success/10 hover:text-success"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
