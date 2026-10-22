import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  deleteUser: vi.fn(),
  getStripe: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      delete: mocks.deleteUser,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({ getStripe: mocks.getStripe }));

import { deleteAccount } from "@/actions/profile";

const stripe = {
  subscriptions: {
    retrieve: vi.fn(),
    cancel: vi.fn(),
  },
};

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
  mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
  mocks.findUnique.mockResolvedValue({ stripeSubscriptionId: null });
  mocks.deleteUser.mockResolvedValue({ id: "user-1" });
  mocks.getStripe.mockReturnValue(stripe);
  stripe.subscriptions.retrieve.mockResolvedValue({
    id: "sub_1",
    status: "active",
  });
  stripe.subscriptions.cancel.mockResolvedValue({ id: "sub_1" });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("deleteAccount", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await deleteAccount();

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes an account without a subscription without calling Stripe", async () => {
    const result = await deleteAccount();

    expect(result).toEqual({ success: true });
    expect(mocks.getStripe).not.toHaveBeenCalled();
    expect(mocks.deleteUser).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("cancels an active subscription before deleting", async () => {
    mocks.findUnique.mockResolvedValue({ stripeSubscriptionId: "sub_1" });

    const result = await deleteAccount();

    expect(result).toEqual({ success: true });
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith("sub_1");
    expect(mocks.deleteUser).toHaveBeenCalled();
  });

  it("does not cancel an already-canceled subscription", async () => {
    mocks.findUnique.mockResolvedValue({ stripeSubscriptionId: "sub_1" });
    stripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_1",
      status: "canceled",
    });

    const result = await deleteAccount();

    expect(result).toEqual({ success: true });
    expect(stripe.subscriptions.cancel).not.toHaveBeenCalled();
    expect(mocks.deleteUser).toHaveBeenCalled();
  });

  it("blocks deletion when Stripe cancellation fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.findUnique.mockResolvedValue({ stripeSubscriptionId: "sub_1" });
    stripe.subscriptions.cancel.mockRejectedValue(new Error("stripe down"));

    const result = await deleteAccount();

    expect(result).toEqual({
      success: false,
      error:
        "We couldn't cancel your subscription. Please try again, or manage billing first.",
    });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
