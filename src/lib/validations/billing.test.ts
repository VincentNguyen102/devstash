import { describe, expect, it } from "vitest";

import { billingIntervalSchema } from "@/lib/validations/billing";

describe("billingIntervalSchema", () => {
  it("accepts the supported intervals", () => {
    expect(billingIntervalSchema.safeParse("monthly").success).toBe(true);
    expect(billingIntervalSchema.safeParse("yearly").success).toBe(true);
  });

  it("rejects unsupported intervals", () => {
    expect(billingIntervalSchema.safeParse("weekly").success).toBe(false);
  });

  it("rejects empty and non-string values", () => {
    expect(billingIntervalSchema.safeParse("").success).toBe(false);
    expect(billingIntervalSchema.safeParse(null).success).toBe(false);
    expect(billingIntervalSchema.safeParse(undefined).success).toBe(false);
    expect(billingIntervalSchema.safeParse(8).success).toBe(false);
  });
});
