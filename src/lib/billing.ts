import type { BillingEntitlements } from "@/lib/usage-limits";

/** Checkout intervals the app sells. */
export const BILLING_INTERVALS = ["monthly", "yearly"] as const;

export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export function isBillingInterval(value: unknown): value is BillingInterval {
  return (
    typeof value === "string" &&
    (BILLING_INTERVALS as readonly string[]).includes(value)
  );
}

/** Display metadata for the pricing UI. Amounts are in cents (USD). */
export const PRO_PLANS = {
  monthly: {
    amount: 800,
    label: "$8",
    period: "/ month",
    note: "Billed monthly. Cancel anytime.",
  },
  yearly: {
    amount: 7200,
    label: "$72",
    period: "/ year",
    note: "Billed $72 once a year — save $24.",
  },
} as const satisfies Record<
  BillingInterval,
  { amount: number; label: string; period: string; note: string }
>;

/**
 * Subscription statuses that grant Pro access. `past_due` is a grace period
 * while Stripe retries a failed payment.
 */
export const PRO_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
] as const;

export function isProSubscriptionStatus(
  status: string | null | undefined,
): boolean {
  return (
    status != null &&
    (PRO_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
  );
}

/** Billing data needed by the settings page. Dates cross the RSC boundary. */
export interface BillingOverview extends BillingEntitlements {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeCurrentPeriodEnd: Date | null;
  stripeCancelAtPeriodEnd: boolean;
}

/**
 * True when an event belongs to a subscription the user has already replaced.
 * Older active or deleted events must not overwrite the current subscription.
 * Checkout completion and the return route pass `replace: true` because they
 * represent a deliberate new purchase.
 */
export function isStaleSubscriptionEvent(
  currentSubscriptionId: string | null,
  incomingSubscriptionId: string,
): boolean {
  return Boolean(
    currentSubscriptionId &&
      currentSubscriptionId !== incomingSubscriptionId,
  );
}
