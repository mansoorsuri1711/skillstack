import JumpingDot from "./JumpingDot";
import SkillAmalgamation from "./SkillAmalgamation";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-0 items-center overflow-hidden bg-bg md:min-h-[100svh]"
    >
      <div
        aria-hidden="true"
        className="theme-ambient pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(45,212,191,0.12),transparent_55%),radial-gradient(ellipse_60%_40%_at_10%_80%,rgba(56,100,140,0.1),transparent_50%)]"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-6 px-4 pb-12 pt-28 sm:gap-8 sm:px-6 sm:pb-16 sm:pt-32 md:grid-cols-[1.15fr_0.85fr] md:gap-12 md:px-8 md:pb-20 md:pt-36">
        <div className="max-w-xl">
          {/* h1 is the LCP element — CSS animation so it's visible from first paint */}
          <h1 className="hero-item hero-item-1 relative inline-block overflow-visible pr-2 sm:pr-4">
            <span
              className="font-display text-[2.75rem] font-bold leading-none tracking-tight text-snow sm:text-6xl md:text-7xl lg:text-8xl"
              data-speakable
            >
              SkillStack
            </span>
            <JumpingDot />
          </h1>

          <p className="hero-item hero-item-2 mt-3 max-w-xl text-base font-medium leading-snug tracking-tight text-ink sm:mt-5 sm:text-3xl">
            From keyword to Google&apos;s first page — websites built to{" "}
            <em>rank</em> and <em>earn.</em>
          </p>

          <p className="hero-item hero-item-3 mt-2.5 max-w-md text-sm leading-relaxed text-ink-muted sm:mt-5 sm:text-lg">
            Web development, SEO, keyword research, content, and backlinks —
            from Gilgit-Baltistan to clients across Pakistan and worldwide.
          </p>

          <div className="hero-item hero-item-4 mt-5 grid w-full grid-cols-2 gap-2.5 sm:mt-9 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-4">
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-accent px-3 py-2.5 text-center text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-deep sm:px-6 sm:py-3"
            >
              Let&apos;s talk
            </a>
            <a
              href="/services"
              className="inline-flex items-center justify-center rounded-md border border-snow/25 bg-transparent px-3 py-2.5 text-center text-sm font-medium text-snow transition-colors hover:bg-mist sm:px-6 sm:py-3"
            >
              See services
            </a>
          </div>
        </div>

        <div className="mt-6 flex min-h-0 w-full justify-center overflow-visible sm:mt-8 md:mt-0 md:justify-end md:pl-6 md:min-h-[400px]">
          <SkillAmalgamation />
        </div>
      </div>
    </section>
  );
}
