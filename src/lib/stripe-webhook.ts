import type Stripe from "stripe";

import {
  clearStripeSubscription,
  syncStripeSubscription,
} from "@/lib/db/billing";
import { getStripe } from "@/lib/stripe";

/** Verifies a webhook signature and returns the parsed event. */
export function parseStripeEvent(
  payload: string,
  signature: string,
  secret: string,
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}

async function resolveSubscription(
  value: string | Stripe.Subscription,
): Promise<Stripe.Subscription> {
  return typeof value === "string"
    ? getStripe().subscriptions.retrieve(value)
    : value;
}

/**
 * Applies a Stripe event to the user's billing row. Unknown event types are
 * ignored; the route acknowledges them with a 200 so Stripe stops retrying.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      // Stripe's Event type does not narrow `data.object` by event type.
      const checkout = event.data.object as Stripe.Checkout.Session;

      if (checkout.mode !== "subscription" || !checkout.subscription) {
        return;
      }

      const subscription = await resolveSubscription(checkout.subscription);

      await syncStripeSubscription(subscription, {
        userId: checkout.client_reference_id ?? undefined,
        replace: true,
      });

      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await syncStripeSubscription(event.data.object as Stripe.Subscription);
      return;
    }

    case "customer.subscription.deleted": {
      await clearStripeSubscription(
        event.data.object as Stripe.Subscription,
      );
      return;
    }

    default:
      return;
  }
}
