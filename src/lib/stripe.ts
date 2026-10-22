import Stripe from "stripe";

import type { BillingInterval } from "@/lib/billing";

/**
 * Server-only Stripe client. Created lazily so builds and non-billing pages do
 * not require Stripe configuration. Never import this module from a client
 * component.
 */
let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_ID_MONTHLY &&
      process.env.STRIPE_PRICE_ID_YEARLY,
  );
}

export function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }

  client ??= new Stripe(secret, {
    // stripe-node v23 pins API version 2026-09-30.endive. TypeScript flags
    // this literal after a major SDK upgrade.
    apiVersion: "2026-09-30.endive",
    maxNetworkRetries: 2,
  });

  return client;
}

export function getProPriceId(interval: BillingInterval): string {
  const name =
    interval === "monthly"
      ? "STRIPE_PRICE_ID_MONTHLY"
      : "STRIPE_PRICE_ID_YEARLY";
  const priceId = process.env[name];

  if (!priceId) {
    throw new Error(`${name} is not set.`);
  }

  return priceId;
}

/** Maps a stored price ID back to the billing interval, for display. */
export function intervalForPriceId(
  priceId: string | null,
): BillingInterval | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_MONTHLY) return "monthly";
  if (priceId === process.env.STRIPE_PRICE_ID_YEARLY) return "yearly";
  return null;
}
