"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOutToHome } from "@/lib/sign-out";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { HEADER_HEIGHT_CLASS } from "@/lib/layout";

const links = [
  { href: "/services", label: "Services" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/process", label: "Process" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const btnSolid =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-snow px-4 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-90";

function ProfileMenu({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full border border-snow/25 py-1 pl-1 pr-3 text-sm font-medium text-snow transition-colors hover:bg-snow/5"
      >
        <UserAvatar name={name} image={image} size="sm" />
        <span className="max-w-[7rem] truncate">Profile</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-bg-elevated py-1 shadow-2xl"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            prefetch={true}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink transition hover:bg-mist"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Dashboard
          </Link>
          <Link
            href="/profile"
            role="menuitem"
            prefetch={true}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink transition hover:bg-mist"
          >
            <User className="h-4 w-4 shrink-0" />
            Profile
          </Link>

          <div className="px-2 py-1">
            <ThemeToggle className="w-full justify-start rounded-lg border-0 bg-mist/50 px-2.5 py-2.5 hover:bg-mist" />
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOutToHome();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-ink transition hover:bg-mist"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

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
  const showGuest = !showAuth;
  const displayName = session?.user?.name ?? "Account";
  const avatarImage = session?.user?.image ?? null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter] duration-200 ${HEADER_HEIGHT_CLASS} ${
        menuOpen
          ? "bg-bg"
          : solid
            ? "bg-[var(--header-bg-solid)] backdrop-blur-md"
            : "bg-transparent"
      }`}
    >
      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:px-8">
        <Logo size="sm" priority className="relative z-10 shrink-0" />

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

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          {showAuth ? (
            <div className="hidden md:block">
              <ProfileMenu name={displayName} image={avatarImage} />
            </div>
          ) : null}

          {showGuest ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                prefetch={true}
                className="inline-flex whitespace-nowrap text-sm text-[var(--nav-muted)] transition-colors hover:text-[var(--nav-strong)]"
              >
                Log in
              </Link>
              <Link href="/register" prefetch={true} className={btnSolid}>
                Register
              </Link>
              <ThemeToggle compact />
            </div>
          ) : null}

          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-snow/25 text-snow md:hidden"
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
        <>
        {/* Opaque full-screen shield — hides page + blocks clicks behind the menu */}
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-x-0 bottom-0 top-16 z-[45] cursor-default bg-bg sm:top-[4.5rem] md:hidden"
          onClick={() => setMenuOpen(false)}
        />
        <nav
          id="mobile-nav"
          className="absolute inset-x-3 top-full z-50 mt-2 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-2xl border border-line bg-bg px-4 pb-5 pt-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-xl px-2 py-3 text-base text-ink transition hover:bg-mist"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-3 border-t border-line pt-4">
            <ThemeToggle className="w-full justify-start rounded-xl border-line bg-mist/40 px-3 py-3" />

            {showAuth ? (
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-xl bg-snow px-4 py-3 text-center text-sm font-semibold text-bg"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-xl border border-snow/25 px-4 py-3 text-center text-sm font-medium text-snow"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void signOutToHome();
                  }}
                  className="w-full rounded-xl border border-snow/25 px-4 py-3 text-center text-sm font-medium text-snow"
                >
                  Sign out
                </button>
              </div>
            ) : null}

            {showGuest ? (
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-xl bg-snow px-4 py-3 text-center text-sm font-semibold text-bg"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-xl border border-snow/25 px-4 py-3 text-center text-sm font-medium text-snow"
                >
                  Log in
                </Link>
              </div>
            ) : null}
          </div>
        </nav>
        </>
      ) : null}
    </header>
  );
}
