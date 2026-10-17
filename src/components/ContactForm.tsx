"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function ContactForm() {
  const { data: session, status } = useSession();
  const [name, setName] = useState<string | null>(null);
  const [topic, setTopic] = useState("Full stack project");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const resolvedName = name ?? session?.user?.name ?? "";

  if (status === "loading") {
    return (
      <div className="rounded-lg border border-line bg-bg-soft px-6 py-10 text-center text-sm text-ink-muted md:px-8">
        Checking your session…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-line bg-bg-soft p-6 md:p-8">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent via-accent/40 to-transparent"
        />
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Sign in required
        </p>
        <h3 className="mt-3 font-display text-xl font-semibold text-snow">
          Log in to send a brief
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Contact submissions are limited to authenticated SkillStack accounts so
          we can reply to a verified email.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login?callbackUrl=/contact"
            className="inline-flex rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-[#010409] hover:bg-accent-deep"
          >
            Sign in
          </Link>
          <Link
            href="/register?callbackUrl=/contact"
            className="inline-flex rounded-md border border-line px-5 py-2.5 text-sm font-medium text-snow hover:bg-bg-soft"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resolvedName, topic, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send.");
        setLoading(false);
        return;
      }
      setSent(true);
      setMessage("");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative space-y-5 overflow-hidden rounded-lg border border-line bg-bg-soft p-6 md:p-8"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent via-accent/40 to-transparent"
      />
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Send a brief
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Signed in as{" "}
          <span className="text-snow">{session.user.email}</span>. We’ll reply to
          this address.
        </p>
      </div>
      <label className="block">
        <span className="text-sm text-ink-muted">Name</span>
        <input
          name="name"
          required
          value={resolvedName}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-bg px-3 py-2.5 text-snow outline-none transition-colors focus:border-accent"
        />
      </label>
      <label className="block">
        <span className="text-sm text-ink-muted">Email</span>
        <input
          name="email"
          type="email"
          value={session.user.email ?? ""}
          readOnly
          className="mt-2 w-full rounded-md border border-line bg-bg/80 px-3 py-2.5 text-ink-muted outline-none"
        />
      </label>
      <label className="block">
        <span className="text-sm text-ink-muted">Topic</span>
        <span className="relative mt-2 block">
          <select
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full appearance-none rounded-md border border-line bg-bg py-2.5 pl-3 pr-11 text-snow outline-none transition-colors focus:border-accent"
          >
            <option>Full stack project</option>
            <option>Website build</option>
            <option>SEO & ranking</option>
            <option>Keyword package</option>
            <option>Backlinks</option>
            <option>Other</option>
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6.25 8 10l4-3.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </label>
      <label className="block">
        <span className="text-sm text-ink-muted">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 w-full resize-y rounded-md border border-line bg-bg px-3 py-2.5 text-snow outline-none transition-colors focus:border-accent"
          placeholder="Niche, market, timeline, and goals…"
        />
      </label>
      <button
        type="submit"
        disabled={loading || sent}
        className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-[#010409] hover:bg-accent-deep disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Sending…" : sent ? "Sent" : "Send brief"}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {sent ? (
        <p className="text-sm text-accent">
          Thanks — your brief was sent. We’ll reply within 1–2 business days.
        </p>
      ) : null}
    </form>
  );
}
