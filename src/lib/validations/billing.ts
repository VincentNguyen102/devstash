import { z } from "zod";

import { BILLING_INTERVALS } from "@/lib/billing";

export const billingIntervalSchema = z.enum([...BILLING_INTERVALS]);

export type BillingIntervalInput = z.input<typeof billingIntervalSchema>;
