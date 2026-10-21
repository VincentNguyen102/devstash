"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { HomeLink } from "@/components/home/home-link";
import { Container, SectionHeading } from "@/components/home/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  HOME_PLANS,
  HOME_PRICING_HEADING,
  PRIMARY_CTA_CLASS,
  type BillingPeriod,
  type HomePlan,
} from "@/lib/homepage";
import { cn } from "@/lib/utils";

function PlanCard({
  plan,
  billing,
}: {
  plan: HomePlan;
  billing: BillingPeriod;
}) {
  const price =
    billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const period =
    billing === "monthly" ? plan.monthlyPeriod : plan.yearlyPeriod;
  const note = billing === "monthly" ? plan.monthlyNote : plan.yearlyNote;

  return (
    <Card
      data-reveal
      className={cn(
        "relative h-full gap-0 overflow-hidden rounded-2xl p-6 ring-0 [--card-spacing:0px]",
        plan.featured
          ? "border border-indigo-400/40 bg-gradient-to-b from-indigo-500/10 to-card shadow-[0_24px_80px_-40px_rgba(99,102,241,0.7)]"
          : "border border-border/70 bg-white/[0.02]",
      )}
    >
      {plan.featured ? (
        <Badge className="absolute top-4 right-4 rounded-full bg-indigo-500 px-2.5 text-[0.65rem] text-white">
          Most Popular
        </Badge>
      ) : null}

      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

      <div aria-live="polite" className="mt-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-semibold tracking-[-0.04em]">
            {price}
          </span>
          <span className="pb-1 text-sm text-muted-foreground">{period}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </div>

      <Button
        asChild
        variant={plan.featured ? "default" : "outline"}
        size="lg"
        className={cn(
          "mt-6 h-10 w-full",
          plan.featured && PRIMARY_CTA_CLASS,
        )}
      >
        <HomeLink href={plan.href}>{plan.cta}</HomeLink>
      </Button>

      <ul className="mt-6 space-y-2.5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Check aria-hidden className="size-4 shrink-0 text-green-400" />
            {feature}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function PricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="scroll-mt-24 py-24"
    >
      <Container>
        <SectionHeading
          id="pricing-title"
          eyebrow={HOME_PRICING_HEADING.eyebrow}
          title={HOME_PRICING_HEADING.title}
          description={HOME_PRICING_HEADING.description}
        />

        <div data-reveal className="mt-8 flex justify-center">
          <div
            role="group"
            aria-label="Billing period"
            className="inline-flex rounded-full border border-border/80 bg-white/[0.03] p-1"
          >
            <button
              type="button"
              aria-pressed={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                billing === "monthly"
                  ? "bg-white text-background shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-pressed={billing === "yearly"}
              onClick={() => setBilling("yearly")}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                billing === "yearly"
                  ? "bg-white text-background shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Yearly
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold",
                  billing === "yearly"
                    ? "bg-indigo-500/15 text-indigo-600"
                    : "bg-indigo-400/15 text-indigo-300",
                )}
              >
                Save 25%
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
          {HOME_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} billing={billing} />
          ))}
        </div>

        <p
          data-reveal
          className="mt-8 text-center text-xs text-muted-foreground"
        >
          All prices in USD. Yearly plan is billed once at $72.
        </p>
      </Container>
    </section>
  );
}
