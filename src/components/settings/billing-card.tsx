"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PRO_PLANS,
  type BillingInterval,
  type BillingOverview,
} from "@/lib/billing";
import { formatMediumDate } from "@/lib/date";
import {
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
} from "@/lib/usage-limits";

interface BillingCardProps {
  billing: BillingOverview;
  /** Derived on the server with `intervalForPriceId(billing.stripePriceId)`. */
  stripeInterval: BillingInterval | null;
  /** `success` | `cancelled` | `pending` | `error` from the return URL. */
  checkoutStatus?: string | null;
}

export function BillingCard({
  billing,
  stripeInterval,
  checkoutStatus,
}: BillingCardProps) {
  const router = useRouter();
  const [pending, setPending] = useState<BillingInterval | "portal" | null>(
    null,
  );

  async function redirectTo(
    action: () => Promise<
      { success: boolean; data?: { url: string }; error?: string }
    >,
  ) {
    try {
      const result = await action();

      if (!result.success || !result.data?.url) {
        toast.error(result.error ?? "Couldn't open billing.");
        setPending(null);
        return;
      }

      window.location.assign(result.data.url);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setPending(null);
    }
  }

  async function startCheckout(interval: BillingInterval) {
    setPending(interval);
    await redirectTo(() => createCheckoutSession(interval));
  }

  async function openPortal() {
    setPending("portal");
    await redirectTo(() => createPortalSession());
  }

  return (
    <Card id="billing" className="scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Billing</CardTitle>
            <CardDescription>
              Manage your DevStash plan and payment details.
            </CardDescription>
          </div>
          <Badge variant={billing.isPro ? "default" : "outline"}>
            {billing.isPro ? "Pro" : "Free"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {billing.isPro &&
        (checkoutStatus === "success" || checkoutStatus === "pending") ? (
          <p className="rounded-lg border border-green-400/30 bg-green-400/10 p-3 text-sm text-green-300">
            Payment received. Your Pro access is active.
          </p>
        ) : null}

        {!billing.isPro &&
        (checkoutStatus === "pending" || checkoutStatus === "success") ? (
          <p className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-200">
            Payment received, but Stripe has not confirmed the subscription yet.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => router.refresh()}
            >
              Refresh status
            </button>
          </p>
        ) : null}

        {checkoutStatus === "cancelled" ? (
          <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Checkout was cancelled — you have not been charged.
          </p>
        ) : null}

        {checkoutStatus === "error" ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            We couldn&apos;t confirm the checkout. If you were charged, refresh
            this page or contact support.
          </p>
        ) : null}

        {billing.isPro ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              DevStash Pro
              {stripeInterval
                ? ` · ${stripeInterval === "monthly" ? "Monthly" : "Yearly"}`
                : ""}
            </p>
            {billing.stripeSubscriptionStatus === "past_due" ? (
              <p className="text-sm text-yellow-300">
                Your last payment failed. Update your payment method to keep
                Pro access.
              </p>
            ) : null}
            {billing.stripeCurrentPeriodEnd ? (
              <p className="text-sm text-muted-foreground">
                {billing.stripeCancelAtPeriodEnd
                  ? `Pro access ends on ${formatMediumDate(
                      billing.stripeCurrentPeriodEnd,
                    )}.`
                  : `Renews on ${formatMediumDate(
                      billing.stripeCurrentPeriodEnd,
                    )}.`}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Unlimited items and collections.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">{billing.itemCount}</span> /{" "}
                {FREE_ITEM_LIMIT} items
              </p>
              <p className="text-sm">
                <span className="font-medium">{billing.collectionCount}</span> /{" "}
                {FREE_COLLECTION_LIMIT} collections
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                disabled={pending !== null}
                onClick={() => void startCheckout("monthly")}
              >
                Upgrade — {PRO_PLANS.monthly.label}{" "}
                {PRO_PLANS.monthly.period}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending !== null}
                onClick={() => void startCheckout("yearly")}
              >
                Upgrade — {PRO_PLANS.yearly.label} {PRO_PLANS.yearly.period}
              </Button>
            </div>
          </div>
        )}

        {billing.stripeCustomerId ? (
          <>
            <Separator />
            <Button
              type="button"
              variant="outline"
              disabled={pending !== null}
              onClick={() => void openPortal()}
            >
              <CreditCard aria-hidden />
              {billing.isPro ? "Manage billing" : "Billing history"}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
