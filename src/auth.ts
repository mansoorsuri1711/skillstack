import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import {
  ATTRIBUTION_COOKIE,
  parseAttribution,
  userAttributionFields,
} from "@/lib/attribution";
import { User } from "@/models/User";
import authConfig from "@/auth.config";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,

  providers: [
    Google({
      clientId:
        process.env.AUTH_GOOGLE_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ||
        process.env.GOOGLE_CLIENT_SECRET ||
        process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginToken: { label: "Login Token", type: "text" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.toLowerCase().trim()
            : "";
        const password = credentials?.password;
        const loginToken =
          typeof credentials?.loginToken === "string"
            ? credentials.loginToken.trim()
            : "";

        if (!email) return null;

        await connectDB();
        const user = await User.findOne({ email });
        if (!user) return null;

        // One-time sign-in right after email verification (no password on that page).
        if (loginToken) {
          if (
            !user.postVerifyLoginToken ||
            user.postVerifyLoginToken !== loginToken ||
            !user.postVerifyLoginTokenExpires ||
            user.postVerifyLoginTokenExpires <= new Date()
          ) {
            return null;
          }

          if (!user.emailVerified) {
            throw new EmailNotVerifiedError();
          }

          user.postVerifyLoginToken = null;
          user.postVerifyLoginTokenExpires = null;
          await user.save();

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image ?? undefined,
          };
        }

        if (typeof password !== "string" || !password || !user.password) {
          return null;
        }

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = user.image ?? token.picture;
      }

      // Repair stale JWTs that stored a Google sub (or missing id) instead of Mongo _id.
      const email =
        typeof token.email === "string" ? token.email.toLowerCase().trim() : "";
      const tokenId = typeof token.id === "string" ? token.id : "";
      const needsRepair =
        Boolean(email) &&
        (!tokenId ||
          !(
            tokenId.length === 24 &&
            /^[a-f0-9]{24}$/i.test(tokenId)
          ));

      if (needsRepair || (tokenId && email && trigger === "update")) {
        await connectDB();
        let dbUser =
          tokenId && /^[a-f0-9]{24}$/i.test(tokenId)
            ? await User.findById(tokenId).select("name image email")
            : null;
        if (!dbUser && tokenId) {
          dbUser = await User.findOne({ googleId: tokenId }).select(
            "name image email",
          );
        }
        if (!dbUser && email) {
          dbUser = await User.findOne({ email }).select("name image email");
        }
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.name = dbUser.name;
          token.picture = dbUser.image ?? token.picture;
        }
      }

      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name as string;
        if (session.user.image) token.picture = session.user.image as string;
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },

    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      try {
        const email =
          typeof user.email === "string"
            ? user.email.toLowerCase().trim()
            : "";
        if (!email) {
          console.error("[auth] Google sign-in missing email");
          return "/auth/error?error=NoEmail";
        }

        if (!process.env.MONGODB_URI) {
          console.error("[auth] MONGODB_URI is not set in this environment");
          return "/auth/error?error=Database";
        }

        await connectDB();

        let dbUser = await User.findOne({ email });

        if (!dbUser) {
          let attribution: ReturnType<typeof userAttributionFields> = null;
          try {
            const jar = await cookies();
            attribution = userAttributionFields(
              parseAttribution(jar.get(ATTRIBUTION_COOKIE)?.value),
            );
          } catch {
            // cookies() unavailable in some edge cases — signup still proceeds
          }

          dbUser = await User.create({
            name: user.name?.trim() || "SkillStack user",
            email,
            password: undefined,
            emailVerified: new Date(),
            googleId: account.providerAccountId,
            image: user.image ?? undefined,
            ...(attribution ?? {}),
          });
        } else {
          dbUser.googleId = account.providerAccountId;
          dbUser.emailVerified = dbUser.emailVerified ?? new Date();
          await dbUser.save();
        }

        user.id = dbUser._id.toString();
        user.name = dbUser.name;
        user.email = dbUser.email;
        user.image = dbUser.image ?? undefined;
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[auth] Google sign-in failed:", message, err);
        if (
          /MONGODB_URI|buffering timed out|ECONNREFUSED|ENOTFOUND|authentication failed|bad auth|MongoServerError|MongoNetworkError|E11000|duplicate key/i.test(
            message,
          )
        ) {
          return "/auth/error?error=Database";
        }
        return "/auth/error?error=AccessDenied";
      }
    },
  },
});
