import { describe, expect, it } from "vitest";

import {
  BILLING_INTERVALS,
  PRO_PLANS,
  PRO_SUBSCRIPTION_STATUSES,
  isBillingInterval,
  isProSubscriptionStatus,
  isStaleSubscriptionEvent,
} from "@/lib/billing";

describe("BILLING_INTERVALS", () => {
  it("sells monthly and yearly plans", () => {
    expect(BILLING_INTERVALS).toEqual(["monthly", "yearly"]);
  });

  it("guards untrusted interval values", () => {
    expect(isBillingInterval("monthly")).toBe(true);
    expect(isBillingInterval("yearly")).toBe(true);
    expect(isBillingInterval("weekly")).toBe(false);
    expect(isBillingInterval("")).toBe(false);
    expect(isBillingInterval(null)).toBe(false);
    expect(isBillingInterval(undefined)).toBe(false);
    expect(isBillingInterval(8)).toBe(false);
  });
});

describe("PRO_PLANS", () => {
  it("uses the agreed prices in cents", () => {
    expect(PRO_PLANS.monthly.amount).toBe(800);
    expect(PRO_PLANS.yearly.amount).toBe(7200);
  });

  it("exposes display labels and periods", () => {
    expect(PRO_PLANS.monthly.label).toBe("$8");
    expect(PRO_PLANS.monthly.period).toBe("/ month");
    expect(PRO_PLANS.yearly.label).toBe("$72");
    expect(PRO_PLANS.yearly.period).toBe("/ year");
  });
});

describe("isProSubscriptionStatus", () => {
  it("grants Pro for active, trialing and past_due", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      expect(isProSubscriptionStatus(status)).toBe(true);
    }
  });

  it("revokes Pro for inactive statuses", () => {
    for (const status of [
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
    ]) {
      expect(isProSubscriptionStatus(status)).toBe(false);
    }
  });

  it("treats missing statuses as not Pro", () => {
    expect(isProSubscriptionStatus(null)).toBe(false);
    expect(isProSubscriptionStatus(undefined)).toBe(false);
    expect(isProSubscriptionStatus("")).toBe(false);
  });

  it("keeps the statuses in one place", () => {
    expect(PRO_SUBSCRIPTION_STATUSES).toEqual([
      "active",
      "trialing",
      "past_due",
    ]);
  });
});

describe("isStaleSubscriptionEvent", () => {
  it("is not stale when the user has no current subscription", () => {
    expect(isStaleSubscriptionEvent(null, "sub_1")).toBe(false);
  });

  it("is not stale for the current subscription", () => {
    expect(isStaleSubscriptionEvent("sub_1", "sub_1")).toBe(false);
  });

  it("is stale for a different subscription", () => {
    expect(isStaleSubscriptionEvent("sub_1", "sub_2")).toBe(true);
  });
});
