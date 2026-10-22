import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStripe: vi.fn(),
  syncStripeSubscription: vi.fn(),
  clearStripeSubscription: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({ getStripe: mocks.getStripe }));

vi.mock("@/lib/db/billing", () => ({
  syncStripeSubscription: mocks.syncStripeSubscription,
  clearStripeSubscription: mocks.clearStripeSubscription,
}));

import { handleStripeEvent, parseStripeEvent } from "@/lib/stripe-webhook";

const subscription = {
  id: "sub_1",
  object: "subscription",
  customer: "cus_1",
  status: "active",
  cancel_at_period_end: false,
  metadata: { userId: "user-1" },
  items: {
    data: [{ price: { id: "price_monthly" }, current_period_end: 1_800_000_000 }],
  },
} as unknown as Stripe.Subscription;

const stripe = {
  webhooks: { constructEvent: vi.fn() },
  subscriptions: { retrieve: vi.fn() },
};

function makeEvent(type: string, object: unknown): Stripe.Event {
  return {
    id: "evt_1",
    object: "event",
    type,
    data: { object },
  } as unknown as Stripe.Event;
}

beforeEach(() => {
  mocks.getStripe.mockReturnValue(stripe);
  stripe.webhooks.constructEvent.mockReturnValue(makeEvent("ping", {}));
  stripe.subscriptions.retrieve.mockResolvedValue(subscription);
  mocks.syncStripeSubscription.mockResolvedValue(undefined);
  mocks.clearStripeSubscription.mockResolvedValue(undefined);
});

describe("parseStripeEvent", () => {
  it("verifies the payload with the signing secret", () => {
    const event = parseStripeEvent("payload", "signature", "whsec_test");

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      "payload",
      "signature",
      "whsec_test",
    );
    expect(event.type).toBe("ping");
  });
});

describe("handleStripeEvent", () => {
  it("ignores unknown event types", async () => {
    await handleStripeEvent(makeEvent("customer.created", {}));

    expect(mocks.syncStripeSubscription).not.toHaveBeenCalled();
    expect(mocks.clearStripeSubscription).not.toHaveBeenCalled();
  });

  it("ignores non-subscription checkout sessions", async () => {
    await handleStripeEvent(
      makeEvent("checkout.session.completed", {
        mode: "payment",
        subscription: "sub_1",
      }),
    );

    expect(mocks.syncStripeSubscription).not.toHaveBeenCalled();
  });

  it("ignores subscription checkouts without a subscription", async () => {
    await handleStripeEvent(
      makeEvent("checkout.session.completed", {
        mode: "subscription",
        subscription: null,
      }),
    );

    expect(mocks.syncStripeSubscription).not.toHaveBeenCalled();
  });

  it("retrieves and syncs a checkout subscription with replace: true", async () => {
    await handleStripeEvent(
      makeEvent("checkout.session.completed", {
        mode: "subscription",
        subscription: "sub_1",
        client_reference_id: "user-1",
      }),
    );

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(mocks.syncStripeSubscription).toHaveBeenCalledWith(subscription, {
      userId: "user-1",
      replace: true,
    });
  });

  it("syncs an already-expanded checkout subscription without retrieving it", async () => {
    await handleStripeEvent(
      makeEvent("checkout.session.completed", {
        mode: "subscription",
        subscription,
        client_reference_id: "user-1",
      }),
    );

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mocks.syncStripeSubscription).toHaveBeenCalledWith(subscription, {
      userId: "user-1",
      replace: true,
    });
  });

  it("syncs subscription created and updated events", async () => {
    await handleStripeEvent(
      makeEvent("customer.subscription.created", subscription),
    );
    await handleStripeEvent(
      makeEvent("customer.subscription.updated", subscription),
    );

    expect(mocks.syncStripeSubscription).toHaveBeenCalledTimes(2);
    expect(mocks.syncStripeSubscription).toHaveBeenNthCalledWith(
      1,
      subscription,
    );
    expect(mocks.syncStripeSubscription).toHaveBeenNthCalledWith(
      2,
      subscription,
    );
  });

  it("clears the subscription on delete", async () => {
    await handleStripeEvent(
      makeEvent("customer.subscription.deleted", subscription),
    );

    expect(mocks.clearStripeSubscription).toHaveBeenCalledWith(subscription);
    expect(mocks.syncStripeSubscription).not.toHaveBeenCalled();
  });

  it("propagates handler errors so the route can return 500", async () => {
    mocks.syncStripeSubscription.mockRejectedValue(new Error("db down"));

    await expect(
      handleStripeEvent(
        makeEvent("customer.subscription.updated", subscription),
      ),
    ).rejects.toThrow("db down");
  });
});
