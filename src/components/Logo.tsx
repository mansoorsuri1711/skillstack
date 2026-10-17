import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  /** Icon + wordmark (default) or icon only */
  variant?: "full" | "mark";
  /** Slightly smaller footer / header treatment */
  size?: "sm" | "md";
  /** Only for above-the-fold LCP (e.g. header). Avoid on footer. */
  priority?: boolean;
};

const MARK_SRC = "/brand/skill-stack.webp";

export default function Logo({
  href = "/",
  className = "",
  variant = "full",
  size = "md",
  priority = false,
}: LogoProps) {
  const px = size === "sm" ? 34 : 40;
  const textSize = size === "sm" ? "text-base" : "text-xl";
  const showWordmark = variant === "full";

  const mark = (
    <Image
      src={MARK_SRC}
      alt=""
      width={px}
      height={px}
      className="logo-mark-invert shrink-0"
      priority={priority}
    />
  );

  const inner = (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      {mark}
      {/* Keep wordmark mounted so collapse/expand animates symmetrically (no pop-in on the ●). */}
      <span
        className={`inline-flex min-w-0 items-baseline overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200 ease-out ${
          showWordmark
            ? "ml-0 max-w-[9.5rem] opacity-100"
            : "ml-0 max-w-0 opacity-0"
        }`}
        aria-hidden={!showWordmark}
      >
        <span
          className={`font-display font-bold tracking-tight text-snow ${textSize}`}
        >
          SkillStack
          <span
            className="ml-[0.12em] inline-block translate-y-[0.1em] align-baseline text-[0.38em] leading-none text-brand"
            aria-hidden
          >
            ●
          </span>
        </span>
      </span>
    </span>
  );

  if (!href) {
    return <span className={className}>{inner}</span>;
  }

  return (
    <Link
      href={href}
      className={`items-center transition-opacity hover:opacity-90 ${
        className.includes("hidden") ? "" : "inline-flex"
      } ${className}`}
      aria-label="SkillStack home"
    >
      {inner}
    </Link>
  );
}
