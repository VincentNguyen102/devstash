"use server";

import { auth } from "@/auth";
import { getAppUrl } from "@/lib/app-url";
import {
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
      const customer = await stripe.customers.create(
        {
          email: session.user.email ?? undefined,
          name: session.user.name ?? undefined,
          metadata: { userId: session.user.id },
        },
        { idempotencyKey: `devstash-customer-${session.user.id}` },
      );

      customerId = customer.id;
      await setStripeCustomerId(session.user.id, customerId);
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: session.user.id,
      line_items: [{ price: getProPriceId(parsed.data), quantity: 1 }],
      success_url: `${getAppUrl()}/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/settings?checkout=cancelled`,
      metadata: { userId: session.user.id, plan: "pro" },
      subscription_data: {
        metadata: { userId: session.user.id, plan: "pro" },
      },
    });

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
