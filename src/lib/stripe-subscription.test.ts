import type Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { subscriptionSnapshot } from "@/lib/stripe-subscription";

const PERIOD_END_SECONDS = 1_800_000_000;

function makeSubscription(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  return {
    id: "sub_1",
    customer: "cus_1",
    status: "active",
    cancel_at_period_end: false,
    metadata: {},
    items: {
      data: [
        {
          price: { id: "price_monthly" },
          current_period_end: PERIOD_END_SECONDS,
        },
      ],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("subscriptionSnapshot", () => {
  it("maps an active subscription to a Pro snapshot", () => {
    expect(subscriptionSnapshot(makeSubscription())).toEqual({
      subscriptionId: "sub_1",
      customerId: "cus_1",
      status: "active",
      isPro: true,
      priceId: "price_monthly",
      currentPeriodEnd: new Date(PERIOD_END_SECONDS * 1000),
      cancelAtPeriodEnd: false,
    });
  });

  it("grants Pro for trialing and past_due subscriptions", () => {
    expect(subscriptionSnapshot(makeSubscription({ status: "trialing" })).isPro)
      .toBe(true);
    expect(subscriptionSnapshot(makeSubscription({ status: "past_due" })).isPro)
      .toBe(true);
  });

  it("revokes Pro for canceled and unpaid subscriptions", () => {
    expect(subscriptionSnapshot(makeSubscription({ status: "canceled" })).isPro)
      .toBe(false);
    expect(subscriptionSnapshot(makeSubscription({ status: "unpaid" })).isPro)
      .toBe(false);
  });

  it("reads the price and period end from the first subscription item", () => {
    const snapshot = subscriptionSnapshot(makeSubscription());

    expect(snapshot.priceId).toBe("price_monthly");
    expect(snapshot.currentPeriodEnd?.getTime()).toBe(
      PERIOD_END_SECONDS * 1000,
    );
  });

  it("returns null price and period end when there are no items", () => {
    const snapshot = subscriptionSnapshot(
      makeSubscription({
        items: { data: [] } as unknown as Stripe.Subscription["items"],
      }),
    );

    expect(snapshot.priceId).toBeNull();
    expect(snapshot.currentPeriodEnd).toBeNull();
  });

  it("handles an expanded customer object", () => {
    const snapshot = subscriptionSnapshot(
      makeSubscription({
        customer: { id: "cus_expanded" } as Stripe.Customer,
      }),
    );

    expect(snapshot.customerId).toBe("cus_expanded");
  });

  it("carries the cancel-at-period-end flag", () => {
    const snapshot = subscriptionSnapshot(
      makeSubscription({ cancel_at_period_end: true }),
    );

    expect(snapshot.cancelAtPeriodEnd).toBe(true);
  });
});
