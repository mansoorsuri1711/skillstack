"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <ThemeProvider>
      <SessionProvider
        session={session}
        // Re-fetch the session every 24 hours (aligned with updateAge in src/auth.ts)
        // so the client stays in sync without hammering the server.
        refetchInterval={24 * 60 * 60}
        refetchOnWindowFocus={true}
      >
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
