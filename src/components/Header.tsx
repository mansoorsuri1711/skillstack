"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOutToHome } from "@/lib/sign-out";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { HEADER_HEIGHT_CLASS } from "@/lib/layout";

const links = [
  { href: "/services", label: "Services" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/process", label: "Process" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const btnOutline =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-snow/25 px-4 py-1.5 text-sm font-medium text-snow transition-colors hover:bg-snow/5";
const btnSolid =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-snow px-4 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-90";

export default function Header() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 48);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showAuth = status === "authenticated" && Boolean(session?.user);
  // Treat loading as guest so Log in / Register never pop in after paint.
  // Server-hydrated session (Providers) usually skips loading entirely.
  const showGuest = !showAuth;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter] duration-200 ${HEADER_HEIGHT_CLASS} ${
        solid || menuOpen
          ? "bg-[var(--header-bg-solid)] backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 md:px-8">
        {/* Left — logo. pointer-events-none so empty flex space doesn't block center nav clicks */}
        <div className="relative z-10 flex min-w-0 flex-1 items-center justify-start pointer-events-none">
          <Logo size="sm" priority className="pointer-events-auto shrink-0" />
        </div>

        {/* Center — above side columns so Services…Contact stay clickable */}
        <nav
          className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-5 md:flex lg:gap-6"
          aria-label="Primary"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              className="whitespace-nowrap text-sm text-[var(--nav-muted)] transition-colors hover:text-[var(--nav-strong)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — auth + theme */}
        <div className="relative z-10 flex min-w-0 flex-1 items-center justify-end gap-2 pointer-events-none sm:gap-2.5">
          {showAuth ? (
            <>
              <button
                type="button"
                onClick={() => void signOutToHome()}
                className={`pointer-events-auto hidden sm:inline-flex ${btnOutline}`}
              >
                Sign out
              </button>
              <Link
                href="/profile"
                prefetch={true}
                className={`pointer-events-auto hidden sm:inline-flex ${btnOutline}`}
              >
                Profile
              </Link>
              <Link
                href="/dashboard"
                prefetch={true}
                className={`pointer-events-auto hidden sm:inline-flex ${btnSolid}`}
              >
                Dashboard
              </Link>
            </>
          ) : null}

          {showGuest ? (
            <>
              <Link
                href="/login"
                prefetch={true}
                className="pointer-events-auto hidden whitespace-nowrap text-sm text-[var(--nav-muted)] transition-colors hover:text-[var(--nav-strong)] sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/register"
                prefetch={true}
                className={`pointer-events-auto hidden sm:inline-flex ${btnSolid}`}
              >
                Register
              </Link>
            </>
          ) : null}

          <div className="pointer-events-auto ml-2 sm:ml-3">
            <ThemeToggle compact />
          </div>

          <button
            type="button"
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-snow/25 text-snow md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="flex w-4 flex-col gap-1" aria-hidden>
              <span
                className={`h-0.5 w-full rounded-full bg-snow transition ${menuOpen ? "translate-y-[6px] rotate-45" : ""}`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-snow transition ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-snow transition ${menuOpen ? "-translate-y-[6px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          className="absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] overflow-y-auto bg-[var(--header-bg-solid)] px-4 pb-6 pt-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 sm:max-h-[calc(100svh-4.5rem)] md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block px-1 py-3.5 text-base text-ink"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-2.5">
            {showAuth ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-full bg-snow px-4 py-3 text-center text-sm font-semibold text-bg"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-full border border-snow/25 px-4 py-3 text-center text-sm font-medium text-snow"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void signOutToHome();
                  }}
                  className="w-full rounded-full border border-snow/25 px-4 py-3 text-center text-sm font-medium text-snow"
                >
                  Sign out
                </button>
              </>
            ) : null}
            {showGuest ? (
              <>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-full bg-snow px-4 py-3 text-center text-sm font-semibold text-bg"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-full px-4 py-3 text-center text-sm font-medium text-[var(--nav-muted)]"
                >
                  Log in
                </Link>
              </>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
