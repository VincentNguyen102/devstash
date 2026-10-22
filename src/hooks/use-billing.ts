"use client";

import { createContext, useContext } from "react";

import type { BillingEntitlements } from "@/lib/usage-limits";

/** Context backing billing entitlements; provided by `BillingProvider`. */
export const BillingContext = createContext<BillingEntitlements | null>(null);

/**
 * Read the signed-in user's plan and usage from any client component. The
 * values are seeded by the `(dashboard)` server layout and refreshed by
 * `router.refresh()` after creates.
 */
export function useBilling(): BillingEntitlements {
  const context = useContext(BillingContext);

  if (!context) {
    throw new Error("useBilling must be used within a BillingProvider");
  }

  return context;
}
