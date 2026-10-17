"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import PasswordInput from "@/components/PasswordInput";
import { withFlash } from "@/lib/flash";

const inputClass =
  "mt-1.5 w-full rounded-md border border-line bg-bg-input px-3 py-2 text-sm text-snow outline-none transition placeholder:text-ink-muted/50 focus:border-accent";

function safeCallbackUrl(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    try {
      const checkRes = await fetch("/api/auth/prelogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const check = await checkRes.json();

      if (!checkRes.ok) {
        setError(check.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      const next = withFlash(callbackUrl, "signedIn");
      await signIn("credentials", {
        email,
        password,
        callbackUrl: next,
        redirectTo: next,
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <GoogleSignInButton callbackUrl={callbackUrl} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-mist" />
        <span className="text-[11px] uppercase tracking-wide text-ink-muted">
          or
        </span>
        <div className="h-px flex-1 bg-mist" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {error ? (
          <p className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-snow">Email address</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </label>

        <PasswordInput
          name="password"
          label="Password"
          required
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#010409] transition hover:bg-accent-deep disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <LoginFormInner />
    </Suspense>
  );
}
