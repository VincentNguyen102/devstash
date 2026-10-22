"use client";

import type { ReactNode } from "react";

import { BillingContext } from "@/hooks/use-billing";
import type { BillingEntitlements } from "@/lib/usage-limits";

interface BillingProviderProps {
  children: ReactNode;
  /** Entitlements resolved on the server and passed down by the layout. */
  billing: BillingEntitlements;
}

/**
 * Makes the current plan and usage available to client components without a
 * SessionProvider or an extra client fetch. Mounted once in `DashboardShell`.
 */
export function BillingProvider({ children, billing }: BillingProviderProps) {
  return (
    <BillingContext.Provider value={billing}>
      {children}
    </BillingContext.Provider>
  );
}
