import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPlan } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

function siteBaseUrl() {
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const planId = typeof body.planId === "string" ? body.planId : "pro";

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Please sign in or register before checking out." },
        { status: 401 },
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "SkillStack is currently in testing mode — all dashboard features are 100% free to use for now! Stripe checkout will be live soon.",
        },
        { status: 503 },
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID?.trim();
    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "STRIPE_PRICE_ID is missing. Create a Product/Price in the Stripe Dashboard and set STRIPE_PRICE_ID in your environment.",
        },
        { status: 503 },
      );
    }

    const stripe = getStripe();
    const baseUrl = siteBaseUrl();
    const email = session.user.email;
    const userId = session.user.id || "";

    // Hosted Checkout — matches Checkout Studio (hosted_web_0001 / payment / Stripe catalog)
    const checkoutSession = await stripe.checkout.sessions.create({
      ui_mode: "hosted_page",
      mode: "payment",
      customer_email: email,
      client_reference_id: userId || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId: plan.id,
        planName: plan.name,
        userEmail: email,
      },
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      submit_type: "auto",
      integration_identifier: "hosted_web_0001",
      origin_context: "web",
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing/cancel`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Could not create Stripe checkout session." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[Checkout Route Error]:", err);
    const message =
      err instanceof Error ? err.message : "Failed to initialize Stripe checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
