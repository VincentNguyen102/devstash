# Stripe Integration — Phase 1: Core Infrastructure

## Overview

Build the data model, configuration and pure utility layer for DevStash Pro subscriptions. Phase 1 adds no Stripe API calls, no webhook route, no feature-gating enforcement and no billing UI. Everything here can be implemented and unit tested without a Stripe account or the Stripe CLI.

Phase 2 (integration and UI) builds on this foundation.

Reference: `docs/stripe-integration-plan.md` (§5–§7).

## Scope

### In scope

- Add the Stripe subscription fields to `User` and create the Prisma migration.
- Add the `stripe` dependency and document the Stripe environment variables.
- Extract `getAppUrl()` into a neutral module.
- Create the **usage-limits module** and its unit tests.
- Create the billing/plan constants and subscription-status helpers.
- Create the lazy Stripe client and price-ID helpers.
- Create the pure `subscriptionSnapshot` mapper.
- Create the `src/lib/db/billing.ts` read/write helpers.
- Sync `isPro` into the Auth.js session on every session read.

### Out of scope (Phase 2)

- Checkout and Customer Portal server actions.
- The webhook route and event handling.
- Feature-gating enforcement in `createItem`, `createCollection` or `/api/upload`.
- The settings `BillingCard`, billing context/providers and create-dialog gating.
- Stripe Dashboard product/webhook/portal setup and Stripe CLI testing.
- Account-deletion subscription cancellation.

## Prerequisites and decisions

Before starting, confirm these product decisions. They affect the constants and tests in this phase:

| Decision | Default for this spec | Notes |
| --- | --- | --- |
| File/image items are Pro-only? | Both `file` and `image` are Pro (`PRO_ONLY_TYPE_IDS = ["file", "image"]`) | `context/project-overview.md` lists image uploads under Free, but the sidebar marks both as PRO. Confirm before implementing. |
| `past_due` grants Pro? | Yes, as a payment-retry grace period | `PRO_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"]`. Remove `past_due` for immediate revocation. |
| Trial? | No trial | The homepage says "Start 14-day trial" but the project spec does not define one. Phase 2 will use no `trial_period_days`. |
| Monthly/yearly prices | $8.00 USD monthly, $72.00 USD yearly | Stripe amounts are in cents: `800` and `7200`. |

The database migration is DDL. Per `AGENTS.md`, ask for approval before running it, and target only the development branch (`br-twilight-wind-b3lrs3kz`) — never production.

## Database changes

`isPro` already exists. The migration adds the other four columns and makes the two existing Stripe ID columns unique. The full billing block looks like this:

```prisma
model User {
  // existing fields...

  isPro                    Boolean   @default(false)
  stripeCustomerId         String?   @unique
  stripeSubscriptionId     String?   @unique
  stripePriceId            String?
  stripeSubscriptionStatus String?
  stripeCurrentPeriodEnd   DateTime?
  stripeCancelAtPeriodEnd  Boolean   @default(false)
}
```

Field purposes:

| Field | Purpose |
| --- | --- |
| `isPro` | Fast entitlement flag. Only webhook/reconciliation code (Phase 2) sets it. |
| `stripeCustomerId` | Maps a Stripe customer to a user. Unique so lookups are unambiguous. |
| `stripeSubscriptionId` | Current subscription. Used to ignore events for replaced subscriptions. |
| `stripePriceId` | Monthly vs yearly display. |
| `stripeSubscriptionStatus` | Stripe status (`active`, `trialing`, `past_due`, …). |
| `stripeCurrentPeriodEnd` | Renewal date / access-until date. |
| `stripeCancelAtPeriodEnd` | "Cancels on …" copy. |

Create the migration with Prisma (never `db push`):

```bash
npx prisma migrate dev --name add_stripe_billing_fields
npm run db:generate
```

Verify with `npm run db:status`. Existing rows have `NULL` in both unique columns; PostgreSQL allows multiple `NULL`s in a unique index, so this is safe.

## Dependencies and environment

Install the Stripe Node SDK:

```bash
npm install stripe@^23.0.0
```

stripe-node v23 targets API version `2026-09-30.endive` and requires Node 20+ (the project runs Node 24).

`.env.example` already contains Stripe placeholders. Use these names consistently:

```bash
# Stripe (https://dashboard.stripe.com) — DevStash Pro subscriptions.
# Server-only secret key. Never prefix with NEXT_PUBLIC_.
STRIPE_SECRET_KEY=
# Publishable key. Not required for hosted Checkout; reserve it for Stripe.js.
STRIPE_PUBLISHABLE_KEY=
# Webhook signing secret (Dashboard -> Developers -> Webhooks, or `stripe listen`).
# Used by Phase 2.
STRIPE_WEBHOOK_SECRET=
# Recurring price IDs from the DevStash Pro product.
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
```

`STRIPE_PUBLISHABLE_KEY` is optional for this integration because Checkout is hosted. Do not remove it if it is already in `.env.example`, but do not add Stripe.js just to use it.

Put test-mode values in `.env`. Add the same variables to Vercel when Phase 2 is deployed. The app must build without any of these set.

## Files to create

### 1. `src/lib/app-url.ts`

Move `getAppUrl()` out of `src/lib/email-verification.ts` so billing does not import email code. Keep the existing behaviour:

```ts
export function getAppUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  return (configured ?? "http://localhost:3000").replace(/\/+$/, "");
}
```

### 2. `src/lib/usage-limits.ts` — usage-limits module

This is the module the Phase 1 tests target. The plan groups these rules in `src/lib/billing.ts`; split the pure limit rules into `src/lib/usage-limits.ts` so they can be tested and imported by client components without any billing/Stripe code. Keep the plan metadata and subscription-status helpers in `src/lib/billing.ts` (next file).

Export:

- `FREE_ITEM_LIMIT = 50`
- `FREE_COLLECTION_LIMIT = 3`
- `PRO_ONLY_TYPE_IDS = ["file", "image"] as const`
- `ProOnlyTypeId`
- `isProOnlyTypeId(typeId: string)`
- `BillingEntitlements` — `{ isPro: boolean; itemCount: number; collectionCount: number }`
- `LimitCheck` — `{ allowed: true } | { allowed: false; error: string }`
- `checkItemLimit`
- `checkCollectionLimit`
- `checkItemType`
- `checkItemCreation`

Implementation:

```ts
/**
 * Free/Pro usage rules. Framework, database and Stripe free so this module can
 * be imported by server actions, route handlers, client components and Vitest.
 */

/** Maximum number of items a Free account may own. */
export const FREE_ITEM_LIMIT = 50;

/** Maximum number of collections a Free account may own. */
export const FREE_COLLECTION_LIMIT = 3;

/** System item types reserved for Pro accounts. */
export const PRO_ONLY_TYPE_IDS = ["file", "image"] as const;

export type ProOnlyTypeId = (typeof PRO_ONLY_TYPE_IDS)[number];

export function isProOnlyTypeId(typeId: string): typeId is ProOnlyTypeId {
  return (PRO_ONLY_TYPE_IDS as readonly string[]).includes(typeId);
}

export interface BillingEntitlements {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
}

export type LimitCheck =
  | { allowed: true }
  | { allowed: false; error: string };

export function checkItemLimit({
  isPro,
  itemCount,
}: Pick<BillingEntitlements, "isPro" | "itemCount">): LimitCheck {
  if (isPro || itemCount < FREE_ITEM_LIMIT) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: `You've reached the Free plan limit of ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`,
  };
}

export function checkCollectionLimit({
  isPro,
  collectionCount,
}: Pick<BillingEntitlements, "isPro" | "collectionCount">): LimitCheck {
  if (isPro || collectionCount < FREE_COLLECTION_LIMIT) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: `You've reached the Free plan limit of ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
  };
}

export function checkItemType(typeId: string, isPro: boolean): LimitCheck {
  if (isPro || !isProOnlyTypeId(typeId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "This item type is a Pro feature. Upgrade to Pro to add it.",
  };
}

/** Type check first, then the item-count check. */
export function checkItemCreation(
  typeId: string,
  entitlement: BillingEntitlements,
): LimitCheck {
  const typeCheck = checkItemType(typeId, entitlement.isPro);

  return typeCheck.allowed ? checkItemLimit(entitlement) : typeCheck;
}
```

Notes:

- Unknown/custom type ids are allowed by `checkItemType`; custom-type creation is a separate Pro gate that will be added when custom types ship.
- `checkItemCreation` returns the type error first, so a Free user at the item limit trying to create a file sees the Pro-type message, not the count message.
- Import `BillingEntitlements` from this module in Phase 2. Do not duplicate the limits.

### 3. `src/lib/billing.ts` — plan metadata and subscription rules

Keep the non-limit billing helpers here. Export:

- `BILLING_INTERVALS = ["monthly", "yearly"] as const`
- `BillingInterval`
- `isBillingInterval(value: unknown)`
- `PRO_PLANS` — monthly `{ amount: 800, label: "$8", period: "/ month", note: ... }`, yearly `{ amount: 7200, label: "$72", period: "/ year", note: ... }`
- `PRO_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const`
- `isProSubscriptionStatus(status: string | null | undefined)`
- `BillingOverview` — extends `BillingEntitlements` (import type from `@/lib/usage-limits`) with `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `stripeSubscriptionStatus`, `stripeCurrentPeriodEnd`, `stripeCancelAtPeriodEnd`
- `isStaleSubscriptionEvent(currentSubscriptionId, incomingSubscriptionId)`

`isStaleSubscriptionEvent` returns true when the user already has a different subscription id. Phase 2 uses it to ignore events for a subscription the user has replaced; checkout completion passes `replace: true` to override.

See `docs/stripe-integration-plan.md` §6.3 for the full code. Remove the usage-limit exports from that version; they now live in `usage-limits.ts`.

### 4. `src/lib/validations/billing.ts`

```ts
import { z } from "zod";

import { BILLING_INTERVALS } from "@/lib/billing";

export const billingIntervalSchema = z.enum([...BILLING_INTERVALS]);

export type BillingIntervalInput = z.input<typeof billingIntervalSchema>;
```

### 5. `src/lib/stripe.ts`

Server-only lazy Stripe client. Do not import this module from a `"use client"` file.

Export:

- `isStripeConfigured()` — true only when the secret key and both price IDs are set.
- `getStripe()` — lazily constructs `new Stripe(secret, { apiVersion: "2026-09-30.endive", maxNetworkRetries: 2 })`; throws when `STRIPE_SECRET_KEY` is missing.
- `getProPriceId(interval)` — reads `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`.
- `intervalForPriceId(priceId)` — maps a stored price ID back to `"monthly" | "yearly" | null`.

No Stripe network call happens at import time. `getStripe()` is not called anywhere in Phase 1; Phase 2 uses it.

See `docs/stripe-integration-plan.md` §6.5.

### 6. `src/lib/stripe-subscription.ts`

Pure mapper from a `Stripe.Subscription` to the fields stored on `User`:

```ts
export interface SubscriptionSnapshot {
  subscriptionId: string;
  customerId: string;
  status: string;
  isPro: boolean;
  priceId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}
```

`subscriptionSnapshot(subscription)`:

- Reads `subscription.items.data[0]` for `price.id` and `current_period_end`. In the current Stripe API, `current_period_end` is on subscription items, not on the subscription.
- Uses `isProSubscriptionStatus(subscription.status)` for `isPro`.
- Handles `subscription.customer` as either a string or an expanded object.
- Converts `current_period_end` to a `Date` with `new Date(seconds * 1000)`.

See `docs/stripe-integration-plan.md` §6.6.

### 7. `src/lib/db/billing.ts`

All billing reads and writes live here. Implement the full module now so Phase 2 only wires callers:

- `getBillingOverview(userId)` — `BillingOverview | null`; calls `connection()`; selects the billing fields plus `_count.items` and `_count.collections`.
- `getBillingEntitlements(userId)` — `BillingEntitlements | null`; no `connection()` (used by actions/routes).
- `getStripeCustomerId(userId)`
- `setStripeCustomerId(userId, customerId)`
- `syncStripeSubscription(subscription, { userId?, replace? })` — resolves the user by explicit id, then `subscription.metadata.userId`, then `stripeCustomerId`; ignores a replaced subscription unless `replace: true`; writes `isPro`, customer id, subscription id, price id, status, period end and cancel flag.
- `clearStripeSubscription(subscription)` — `updateMany` scoped by both `stripeCustomerId` and `stripeSubscriptionId`; sets `isPro: false`, clears the subscription/price/period and records the final status.

No unit tests for the Prisma helpers (project convention: DB helpers are browser/integration verified). Phase 2's webhook tests exercise the logic through mocks.

See `docs/stripe-integration-plan.md` §6.7.

## Files to modify

### `src/auth.ts`

Add an `async jwt` callback that always reads `isPro` from the database. Auth.js calls the JWT callback on every session read, so a page reload after a webhook update is enough. Extend the existing `session` callback to copy `token.isPro` onto `session.user.isPro`.

Include a `try/catch` that keeps the previous token value on a transient database failure.

See `docs/stripe-integration-plan.md` §4.5 and §7.2.

### `src/types/next-auth.d.ts`

- `Session.user` gains `isPro: boolean`.
- Augment `next-auth/jwt` with `JWT.isPro?: boolean`.

### `src/types/auth.ts`

Add `isPro?: boolean` to `AuthUser` so the dashboard layout can pass `session.user` through without a cast.

### `src/lib/email-verification.ts` and `src/lib/password-reset.ts`

Replace the local `getAppUrl` import with `@/lib/app-url`. No behaviour change.

## Unit tests

### Required: `src/lib/usage-limits.test.ts`

This is a Phase 1 deliverable. Cover every branch of the usage-limits module.

| Area | Test cases |
| --- | --- |
| Constants | `FREE_ITEM_LIMIT` is 50; `FREE_COLLECTION_LIMIT` is 3; `PRO_ONLY_TYPE_IDS` contains `file` and `image`. |
| `isProOnlyTypeId` | True for `file` and `image`; false for `snippet`, `prompt`, `command`, `note`, `url`, a custom id and an empty string. |
| `checkItemLimit` | Free at 0/49 → allowed; Free at 50/51 → denied and the message contains `50`; Pro at 0/50/10,000 → allowed. |
| `checkCollectionLimit` | Free at 0/2 → allowed; Free at 3/4 → denied and the message contains `3`; Pro at 3/10 → allowed. |
| `checkItemType` | Free text/link types → allowed; Free `file` and `image` → denied; Pro `file`/`image` → allowed; unknown/custom id → allowed. |
| `checkItemCreation` | Free file at 0 items → type error; Free file at 50 items → type error (type check wins); Free snippet at 49 → allowed; Free snippet at 50 → limit error; Pro file at 50 → allowed; Pro snippet at 10,000 → allowed. |

Example structure:

```ts
import { describe, expect, it } from "vitest";

import {
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  PRO_ONLY_TYPE_IDS,
  checkCollectionLimit,
  checkItemCreation,
  checkItemLimit,
  checkItemType,
  isProOnlyTypeId,
} from "@/lib/usage-limits";

describe("checkItemLimit", () => {
  it("allows a Free user under the limit", () => {
    expect(checkItemLimit({ isPro: false, itemCount: 49 })).toEqual({
      allowed: true,
    });
  });

  it("blocks a Free user at the limit", () => {
    const result = checkItemLimit({
      isPro: false,
      itemCount: FREE_ITEM_LIMIT,
    });

    expect(result.allowed).toBe(false);

    if (!result.allowed) {
      expect(result.error).toContain(String(FREE_ITEM_LIMIT));
    }
  });

  it("allows Pro users at any count", () => {
    expect(checkItemLimit({ isPro: true, itemCount: 10_000 })).toEqual({
      allowed: true,
    });
  });
});
```

Use the constants in assertions rather than hard-coded numbers where it improves readability; hard-code the boundary numbers in at least one test so a changed constant is caught.

### Additional tests

| File | Cases |
| --- | --- |
| `src/lib/billing.test.ts` | `isProSubscriptionStatus` true for `active`, `trialing`, `past_due`; false for `canceled`, `unpaid`, `incomplete`, `incomplete_expired`, `paused`, `null`, `undefined`. `isBillingInterval` true for `monthly`/`yearly`, false for `weekly`/empty/non-string. `PRO_PLANS` amounts 800/7200 and labels. `isStaleSubscriptionEvent` false for no current id and for the same id, true for a different id. |
| `src/lib/validations/billing.test.ts` | `billingIntervalSchema` accepts `monthly`/`yearly`; rejects `weekly`, `""`, `null` and numbers. |
| `src/lib/stripe-subscription.test.ts` | Active/trialing/past_due/canceled snapshots; `isPro` follows `isProSubscriptionStatus`; price and period end come from `items.data[0]`; missing items → `null` price/date; string vs expanded customer; `cancel_at_period_end` carried through. |
| `src/lib/stripe.test.ts` | `intervalForPriceId` maps the configured monthly/yearly ids and returns `null` for unknown/empty; `getProPriceId` returns the configured values and throws when missing. Use `vi.stubEnv` and restore env after each test. Do not call `getStripe()` against the network. |

Do not add component tests; components are Phase 2 and are browser-verified.

## Acceptance criteria

- [ ] `User` has the new billing fields and the migration is applied on the development branch (`npm run db:status`).
- [ ] `npm install` includes `stripe@^23`.
- [ ] `.env.example` documents all four Stripe variables; `.env` has test-mode values (or is empty and the app still builds).
- [ ] `src/lib/usage-limits.ts`, `src/lib/billing.ts`, `src/lib/validations/billing.ts`, `src/lib/stripe.ts`, `src/lib/stripe-subscription.ts` and `src/lib/db/billing.ts` exist with the APIs above.
- [ ] `src/lib/usage-limits.test.ts` covers every case in the required table.
- [ ] Additional pure-module tests pass.
- [ ] `auth()` returns `session.user.isPro` (default `false`); manually setting `User.isPro` in the dev DB and reloading the dashboard reflects the new value.
- [ ] `npm run test` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes with no Stripe environment variables set.
- [ ] No Stripe API calls, webhook routes, gating enforcement or billing UI are introduced in this phase.

## Verification commands

```bash
npm run test
npm run lint
npm run build
npm run db:status
```

Manual session check:

1. Sign in as the demo user.
2. Confirm the session has `user.isPro === false` (temporary server log or a throwaway server component).
3. Set `isPro = true` for the demo user in Prisma Studio.
4. Reload `/dashboard`.
5. Confirm the session now reports `isPro === true`.
6. Revert the database change.

## References

- `docs/stripe-integration-plan.md` §5 (schema), §6.3 (billing/limits), §6.5 (Stripe client), §6.6 (snapshot), §6.7 (DB helpers), §7.2–§7.4 (session/types), §7.15 (`getAppUrl`).
- `context/coding-standards.md` — lib/utility organization, Zod, testing.
- `context/ai-interaction.md` — testing scope and workflow.
- `AGENTS.md` — migration approval and Neon development-branch rules.
