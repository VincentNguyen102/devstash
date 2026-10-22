import { connection } from "next/server";
import type Stripe from "stripe";

import {
  isStaleSubscriptionEvent,
  type BillingOverview,
} from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { subscriptionSnapshot } from "@/lib/stripe-subscription";
import type { BillingEntitlements } from "@/lib/usage-limits";

/** Billing + usage summary for the settings page. */
export async function getBillingOverview(
  userId: string,
): Promise<BillingOverview | null> {
  await connection();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeSubscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
      stripeCancelAtPeriodEnd: true,
      _count: { select: { items: true, collections: true } },
    },
  });

  if (!user) return null;

  return {
    isPro: user.isPro,
    itemCount: user._count.items,
    collectionCount: user._count.collections,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripePriceId: user.stripePriceId,
    stripeSubscriptionStatus: user.stripeSubscriptionStatus,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    stripeCancelAtPeriodEnd: user.stripeCancelAtPeriodEnd,
  };
}

/** Lightweight entitlement snapshot for action-level gating. */
export async function getBillingEntitlements(
  userId: string,
): Promise<BillingEntitlements | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      _count: { select: { items: true, collections: true } },
    },
  });

  if (!user) return null;

  return {
    isPro: user.isPro,
    itemCount: user._count.items,
    collectionCount: user._count.collections,
  };
}

export async function getStripeCustomerId(
  userId: string,
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  return user?.stripeCustomerId ?? null;
}

export async function setStripeCustomerId(
  userId: string,
  customerId: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customerId },
  });
}

/** Clears a stale customer reference (e.g. the customer was deleted in Stripe). */
export async function clearStripeCustomerId(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: null },
  });
}

/** Resolve the DevStash user for a Stripe subscription. */
async function findUserForSubscription(
  subscription: Stripe.Subscription,
  userId?: string,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, stripeSubscriptionId: true },
    });

    if (user) return user;
  }

  const metadataUserId = subscription.metadata.userId;

  if (metadataUserId) {
    const user = await prisma.user.findUnique({
      where: { id: metadataUserId },
      select: { id: true, stripeSubscriptionId: true },
    });

    if (user) return user;
  }

  return prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true, stripeSubscriptionId: true },
  });
}

/**
 * Writes a subscription snapshot to the owning user. Used by the webhook and
 * by the checkout return route. Idempotent: replaying the same event produces
 * the same row state.
 *
 * `replace` is only true for a deliberate new purchase (checkout completed or
 * the return reconciliation). Ordinary subscription events for an older
 * subscription are ignored, so a stale event cannot overwrite the current one.
 */
export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  options: { userId?: string; replace?: boolean } = {},
): Promise<void> {
  const snapshot = subscriptionSnapshot(subscription);
  const user = await findUserForSubscription(subscription, options.userId);

  if (!user) {
    console.warn(
      `No DevStash user found for Stripe subscription ${subscription.id}`,
    );
    return;
  }

  if (
    !options.replace &&
    isStaleSubscriptionEvent(user.stripeSubscriptionId, subscription.id)
  ) {
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: snapshot.isPro,
      stripeCustomerId: snapshot.customerId,
      stripeSubscriptionId: snapshot.subscriptionId,
      stripePriceId: snapshot.priceId,
      stripeSubscriptionStatus: snapshot.status,
      stripeCurrentPeriodEnd: snapshot.currentPeriodEnd,
      stripeCancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
    },
  });
}

/**
 * Clears the entitlement when the current subscription ends. The
 * `stripeSubscriptionId` filter means a late `deleted` event for an old
 * subscription cannot revoke a newer one.
 */
export async function clearStripeSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const snapshot = subscriptionSnapshot(subscription);

  await prisma.user.updateMany({
    where: {
      stripeCustomerId: snapshot.customerId,
      stripeSubscriptionId: snapshot.subscriptionId,
    },
    data: {
      isPro: false,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeSubscriptionStatus: subscription.status,
      stripeCurrentPeriodEnd: null,
      stripeCancelAtPeriodEnd: false,
    },
  });
}
