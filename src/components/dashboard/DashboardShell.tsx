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
  return (
    <div className="dashboard-shell flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-soft md:border-l md:border-t md:border-line">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-3.5 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <DashboardMobileToggle />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-snow sm:text-xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-0.5 truncate text-[13px] text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle compact />
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <main
        className={
          fill
            ? "flex min-h-0 flex-1 flex-col overflow-hidden px-3.5 pt-4 sm:px-6 sm:pt-5"
            : "flex-1 overflow-y-auto overscroll-contain px-3.5 py-4 sm:px-6 sm:py-5"
        }
      >
        {children}
      </main>
    </div>
  );
}
