import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";

type AuthShellProps = {
  title: string;
  children: ReactNode;
  footer: ReactNode;
};

/** GitHub-style centered auth layout — fixed viewport, no page scroll */
export default function AuthShell({ title, children, footer }: AuthShellProps) {
  return (
    <main className="relative flex h-[100svh] max-h-[100svh] flex-col items-center justify-center overflow-hidden bg-bg px-4 sm:px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle compact />
      </div>

      <div className="flex w-full max-w-[340px] flex-col items-center sm:max-w-[368px]">
        <Link
          href="/"
          className="transition hover:opacity-90"
          aria-label="SkillStack home"
        >
          <Image
            src="/brand/skill-stack.webp"
            alt=""
            width={48}
            height={48}
            className="logo-mark-invert h-11 w-11 sm:h-12 sm:w-12"
            priority
          />
        </Link>

        <h1 className="mt-5 text-center text-[22px] font-normal tracking-tight text-snow sm:mt-6 sm:text-2xl">
          {title}
        </h1>

        <div className="mt-5 w-full rounded-md border border-line bg-bg-elevated p-4 sm:mt-6 sm:p-5">
          {children}
        </div>

        <div className="mt-3 w-full rounded-md border border-line bg-transparent px-4 py-3 text-center text-sm text-ink-muted sm:mt-4 sm:py-4">
          {footer}
        </div>

        <p className="mt-5 text-center text-xs text-ink-muted sm:mt-6">
          <Link href="/" className="hover:text-accent hover:underline">
            ← Back to SkillStack
          </Link>
        </p>
      </div>
    </main>
  );
}
