import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getStripeCustomerId, syncStripeSubscription } from "@/lib/db/billing";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe redirects here after Checkout. The webhook remains the source of
 * truth; this route closes the race where the redirect beats the webhook.
 */
export async function GET(request: Request) {
  const session = await auth();
  const settingsUrl = new URL("/settings", request.url);

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const sessionId = new URL(request.url).searchParams.get("session_id");

  if (!sessionId) {
    settingsUrl.searchParams.set("checkout", "error");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const customerId =
      typeof checkout.customer === "string"
        ? checkout.customer
        : (checkout.customer?.id ?? null);
    const storedCustomerId = await getStripeCustomerId(session.user.id);
    const belongsToUser =
      checkout.client_reference_id === session.user.id ||
      (storedCustomerId !== null && customerId === storedCustomerId);

    let synced = false;

    if (belongsToUser && checkout.subscription) {
      const subscription =
        typeof checkout.subscription === "string"
          ? await stripe.subscriptions.retrieve(checkout.subscription)
          : checkout.subscription;

      await syncStripeSubscription(subscription, {
        userId: session.user.id,
        replace: true,
      });
      synced = true;
    }

    settingsUrl.searchParams.set("checkout", synced ? "success" : "pending");
  } catch (error) {
    console.error("Checkout reconciliation failed", error);
    settingsUrl.searchParams.set("checkout", "pending");
  }

  return NextResponse.redirect(settingsUrl);
}
