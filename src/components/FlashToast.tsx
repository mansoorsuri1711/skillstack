"use client";

import { useEffect, useState } from "react";
import { clearFlashMessage, readFlashMessage } from "@/lib/flash";

const ENTER_MS = 300;
const HOLD_MS = 1700;
const EXIT_MS = 300;

export default function FlashToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const text = readFlashMessage();
    if (!text) return;

    setMessage(text);
    setVisible(false);

    let enterInner = 0;
    const enterOuter = window.requestAnimationFrame(() => {
      enterInner = window.requestAnimationFrame(() => setVisible(true));
    });

    const hideTimer = window.setTimeout(
      () => setVisible(false),
      ENTER_MS + HOLD_MS,
    );
    const clearTimer = window.setTimeout(() => {
      clearFlashMessage();
      setMessage(null);
    }, ENTER_MS + HOLD_MS + EXIT_MS);

    return () => {
      window.cancelAnimationFrame(enterOuter);
      window.cancelAnimationFrame(enterInner);
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[200] sm:right-6 sm:top-6"
    >
      <div
        className="max-w-sm rounded-xl border border-success-border bg-success-bg px-4 py-3 text-sm font-medium leading-snug text-success shadow-lg backdrop-blur-sm will-change-transform"
        style={{
          transitionProperty: "transform, opacity",
          transitionDuration: `${visible ? ENTER_MS : EXIT_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          transform: visible ? "translateX(0)" : "translateX(120%)",
          opacity: visible ? 1 : 0,
        }}
      >
        {message}
      </div>
    </div>
  );
}
