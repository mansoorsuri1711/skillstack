import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Missing verification token." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "This verification link is invalid or has expired." },
        { status: 400 },
      );
    }

    const loginToken = crypto.randomBytes(32).toString("hex");

    user.emailVerified = new Date();
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.postVerifyLoginToken = loginToken;
    user.postVerifyLoginTokenExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return NextResponse.json({
      ok: true,
      email: user.email,
      loginToken,
      message: "Email verified. Signing you in...",
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
