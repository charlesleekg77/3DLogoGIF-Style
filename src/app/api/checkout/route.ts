import { NextResponse } from "next/server";
import Stripe from "stripe";
import { resolveTier } from "@/lib/tiers";

/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout Session and returns its hosted URL. Card details are
 * collected by Stripe, never by this app, which keeps the integration out of PCI
 * scope entirely.
 *
 * Body: { tierId: "pro" | "studio", interval: "monthly" | "annual" }
 *
 * Runs on the Node runtime because the Stripe SDK uses Node crypto.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  if (!stripeSecret) {
    return NextResponse.json(
      { error: "Payments are not configured on this deployment." },
      { status: 503 },
    );
  }

  let body: { tierId?: string; interval?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const interval = body.interval === "annual" ? "annual" : "monthly";
  const resolved = body.tierId ? resolveTier(body.tierId, interval) : null;

  if (!resolved) {
    return NextResponse.json({ error: "Unknown pricing tier." }, { status: 400 });
  }

  if (resolved.tier.priceMonthly === 0) {
    return NextResponse.json(
      { error: "The free tier does not require checkout." },
      { status: 400 },
    );
  }

  const priceId = process.env[resolved.priceEnv];
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for ${resolved.tier.name} (${interval}).` },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-02-24.acacia" });
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: resolved.tier.id === "studio" ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      // Success/cancel return to the studio; the webhook is the source of truth
      // for entitlement, not this redirect.
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      client_reference_id: resolved.tier.id,
      metadata: { tierId: resolved.tier.id, interval },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe returned no checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
