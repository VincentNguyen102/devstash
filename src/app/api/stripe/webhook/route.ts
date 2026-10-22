import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { jsonError } from "@/lib/api";
import { handleStripeEvent, parseStripeEvent } from "@/lib/stripe-webhook";

// The Stripe SDK and signature verification need the Node runtime.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    console.error("Stripe webhook environment is not configured.");
    return jsonError("Webhook is not configured.", 500);
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return jsonError("Missing Stripe signature.", 400);
  }

  // The signature is computed over the raw body, so read text before any
  // parsing. Route handlers are not cached for POST requests.
  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = parseStripeEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return jsonError("Invalid Stripe signature.", 400);
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    // 500 tells Stripe to retry. Log the event id so a failure is traceable.
    console.error(
      `Stripe webhook handler failed (${event.type}, ${event.id})`,
      error,
    );
    return jsonError("Webhook handler failed.", 500);
  }

  return NextResponse.json({ received: true });
}
