# Stripe Integration TODO — Launch checklist

Hosted Checkout is wired in [`src/app/api/checkout/route.ts`](src/app/api/checkout/route.ts) to match Checkout Studio (`hosted_web_0001`, `mode: payment`, Stripe catalog Price).

You do **not** need the Studio sample `checkout.html` / `success.html` — SkillStack already uses:

- Buy CTA → `POST /api/checkout` → redirect to `session.url`
- Success → [`/pricing/success`](src/app/pricing/success/page.tsx)
- Cancel → [`/pricing/cancel`](src/app/pricing/cancel/page.tsx)
- Webhook → [`/api/webhook/stripe`](src/app/api/webhook/stripe/route.ts)

## Values to Replace

**Files:**
- [`src/app/api/checkout/route.ts`](src/app/api/checkout/route.ts) (reads env)
- [`.env.example`](.env.example) / your `.env.local` / Vercel env

| Field | Current Value | What to Set |
|-------|---------------|-------------|
| `line_items[0].price` | `process.env.STRIPE_PRICE_ID` | Your Stripe Price ID (`price_...`) from [Products](https://dashboard.stripe.com/products) |
| `success_url` | `{AUTH_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}` | Already set — ensure `AUTH_URL` is your live domain |
| `cancel_url` | `{AUTH_URL}/pricing/cancel` | Already set |
| `mode` | `payment` | Already set (one-time). Use `subscription` only if you switch to recurring |

## Configured Parameters (Checkout Studio)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` |
| mode | `payment` |
| billing_address_collection | `auto` |
| allow_promotion_codes | `false` |
| submit_type | `auto` |
| integration_identifier | `hosted_web_0001` |
| origin_context | `web` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` |

## Do this now (launch steps)

### 1. Create the product in Stripe (catalog)

1. Open [Stripe Products](https://dashboard.stripe.com/test/products) (use **Test mode** first).
2. Create product e.g. **SkillStack Pro Suite** — price **$20 USD**, one-time.
3. Copy the **Price ID** (`price_...`).

### 2. Env vars — local `.env.local` and Vercel

| Name | Value |
|------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (then later `sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_PRICE_ID` | `price_...` from step 1 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from step 3 |
| `AUTH_URL` | `https://skillstack.com.pk` (or your Vercel URL) |

Never commit secret keys. Never put `sk_...` in frontend code.

### 3. Webhook (required for Pro unlock)

Stripe Dashboard → Developers → Webhooks → Add endpoint:

- **URL:** `https://YOUR-DOMAIN/api/webhook/stripe`
- **Events (recommended for this payment mode):**
  - `checkout.session.completed` ← **required** (already handled)
- Optional later (subscriptions): `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*`

Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`.

Local test:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

### 4. Smoke test

1. Redeploy Vercel after env vars.
2. Sign in → Pricing → Checkout.
3. Pay with test card `4242 4242 4242 4242`.
4. Confirm redirect to `/pricing/success` and `dashboardPro` unlocks.

## How it works

```
Pricing page → POST /api/checkout
  → stripe.checkout.sessions.create (hosted_page + STRIPE_PRICE_ID)
  → browser redirects to session.url (Stripe-hosted)
  → success_url / cancel_url
  → webhook checkout.session.completed → User.dashboardPro = true
```

## Resources

- https://docs.stripe.com/checkout/quickstart
- https://docs.stripe.com/webhooks
- https://docs.stripe.com/testing
- https://docs.stripe.com/mcp
