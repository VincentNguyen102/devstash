"use server";

import type Stripe from "stripe";

import { auth } from "@/auth";
import { getAppUrl } from "@/lib/app-url";
import type { BillingInterval } from "@/lib/billing";
import {
  clearStripeCustomerId,
  getBillingEntitlements,
  getStripeCustomerId,
  setStripeCustomerId,
} from "@/lib/db/billing";
import {
  getProPriceId,
  getStripe,
  isStripeConfigured,
} from "@/lib/stripe";
import {
  billingIntervalSchema,
  type BillingIntervalInput,
} from "@/lib/validations/billing";

export interface BillingRedirectResult {
  success: boolean;
  data?: { url: string };
  error?: string;
}

/** True when Stripe rejects a Checkout request because the customer is gone. */
function isMissingCustomerError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const { code, param } = error as { code?: unknown; param?: unknown };

  return code === "resource_missing" && param === "customer";
}

async function createStripeCustomer(
  stripe: Stripe,
  user: { id: string; email?: string | null; name?: string | null },
  idempotencyKey: string,
): Promise<string> {
  const customer = await stripe.customers.create(
    {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    },
    { idempotencyKey },
  );

  await setStripeCustomerId(user.id, customer.id);

  return customer.id;
}

function checkoutSessionParams(
  customerId: string,
  userId: string,
  interval: BillingInterval,
): Stripe.Checkout.SessionCreateParams {
  return {
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: getProPriceId(interval), quantity: 1 }],
    success_url: `${getAppUrl()}/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/settings?checkout=cancelled`,
    metadata: { userId, plan: "pro" },
    subscription_data: { metadata: { userId, plan: "pro" } },
  };
}

/**
 * Creates a Stripe Checkout Session for the chosen interval and returns its
 * hosted URL. The browser redirects to Stripe; the webhook grants Pro.
 */
export async function createCheckoutSession(
  interval: BillingIntervalInput,
): Promise<BillingRedirectResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  const parsed = billingIntervalSchema.safeParse(interval);

  if (!parsed.success) {
    return { success: false, error: "Invalid billing interval." };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: "Billing is not configured yet." };
  }

  try {
    const entitlement = await getBillingEntitlements(session.user.id);

    if (!entitlement) {
      return { success: false, error: "Account not found." };
    }

    if (entitlement.isPro) {
      return { success: false, error: "You are already on the Pro plan." };
    }

    const stripe = getStripe();
    let customerId = await getStripeCustomerId(session.user.id);

    if (!customerId) {
      // The idempotency key makes concurrent clicks return the same customer.
      customerId = await createStripeCustomer(
        stripe,
        session.user,
        `devstash-customer-${session.user.id}`,
      );
    }

    let checkout: Stripe.Checkout.Session;

    try {
      checkout = await stripe.checkout.sessions.create(
        checkoutSessionParams(customerId, session.user.id, parsed.data),
      );
    } catch (error) {
      if (!isMissingCustomerError(error)) {
        throw error;
      }

      // The stored customer was deleted (or Stripe returned a cached deleted
      // customer for the deterministic idempotency key). Clear the stale id,
      // create a fresh customer with a unique key, and retry once.
      await clearStripeCustomerId(session.user.id);
      customerId = await createStripeCustomer(
        stripe,
        session.user,
        `devstash-customer-${session.user.id}-${crypto.randomUUID()}`,
      );
      checkout = await stripe.checkout.sessions.create(
        checkoutSessionParams(customerId, session.user.id, parsed.data),
      );
    }

    if (!checkout.url) {
      return { success: false, error: "Couldn't start checkout." };
    }

    return { success: true, data: { url: checkout.url } };
  } catch (error) {
    console.error("Create checkout session failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

/**
 * Creates a Stripe Customer Portal session so the user can update their card,
 * download invoices, switch plans or cancel.
 */
export async function createPortalSession(): Promise<BillingRedirectResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: "Billing is not configured yet." };
  }

  try {
    const customerId = await getStripeCustomerId(session.user.id);

    if (!customerId) {
      return {
        success: false,
        error: "You don't have a billing account yet.",
      };
    }

    const portal = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/settings`,
    });

    return { success: true, data: { url: portal.url } };
  } catch (error) {
    console.error("Create billing portal session failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
