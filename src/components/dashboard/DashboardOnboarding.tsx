"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileCode2,
  Globe,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { DashboardProject } from "@/components/dashboard/useDashboardProject";

type StepId = "domain" | "gsc" | "audit" | "agent";

const SETUP_STEPS: Array<{
  id: StepId;
  stepNumber: string;
  title: string;
  description: string;
  icon: typeof Globe;
  cta: string;
  href?: string;
  accent: string;
  glow: string;
}> = [
  {
    id: "domain",
    stepNumber: "01",
    title: "Domain Scope",
    description:
      "Anchor crawls, backlinks, and keyword rankings to your primary target domain.",
    icon: Globe,
    cta: "Set Domain",
    accent: "text-ink",
    glow: "group-hover:shadow-sky-500/10",
  },
  {
    id: "gsc",
    stepNumber: "02",
    title: "Search Console",
    description:
      "Stream verified Google clicks, impressions, and query rankings into this workspace.",
    icon: BarChart3,
    cta: "Connect GSC",
    href: "/dashboard/gsc-insights-tool",
    accent: "text-ink",
    glow: "group-hover:shadow-violet-500/10",
  },
  {
    id: "audit",
    stepNumber: "03",
    title: "Site Diagnostics",
    description:
      "Check robots.txt, Schema.org, Core Web Vitals, and ranking risk signals.",
    icon: FileCode2,
    cta: "Run Diagnostic",
    href: "/dashboard/site-audit-tool",
    accent: "text-ink",
    glow: "group-hover:shadow-amber-500/10",
  },
  {
    id: "agent",
    stepNumber: "04",
    title: "Suri Intelligence",
    description:
      "Ask Suri about keywords, competitors, GSC, and next SEO moves for this project.",
    icon: MessageSquare,
    cta: "Open Suri",
    href: "/dashboard/chat",
    accent: "text-ink",
    glow: "group-hover:shadow-teal-500/15",
  },
];

export default function DashboardOnboarding({
  project,
  onSaveDomain,
}: {
  project: DashboardProject;
  onSaveDomain: (domain: string) => Promise<void>;
}) {
  const router = useRouter();
  const [domainInput, setDomainInput] = useState(project.domain);
  const [saving, setSaving] = useState(false);
  const [focusedStep, setFocusedStep] = useState<StepId | null>(null);

  useEffect(() => {
    setDomainInput(project.domain);
  }, [project.domain]);

  const hasCustomDomain = Boolean(project.domain && project.domain !== "example.com");
  const gscConnected = Boolean(project.gscConnected);

  const completedMap: Record<StepId, boolean> = useMemo(
    () => ({
      domain: hasCustomDomain,
      gsc: gscConnected,
      audit: hasCustomDomain,
      agent: true,
    }),
    [hasCustomDomain, gscConnected],
  );

  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / SETUP_STEPS.length) * 100);
  const nextStep = SETUP_STEPS.find((s) => !completedMap[s.id]) ?? null;

  async function handleSaveDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setSaving(true);
    try {
      await onSaveDomain(domainInput.trim());
    } finally {
      setSaving(false);
    }
  }

  function focusStep(id: StepId) {
    setFocusedStep(id);
    document.getElementById(`setup-step-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Workspace overview */}
      <div className="group/overview relative overflow-hidden rounded-2xl border border-line bg-bg-elevated p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition hover:border-accent/30 sm:p-5 md:p-6">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-muted">
              <span>Project Workspace</span>
              <span className="text-ink-muted/40">•</span>
              <span className="font-medium text-snow">
                {project.name || "Default Project"}
              </span>
            </div>

            <h1 className="text-lg font-semibold tracking-tight text-snow sm:text-xl md:text-2xl">
              {hasCustomDomain ? (
                <>
                  Project Overview:{" "}
                  <span className="underline decoration-accent decoration-2 underline-offset-4">
                    {project.domain}
                  </span>
                </>
              ) : (
                "Finish setup to unlock live SEO data"
              )}
            </h1>

            <p className="text-[13px] leading-relaxed text-ink-muted">
              Complete these four steps — domain, Search Console, diagnostics, and Suri.
              {nextStep ? (
                <>
                  {" "}
                  Next up: <span className="font-medium text-snow">{nextStep.title}</span>.
                </>
              ) : (
                " All steps are ready."
              )}
            </p>
          </div>

          <div className="w-full shrink-0 space-y-0.5 rounded-xl border border-line bg-bg-soft/80 p-3.5 text-[13px] shadow-sm backdrop-blur-sm lg:w-64">
            <div className="flex items-center justify-between border-b border-line/60 pb-2.5 text-[11px] text-ink-muted">
              <span className="font-semibold text-snow">Workspace Status</span>
              <span className="flex items-center gap-1.5 font-medium text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                ONLINE
              </span>
            </div>

            <button
              type="button"
              onClick={() => focusStep("domain")}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-mist"
            >
              <span className="text-ink-muted">DOMAIN</span>
              <span className="max-w-[140px] truncate font-medium text-snow">
                {hasCustomDomain ? project.domain : "UNASSIGNED"}
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                gscConnected
                  ? router.push("/dashboard/gsc-insights-tool")
                  : focusStep("gsc")
              }
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-mist"
            >
              <span className="text-ink-muted">GSC LINK</span>
              <span
                className={`font-semibold ${
                  gscConnected ? "text-accent" : "text-warn"
                }`}
              >
                {gscConnected ? "CONNECTED" : "UNLINKED →"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/chat")}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-mist"
            >
              <span className="text-ink-muted">SURI</span>
              <span className="font-semibold text-accent">READY →</span>
            </button>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-3 border-t border-line/60 pt-3.5">
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-ink-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Setup
          </span>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-accent">
            {completedCount}/{SETUP_STEPS.length}
          </span>
        </div>
      </div>

      {/* Four setup cards — slightly tighter so the page fits without scroll */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-muted">
            <Sparkles className="dash-icon h-3 w-3" />
            Setup & Integration Pipeline
          </h2>
          <span className="text-[11px] tabular-nums text-ink-muted">
            Tap a card to continue
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {SETUP_STEPS.map((step) => {
            const isDone = completedMap[step.id];
            const isNext = nextStep?.id === step.id;
            const isFocused = focusedStep === step.id || isNext;
            const Icon = step.icon;

            return (
              <div
                id={`setup-step-${step.id}`}
                key={step.id}
                onMouseEnter={() => setFocusedStep(step.id)}
                onFocus={() => setFocusedStep(step.id)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-300 sm:p-4 ${
                  isFocused
                    ? "border-accent/45 bg-bg-elevated shadow-[0_12px_32px_rgba(0,0,0,0.18)] ring-1 ring-accent/20"
                    : "border-line bg-bg-elevated shadow-sm hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-md"
                }`}
              >
                <div className="relative space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d1117] text-white">
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </div>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
                        <CheckCircle2 className="h-3 w-3" />
                        DONE
                      </span>
                    ) : isNext ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
                        NEXT
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-line bg-bg-soft px-2.5 py-0.5 text-[10px] text-ink-muted">
                        PENDING
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-muted">
                      Step {step.stepNumber}
                    </p>
                    <h3 className="text-[14px] font-semibold tracking-tight text-snow">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="relative mt-4 border-t border-line/60 pt-3.5">
                  {step.id === "domain" && !isDone ? (
                    <form onSubmit={handleSaveDomain} className="space-y-2">
                      <input
                        type="text"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        placeholder="yourdomain.com"
                        className="w-full rounded-xl border border-line bg-bg-input px-3 py-2 text-[13px] text-snow outline-none transition focus:border-accent"
                        disabled={saving}
                      />
                      <button
                        type="submit"
                        disabled={saving || !domainInput.trim()}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-fg transition hover:bg-accent-deep disabled:opacity-50"
                      >
                        {saving ? "Saving…" : step.cta}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : step.id === "domain" && isDone ? (
                    <div className="space-y-2">
                      <div className="truncate rounded-xl border border-line bg-bg-soft px-3 py-2 text-[12px] font-semibold text-snow">
                        {project.domain}
                      </div>
                      <DomainEditRow
                        domainInput={domainInput}
                        setDomainInput={setDomainInput}
                        saving={saving}
                        onSave={handleSaveDomain}
                      />
                    </div>
                  ) : step.href ? (
                    <Link
                      href={step.href}
                      prefetch
                      onMouseEnter={() => step.href && router.prefetch(step.href)}
                      onTouchStart={() => step.href && router.prefetch(step.href)}
                      className={`inline-flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-[13px] font-semibold transition ${
                        isDone
                          ? "border border-line bg-bg-soft text-snow hover:border-accent/40 hover:bg-mist"
                          : "bg-accent text-accent-fg shadow-sm shadow-accent/20 hover:bg-accent-deep"
                      }`}
                    >
                      <span>{step.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DomainEditRow({
  domainInput,
  setDomainInput,
  saving,
  onSave,
}: {
  domainInput: string;
  setDomainInput: (v: string) => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex w-full items-center justify-between rounded-xl border border-line bg-bg-soft px-3 py-2 text-[13px] font-medium text-snow transition hover:border-accent/40 hover:bg-mist"
      >
        <span>Change domain</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-2">
      <input
        type="text"
        value={domainInput}
        onChange={(e) => setDomainInput(e.target.value)}
        className="w-full rounded-xl border border-line bg-bg-input px-3 py-2 text-[13px] text-snow outline-none focus:border-accent"
        disabled={saving}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex-1 rounded-xl border border-line px-3 py-2 text-[13px] text-ink-muted hover:text-snow"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !domainInput.trim()}
          className="flex-1 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-fg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
