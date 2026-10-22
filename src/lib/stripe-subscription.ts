import type Stripe from "stripe";

import { isProSubscriptionStatus } from "@/lib/billing";

export interface SubscriptionSnapshot {
  subscriptionId: string;
  customerId: string;
  status: string;
  isPro: boolean;
  priceId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Maps a Stripe subscription to the fields stored on `User`.
 *
 * In the current Stripe API, `current_period_end` lives on subscription items,
 * not on the subscription itself. The first item is the Pro price (quantity 1).
 */
export function subscriptionSnapshot(
  subscription: Stripe.Subscription,
): SubscriptionSnapshot {
  const item = subscription.items.data[0];
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  return {
    subscriptionId: subscription.id,
    customerId,
    status: subscription.status,
    isPro: isProSubscriptionStatus(subscription.status),
    priceId: item?.price.id ?? null,
    currentPeriodEnd: item
      ? new Date(item.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}
