"use client";

import { signOut } from "next-auth/react";
import { setFlash, withFlash } from "@/lib/flash";

/** Clear the Auth.js session, then hard-navigate so SessionProvider cannot keep a stale login UI. */
export async function signOutToHome() {
  await signOut({ redirect: false });
  setFlash("signedOut");
  window.location.assign(withFlash("/", "signedOut"));
}
