"use client";

import { type ReactNode } from "react";
import { DashboardMobileToggle } from "@/components/dashboard/DashboardSidebar";
import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardShell({
  title,
  description,
  children,
  actions,
  fill = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  fill?: boolean;
}) {
  const header = (
    <header className={fill ? "shrink-0 px-3.5 pt-3 sm:px-6 sm:pt-4" : "px-3.5 pt-3 sm:px-6 sm:pt-4"}>
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <DashboardMobileToggle />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold leading-tight tracking-tight text-snow sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 truncate text-sm leading-snug text-ink-muted sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <ThemeToggle compact />
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </header>
  );

  return (
    <div className="dashboard-shell flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-soft md:border-l md:border-line">
      {fill ? (
        <>
          {header}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-3.5 pt-3 sm:px-6 sm:pt-4">
            {children}
          </main>
        </>
      ) : (
        <main className="flex-1 overflow-y-auto overscroll-contain pb-4 sm:pb-5">
          {header}
          <div className="px-3.5 pt-3 sm:px-6 sm:pt-4">{children}</div>
        </main>
      )}
    </div>
  );
}
