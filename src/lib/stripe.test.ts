import { afterEach, describe, expect, it, vi } from "vitest";

import { getProPriceId, intervalForPriceId } from "@/lib/stripe";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("intervalForPriceId", () => {
  it("maps the configured price ids", () => {
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");

    expect(intervalForPriceId("price_monthly")).toBe("monthly");
    expect(intervalForPriceId("price_yearly")).toBe("yearly");
  });

  it("returns null for unknown and empty price ids", () => {
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");

    expect(intervalForPriceId("price_unknown")).toBeNull();
    expect(intervalForPriceId("")).toBeNull();
    expect(intervalForPriceId(null)).toBeNull();
  });
});

describe("getProPriceId", () => {
  it("returns the configured price ids", () => {
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");

    expect(getProPriceId("monthly")).toBe("price_monthly");
    expect(getProPriceId("yearly")).toBe("price_yearly");
  });

  it("throws when a price id is missing", () => {
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "");

    expect(() => getProPriceId("monthly")).toThrow("STRIPE_PRICE_ID_MONTHLY");
    expect(() => getProPriceId("yearly")).toThrow("STRIPE_PRICE_ID_YEARLY");
  });
});
