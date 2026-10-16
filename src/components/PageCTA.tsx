import Link from "next/link";
import type { ReactNode } from "react";
import FadeIn from "./FadeIn";

export default function PageCTA({
  children,
  tone = "soft",
  primary,
  secondary,
}: {
  children: ReactNode;
  tone?: "soft" | "elevated" | "deep";
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  const bg =
    tone === "elevated"
      ? "bg-bg-elevated"
      : tone === "deep"
        ? "bg-bg"
        : "bg-bg-soft";

  return (
    <div className={`border-t border-line ${bg} py-14 md:py-16`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <FadeIn className="max-w-lg text-lg text-snow md:text-xl">{children}</FadeIn>
        <FadeIn
          delay={0.08}
          className="flex flex-wrap items-center gap-3"
        >
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex rounded-md border border-line px-5 py-3 text-sm font-medium text-snow hover:bg-bg-soft"
            >
              {secondary.label}
            </Link>
          ) : null}
          <Link
            href={primary.href}
            className="inline-flex rounded-md bg-accent px-6 py-3 text-sm font-semibold text-[#010409] hover:bg-accent-deep"
          >
            {primary.label}
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
