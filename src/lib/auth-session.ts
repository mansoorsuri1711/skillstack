import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { resolveUser } from "@/lib/resolve-user";
import { User } from "@/models/User";
import type { Session } from "next-auth";

/** Re-export `auth()` for server components and Route Handlers. */
export { auth as getSession };

/**
 * Asserts an authenticated user is present.
 * Returns `{ user }` on success.
 * Returns `{ response }` — a ready-to-return 401 JSON response — when the
 * request is unauthenticated, so the caller can do:
 *
 * ```ts
 * const result = await requireUser();
 * if ("response" in result) return result.response;
 * const { user } = result;
 * ```
 */
export async function requireUser(request?: Request): Promise<
  | { user: NonNullable<Session["user"]> & { id: string } }
  | { response: NextResponse }
> {
  if (request) {
    const headerKey =
      request.headers.get("x-skillstack-key") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (headerKey?.startsWith("ss_")) {
      await connectDB();
      const dbUser = await User.findOne({ dashboardApiKey: headerKey }).select(
        "_id name email image",
      );
      if (dbUser) {
        return {
          user: {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            image: dbUser.image ?? undefined,
          },
        };
      }
    }
  }

  const session = await auth();
  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const sessionId = session.user.id ?? "";
  const dbUser = await resolveUser(sessionId, session.user.email, "_id name email image");

  if (!dbUser) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    user: {
      ...session.user,
      id: dbUser._id.toString(),
      name: dbUser.name ?? session.user.name,
      email: dbUser.email ?? session.user.email,
      image: dbUser.image ?? session.user.image,
    } as NonNullable<Session["user"]> & {
      id: string;
    },
  };
}
