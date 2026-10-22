import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getBillingEntitlements: vi.fn(),
  getStripeCustomerId: vi.fn(),
  setStripeCustomerId: vi.fn(),
  getAppUrl: vi.fn(),
  getProPriceId: vi.fn(),
  getStripe: vi.fn(),
  isStripeConfigured: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));

vi.mock("@/lib/db/billing", () => ({
  getBillingEntitlements: mocks.getBillingEntitlements,
  getStripeCustomerId: mocks.getStripeCustomerId,
  setStripeCustomerId: mocks.setStripeCustomerId,
}));

vi.mock("@/lib/app-url", () => ({ getAppUrl: mocks.getAppUrl }));

vi.mock("@/lib/stripe", () => ({
  getProPriceId: mocks.getProPriceId,
  getStripe: mocks.getStripe,
  isStripeConfigured: mocks.isStripeConfigured,
}));

import {
  createCheckoutSession,
  createPortalSession,
} from "@/actions/billing";

const stripe = {
  customers: { create: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  billingPortal: { sessions: { create: vi.fn() } },
};

beforeEach(() => {
  mocks.auth.mockResolvedValue({
    user: { id: "user-1", email: "user@example.com", name: "Test User" },
  });
  mocks.isStripeConfigured.mockReturnValue(true);
  mocks.getAppUrl.mockReturnValue("https://devstash.test");
  mocks.getProPriceId.mockImplementation((interval: string) =>
    interval === "monthly" ? "price_monthly" : "price_yearly",
  );
  mocks.getBillingEntitlements.mockResolvedValue({
    isPro: false,
    itemCount: 0,
    collectionCount: 0,
  });
  mocks.getStripeCustomerId.mockResolvedValue("cus_1");
  mocks.setStripeCustomerId.mockResolvedValue(undefined);
  mocks.getStripe.mockReturnValue(stripe);
  stripe.customers.create.mockResolvedValue({ id: "cus_new" });
  stripe.checkout.sessions.create.mockResolvedValue({
    url: "https://checkout.stripe.test/session",
  });
  stripe.billingPortal.sessions.create.mockResolvedValue({
    url: "https://billing.stripe.test/session",
  });
});

describe("createCheckoutSession", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid interval", async () => {
    const result = await createCheckoutSession("weekly" as never);

    expect(result).toEqual({
      success: false,
      error: "Invalid billing interval.",
    });
  });

  it("returns a configuration error before calling Stripe", async () => {
    mocks.isStripeConfigured.mockReturnValue(false);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "Billing is not configured yet.",
    });
    expect(mocks.getStripe).not.toHaveBeenCalled();
  });

  it("rejects a user who is already Pro", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: true,
      itemCount: 0,
      collectionCount: 0,
    });

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "You are already on the Pro plan.",
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("reuses an existing Stripe customer", async () => {
    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: true,
      data: { url: "https://checkout.stripe.test/session" },
    });
    expect(stripe.customers.create).not.toHaveBeenCalled();
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        customer: "cus_1",
        client_reference_id: "user-1",
        line_items: [{ price: "price_monthly", quantity: 1 }],
        success_url:
          "https://devstash.test/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://devstash.test/settings?checkout=cancelled",
      }),
    );
  });

  it("creates and persists a customer when needed", async () => {
    mocks.getStripeCustomerId.mockResolvedValue(null);

    const result = await createCheckoutSession("yearly");

    expect(result.success).toBe(true);
    expect(stripe.customers.create).toHaveBeenCalledWith(
      {
        email: "user@example.com",
        name: "Test User",
        metadata: { userId: "user-1" },
      },
      { idempotencyKey: "devstash-customer-user-1" },
    );
    expect(mocks.setStripeCustomerId).toHaveBeenCalledWith("user-1", "cus_new");
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new",
        line_items: [{ price: "price_yearly", quantity: 1 }],
      }),
    );
  });

  it("returns a generic error when Stripe fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    stripe.checkout.sessions.create.mockRejectedValue(new Error("boom"));

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });

  it("returns an error when the account is missing", async () => {
    mocks.getBillingEntitlements.mockResolvedValue(null);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: false, error: "Account not found." });
  });
});

describe("createPortalSession", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await createPortalSession();

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
  });

  it("returns a configuration error before calling Stripe", async () => {
    mocks.isStripeConfigured.mockReturnValue(false);

    const result = await createPortalSession();

    expect(result).toEqual({
      success: false,
      error: "Billing is not configured yet.",
    });
  });

  it("requires an existing Stripe customer", async () => {
    mocks.getStripeCustomerId.mockResolvedValue(null);

    const result = await createPortalSession();

    expect(result).toEqual({
      success: false,
      error: "You don't have a billing account yet.",
    });
  });

  it("returns the Customer Portal URL", async () => {
    const result = await createPortalSession();

    expect(result).toEqual({
      success: true,
      data: { url: "https://billing.stripe.test/session" },
    });
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "https://devstash.test/settings",
    });
  });

  it("returns a generic error when Stripe fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    stripe.billingPortal.sessions.create.mockRejectedValue(new Error("boom"));

    const result = await createPortalSession();

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});
