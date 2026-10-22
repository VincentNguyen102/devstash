# Stripe Integration — Phase 2: Integration & UI

## Overview

Wire the Phase 1 infrastructure into the product: Stripe Checkout, the Customer Portal, signed webhooks, server-side feature gating, and the billing UI. This phase talks to Stripe and is verified end-to-end with the Stripe CLI and test-mode cards.

Phase 1 must be complete before starting: schema/migration, `src/lib/usage-limits.ts`, `src/lib/billing.ts`, `src/lib/stripe.ts`, `src/lib/stripe-subscription.ts`, `src/lib/db/billing.ts`, and the session `isPro` sync.

Reference: `docs/stripe-integration-plan.md` (§4, §6.8–§6.14, §7.5–§7.14, §8–§11).

## Scope

### In scope

- Checkout and Customer Portal server actions.
- The signed Stripe webhook route and event handler.
- Checkout-return reconciliation route (required for the success flow).
- Server-side gating in `createItem`, `createCollection` and `/api/upload`.
- Billing context/provider and the settings `BillingCard`.
- Create-dialog and sidebar gating UI.
- Account-deletion subscription cancellation.
- Stripe Dashboard (test mode) setup and Stripe CLI verification.

### Out of scope

- AI, custom-type and export gating. These features do not exist yet; when they ship, reuse `getBillingEntitlements` and the helpers from `src/lib/usage-limits.ts`.
- Live-mode activation and real purchases (do test mode first; live mode is an ops step after acceptance).
- Tax, refunds, disputes and plan-change proration beyond what the Customer Portal provides.
- A separate `/settings/billing` route. Billing lives on `/settings`.

## Prerequisites

- Phase 1 merged and its tests passing.
- Stripe test-mode account with a **DevStash Pro** product:
  - Monthly price: `$8.00 USD` recurring monthly.
  - Yearly price: `$72.00 USD` recurring yearly.
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY` and `STRIPE_WEBHOOK_SECRET` in `.env`. (`STRIPE_PUBLISHABLE_KEY` is not used by hosted Checkout.)
- Stripe CLI installed and logged in.
- A throwaway test account (do not use the demo account for destructive billing tests).

## Stripe Dashboard setup (test mode)

Do this before running the app against Stripe:

1. **Product catalog** → add `DevStash Pro` with the two recurring prices above. Copy both `price_...` IDs into `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_YEARLY`.
2. **Developers → API keys** → copy the secret key (`sk_test_...`) to `STRIPE_SECRET_KEY`.
3. **Developers → Webhooks** → add endpoint `https://<your-domain>/api/stripe/webhook` (or use the CLI locally). Select:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the endpoint signing secret to `STRIPE_WEBHOOK_SECRET`. When using the CLI, use the `whsec_...` printed by `stripe listen` instead.
5. **Settings → Billing → Customer portal**:
   - Enable the portal.
   - Allow payment-method updates, invoice history and cancellation.
   - Set cancellation to **at the end of the billing period** by default.
   - Optionally allow monthly/yearly switching.
6. **Settings → Business → Branding** and **Billing → Emails**: add the DevStash name/support details and enable payment receipts if desired.
7. Keep everything in **test mode**. Live mode requires a separate product, prices, webhook endpoint and portal configuration.

## Server actions

### `src/actions/billing.ts`

Follow the existing `"use server"` + `auth()` + Zod + `{ success, data?, error? }` convention.

**`createCheckoutSession(interval)`**

1. `auth()`; return `"You must be signed in to do that."` when absent.
2. Validate with `billingIntervalSchema` from `src/lib/validations/billing.ts`.
3. Return `"Billing is not configured yet."` when `isStripeConfigured()` is false.
4. Read `getBillingEntitlements(userId)`; reject if the user is already Pro.
5. Reuse `getStripeCustomerId`, or create a customer with:
   - `email`, `name`, `metadata.userId`;
   - `{ idempotencyKey: \`devstash-customer-${userId}\` }` so concurrent clicks return the same customer.
   - Persist with `setStripeCustomerId`.
6. Create a Checkout Session:
   - `mode: "subscription"`, `customer`, `client_reference_id: userId`;
   - `line_items: [{ price: getProPriceId(interval), quantity: 1 }]`;
   - `success_url: \`${getAppUrl()}/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}\``;
   - `cancel_url: \`${getAppUrl()}/settings?checkout=cancelled\``;
   - `metadata` and `subscription_data.metadata` with `{ userId, plan: "pro" }`.
7. Return `{ success: true, data: { url: checkout.url } }`. The client redirects with `window.location.assign(url)`.
8. Catch Stripe errors, `console.error` the detail, and return the generic `"Something went wrong. Please try again."`.

**`createPortalSession()`**

1. `auth()` + `isStripeConfigured()` checks.
2. Read `getStripeCustomerId(userId)`; return `"You don't have a billing account yet."` when absent.
3. Create a `billingPortal.sessions.create` session with `return_url: \`${getAppUrl()}/settings\``.
4. Return `{ success: true, data: { url } }`.

See `docs/stripe-integration-plan.md` §6.8 for the full code. `isProSubscriptionStatus` is not used here.

## Webhooks

### `src/lib/stripe-webhook.ts`

Put the event logic in `src/lib` so it is unit-testable under the Vitest scope.

- `parseStripeEvent(payload, signature, secret)` wraps `getStripe().webhooks.constructEvent(...)`.
- `handleStripeEvent(event)` switches on:
  - `checkout.session.completed` — ignore non-subscription sessions or sessions without a subscription; resolve the subscription; call `syncStripeSubscription(subscription, { userId: checkout.client_reference_id ?? undefined, replace: true })`.
  - `customer.subscription.created` / `customer.subscription.updated` — call `syncStripeSubscription(subscription)`.
  - `customer.subscription.deleted` — call `clearStripeSubscription(subscription)`.
  - Default — return without error so the route acknowledges unknown events with a 200.
- Stripe's `Event` type does not narrow `data.object` by `event.type`; cast with `as Stripe.Checkout.Session` / `as Stripe.Subscription`.
- `replace: true` is only for a deliberate new purchase (checkout completed or the return route). Ordinary events for a replaced subscription are ignored.
- The DB write helpers live in `src/lib/db/billing.ts` from Phase 1.

See `docs/stripe-integration-plan.md` §6.9.

### `src/app/api/stripe/webhook/route.ts`

- `export const runtime = "nodejs"`.
- Do **not** use `auth()`; the signature is the authentication.
- Return 500 when `STRIPE_WEBHOOK_SECRET` or `STRIPE_SECRET_KEY` is missing.
- Return 400 when the `stripe-signature` header is missing or invalid.
- Read the raw body with `await request.text()` **before** any parsing.
- Verify with `parseStripeEvent`.
- Return 500 when `handleStripeEvent` throws, so Stripe retries.
- Return `{ received: true }` with 200 on success or an ignored event.

The route is under `/api/**` and is not covered by `src/proxy.ts`, so no matcher change is needed. Do not add session protection to it.

See `docs/stripe-integration-plan.md` §6.10.

### `src/app/api/stripe/checkout/complete/route.ts`

Required for the success flow. Closes the race where the browser redirect arrives before the webhook.

- `auth()`; redirect to `/sign-in` when absent.
- Read `session_id`; redirect to `/settings?checkout=error` when missing.
- Retrieve the Checkout Session with `expand: ["subscription"]`.
- Verify ownership with `checkout.client_reference_id === session.user.id` or a matching stored `stripeCustomerId`.
- Resolve the subscription (retrieve if it is still a string) and call `syncStripeSubscription(subscription, { userId, replace: true })`.
- Redirect to `/settings?checkout=success` only when a sync happened; otherwise `?checkout=pending`.
- Catch errors and redirect to `?checkout=pending`; never expose Stripe errors to the browser.

See `docs/stripe-integration-plan.md` §6.11.

## Feature gating

Enforcement is server-side. UI checks are advisory.

### `src/actions/items.ts`

In `createItem`, after Zod parsing and inside the existing `try`, before the collection ownership check:

```ts
const entitlement = await getBillingEntitlements(session.user.id);

if (!entitlement) {
  return { success: false, error: "Account not found." };
}

const limit = checkItemCreation(parsed.data.typeId, entitlement);

if (!limit.allowed) {
  return { success: false, error: limit.error };
}
```

- Import `checkItemCreation` from `@/lib/usage-limits` and `getBillingEntitlements` from `@/lib/db/billing`.
- Do not gate `updateItem`, favorites or pin toggles; downgraded users must be able to manage existing items.

### `src/actions/collections.ts`

In `createCollection`, after parsing:

```ts
const entitlement = await getBillingEntitlements(session.user.id);

if (!entitlement) {
  return { success: false, error: "Account not found." };
}

const limit = checkCollectionLimit(entitlement);

if (!limit.allowed) {
  return { success: false, error: limit.error };
}
```

Do not gate update, favorite or delete.

### `src/app/api/upload/route.ts`

After `getSessionUserId()` and before reading form data:

```ts
const entitlement = await getBillingEntitlements(userId);

if (!entitlement?.isPro) {
  return jsonError(
    "File and image uploads are a Pro feature. Upgrade to Pro to upload.",
    403,
  );
}
```

This prevents Free users from writing objects to Tigris even if they bypass the UI.

### `src/actions/profile.ts`

Before deleting the user:

1. Read the user's `stripeSubscriptionId`.
2. If it exists and `process.env.STRIPE_SECRET_KEY` is set, retrieve the subscription and cancel it unless it is already `canceled`.
3. If cancellation fails, return `{ success: false, error: "We couldn't cancel your subscription. Please try again, or manage billing first." }` and do **not** delete the account.
4. Only delete the user after a successful cancellation (or when there is no subscription).

Update the delete-account dialog copy to mention that an active subscription is cancelled.

See `docs/stripe-integration-plan.md` §7.14.

## UI

### `src/hooks/use-billing.ts` + `src/components/billing/billing-provider.tsx`

- `BillingContext` holds `BillingEntitlements | null`.
- `useBilling()` throws when used outside the provider.
- `BillingProvider` takes `billing: BillingEntitlements` and provides it directly (no local state), so `router.refresh()` after creates updates the counts.
- Do not add a `SessionProvider`; the context is seeded by the server layout.

### `src/app/(dashboard)/layout.tsx`

- Fetch `getBillingEntitlements(session.user.id)` alongside the existing data.
- Redirect to `/sign-in` if it returns null (stale session).
- Pass `billing` to `DashboardShell`.

### `src/components/dashboard/dashboard-shell.tsx`

- Add `billing: BillingEntitlements` to props.
- Wrap the existing tree in `<BillingProvider billing={billing}>`.

### `src/app/(dashboard)/settings/page.tsx`

- Fetch `getBillingOverview(session.user.id)` and `getAccountSettings` in parallel.
- Read `searchParams` with `PageProps<"/settings">`; pass `checkout` to the card.
- Derive `stripeInterval` with `intervalForPriceId(billing.stripePriceId)`.
- Render `<BillingCard ... />` above `<EditorPreferencesCard />`, then `<AccountActions />`.
- Update the page description to mention the plan.

### `src/components/settings/billing-card.tsx`

Client component. Requirements:

- Import `FREE_ITEM_LIMIT`/`FREE_COLLECTION_LIMIT` from `@/lib/usage-limits` and `PRO_PLANS`/`BillingOverview` from `@/lib/billing`.
- Show a `Pro`/`Free` badge.
- Free: `items / 50`, `collections / 3`, monthly and yearly upgrade buttons showing `$8 / month` and `$72 / year`.
- Pro: plan interval, renewal date, "Pro access ends on …" when `stripeCancelAtPeriodEnd`, and "Unlimited items and collections".
- `past_due`: show a payment-failure warning while keeping Pro access; "Manage billing" opens the portal.
- Checkout banners:
  - `?checkout=success` + `isPro` → "Payment received. Your Pro access is active."
  - `?checkout=success` + not Pro, or `?checkout=pending` → "Payment received, but Stripe has not confirmed the subscription yet." with a "Refresh status" button calling `router.refresh()`.
  - `?checkout=cancelled` → "Checkout was cancelled — you have not been charged."
  - `?checkout=error` → "We couldn't confirm the checkout…"
- Buttons call `createCheckoutSession` / `createPortalSession`, toast on failure, and `window.location.assign(url)` on success. Disable all billing buttons while a request is in flight.
- Do not read `process.env` or compare price IDs in the client. Use the server-provided `stripeInterval`.
- Optionally clean `?checkout=` from the URL after rendering.

See `docs/stripe-integration-plan.md` §6.14.

### `src/components/dashboard/item-create-dialog.tsx`

- Read `{ isPro, itemCount }` from `useBilling()`.
- `atItemLimit = !isPro && itemCount >= FREE_ITEM_LIMIT`.
- Lock `file`/`image` type buttons for Free users (`disabled`, `aria-disabled`, `Lock` icon, "Available on Pro" title).
- Include `!atItemLimit` and `isPro || !isProOnlyTypeId(form.typeId)` in `canSubmit`.
- Show an upgrade banner linking to `/settings#billing` when at the limit or when a Pro-only type is relevant.
- Import limits from `@/lib/usage-limits`.

### `src/components/dashboard/collection-create-dialog.tsx`

- Read `{ isPro, collectionCount }` from `useBilling()`.
- `atLimit = !isPro && collectionCount >= FREE_COLLECTION_LIMIT`.
- Disable Create and show an upgrade banner when at the limit.
- Import `FREE_COLLECTION_LIMIT` from `@/lib/usage-limits`.

### `src/components/dashboard/sidebar.tsx`

- Remove the local `PRO_TYPE_IDS` set.
- Use `isProOnlyTypeId(type.id)` from `@/lib/usage-limits` for the PRO badge.
- Optionally hide the badge for Pro users and/or add a Free/Pro indicator plus an Upgrade link to the user menu.

## Tests

### Unit tests (Vitest, no network)

| File | Cases |
| --- | --- |
| `src/actions/billing.test.ts` | Unauthenticated; invalid interval; Stripe not configured; already Pro; existing customer reused; new customer created with the idempotency key; checkout URL returned; Stripe error → generic message; portal with no customer; portal URL returned. Mock `@/auth`, `@/lib/stripe`, `@/lib/db/billing` and `@/lib/app-url`. |
| `src/lib/stripe-webhook.test.ts` | Unknown event ignored; non-subscription checkout ignored; `checkout.session.completed` resolves the subscription and syncs with `client_reference_id` + `replace: true`; `customer.subscription.created`/`updated` sync; `deleted` clears; handler errors propagate so the route can return 500. Mock `@/lib/stripe` and `@/lib/db/billing`. |
| `src/actions/items.test.ts` | Add a mocked `getBillingEntitlements`. Default it to Pro in `beforeEach` so existing tests stay focused. Add: Free at 50 rejected; Free at 49 allowed; Pro at 10,000 allowed; Free `file`/`image` rejected; Pro `file`/`image` allowed. |
| `src/actions/collections.test.ts` | Mock entitlements; default Pro. Add: Free at 3 rejected; Free at 2 allowed; Pro allowed. |
| `src/actions/profile.test.ts` | No subscription skips Stripe; active subscription is cancelled before delete; cancellation failure returns an error and does not delete; canceled subscription is not cancelled again. Mock `@/lib/prisma` and `@/lib/stripe`. |

Routes are covered indirectly through `src/lib/stripe-webhook.ts` and the browser/CLI checks, consistent with the project's "actions and utilities only" testing rule.

### Stripe CLI and browser verification

Start the app and forward webhooks:

```bash
npm run dev
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` from `stripe listen` into `.env` and restart the dev server. Useful CLI commands:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe events resend evt_...          # replay a delivery (idempotency check)
stripe trigger customer.subscription.updated
```

Use test cards:

| Scenario | Card |
| --- | --- |
| Success | `4242 4242 4242 4242` |
| 3D Secure | `4000 0025 0000 3155` |
| Declined | `4000 0000 0000 9995` |

Checklist:

- [ ] Free user `/settings` shows Free, `0 / 50` items and `0 / 3` collections.
- [ ] Monthly upgrade opens Checkout with the `$8` monthly price; yearly opens the `$72` yearly price.
- [ ] Cancelling Checkout returns to `/settings?checkout=cancelled` with no charge.
- [ ] Paying with `4242…` returns to `/settings?checkout=success`; the card shows Pro.
- [ ] Stripe CLI shows 200s for `checkout.session.completed` and `customer.subscription.created`/`updated`.
- [ ] The database row has `isPro = true`, customer/subscription/price IDs, status `active`, a period end and the correct cancel flag.
- [ ] A full page reload still shows Pro (session sync from Phase 1).
- [ ] Yearly checkout stores the yearly price and the card shows "Yearly".
- [ ] `Manage billing` opens the Customer Portal.
- [ ] Cancelling in the portal at period end returns to `/settings` showing "Pro access ends on …"; `isPro` stays true until the period ends.
- [ ] Ending the subscription (Stripe test clock, Dashboard cancel, or portal immediate cancel) fires `customer.subscription.deleted`, sets `isPro = false`, and blocks new item/collection creates at the Free limits while existing over-limit data remains visible.
- [ ] A failed renewal (test clock or declining card) moves the subscription to `past_due`: Pro remains and the payment warning shows. Moving to `unpaid`/`canceled` revokes Pro.
- [ ] Free user: file/image type buttons are locked; `POST /api/upload` returns 403; the New Collection dialog blocks the 4th collection.
- [ ] At 50 items, the 51st create is rejected by the server even when the client is bypassed.
- [ ] Pro user: unlimited item/collection creation; file and image uploads work; existing drawer preview/download still works.
- [ ] Webhook without `stripe-signature` → 400; bad signature → 400; duplicate event replay is harmless; a stale deleted event for an old subscription does not revoke a newer one.
- [ ] Deleting a subscribed account cancels Stripe first; deleting a non-subscribed account still works; a cancellation failure blocks deletion with a message.
- [ ] No console errors in the browser and no secrets in the client bundle.

## Acceptance criteria

- [ ] Checkout, Customer Portal, webhook and checkout-return routes exist and match the plan.
- [ ] Server-side gating is enforced in `createItem`, `createCollection` and `/api/upload`; UI gating is present but advisory.
- [ ] Billing provider/context, settings `BillingCard`, create-dialog gating and sidebar helper are implemented.
- [ ] Account deletion cancels an active subscription first.
- [ ] `src/actions/billing.test.ts`, `src/lib/stripe-webhook.test.ts` and the updated items/collections/profile tests pass.
- [ ] All Stripe CLI/browser checks above pass.
- [ ] `npm run test`, `npm run lint` and `npm run build` pass.
- [ ] The webhook route works without a user session (signature-only authentication).
- [ ] `npm run db:status` is clean and no production database was touched.

## Implementation order

1. Create `src/actions/billing.ts` + tests; verify a real test-mode Checkout creates a Stripe customer and returns a URL.
2. Add `src/lib/stripe-webhook.ts` and the webhook route; verify a completed Checkout updates `isPro` and subscription fields.
3. Add the checkout-return reconciliation route; verify the redirect race is covered.
4. Add the billing context/provider, layout/shell wiring and `BillingCard`; verify Free/Pro states and portal.
5. Enforce gating in actions/routes; update the item and collection dialogs; update the sidebar.
6. Cancel subscriptions on account deletion.
7. Run the full Stripe CLI/browser checklist, then `npm run test`, `npm run lint`, `npm run build`.
8. Update `context/current-feature.md` and merge after approval.

## Risks and notes

- **Image Pro/Free:** Phase 2 gating follows `PRO_ONLY_TYPE_IDS` from Phase 1. If images are Free, change the tuple in Phase 1 and re-run the usage-limit tests before starting Phase 2.
- **Trial copy:** The homepage says "Start 14-day trial" but this phase implements no trial. Change the marketing copy or add `trial_period_days: 14` (and `payment_method_collection`) before launch.
- **Webhook race:** The success redirect may beat the webhook; the reconciliation route plus the "Refresh status" banner covers it.
- **Event ordering:** `replace: true` lets checkout completion adopt a new subscription; ordinary events for replaced subscriptions are ignored. `clearStripeSubscription` is scoped by both customer and subscription id.
- **Duplicate checkout sessions:** The `isPro` check and idempotent customer creation reduce the window, but Stripe cannot guarantee a single subscription if two sessions are completed. Do not ship a UI that submits checkout twice.
- **Renewal display:** Verify that `customer.subscription.updated` refreshes `stripeCurrentPeriodEnd` on renewal. If it does not in your Stripe account, add `invoice.paid` handling using `invoice.parent.subscription_details.subscription` (the modern replacement for the removed `invoice.subscription`).
- **Demo-user scoping:** Some dashboard helpers still use `DEMO_USER_EMAIL`. Billing checks use `session.user.id` directly; the billing card usage counts are correct. Fixing the dashboard scoping is a separate pre-existing task.
- **Live mode:** Do not switch to live keys until the test-mode checklist passes. Live mode needs its own product, prices, webhook endpoint and portal configuration.

## References

- `docs/stripe-integration-plan.md` §4 (architecture), §6.8–§6.14 (actions, webhook, UI), §7.5–§7.14 (wiring and gating), §8 (Dashboard/CLI), §9 (testing), §11 (risks).
- `context/features/stripe-phase-1-spec.md` — required foundation.
- `context/coding-standards.md` — server actions, API routes, Zod, error handling, testing.
- `context/ai-interaction.md` — test and commit workflow.
- `AGENTS.md` — Neon development-branch rules and migration approval.
