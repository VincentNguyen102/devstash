# Current Feature: Toggle Email Verification

## Status

<!-- Not Started|In Progress|Complete -->

In Progress

## Goals

<!-- Goals & requirements -->

- Add a single, easily toggled flag (env variable — see Notes) that enables or disables the **entire** email-verification system, so registration/sign-in work without Resend while no domain is linked.
- Centralize reading the flag in one helper (e.g. `isEmailVerificationEnabled()` in `src/lib/email-verification.ts`) — no scattered `process.env` reads across the codebase.
- **When disabled:**
  - `POST /api/auth/register` does not create a verification token and does not send an email; it marks the new user as already verified (`emailVerified: new Date()`), or otherwise makes the account immediately usable.
  - The Credentials sign-in gate in `src/auth.ts` is skipped, so unverified accounts can sign in normally.
  - The registration UI skips the "check your inbox" step and returns to the previous flow: toast "Account created — you can now sign in." and redirect to `/sign-in`.
  - `/check-email`, `/verify-email`, `GET /api/auth/verify-email` and the resend server action redirect to `/sign-in` (or otherwise no-op gracefully) instead of erroring.
- **When enabled:** current behavior is unchanged (email sent, sign-in blocked until verified, `/check-email` + `/verify-email` work).
- Document the flag in `.env.example` and set the desired value in `.env`.
- Verify with `npm run build` + `npm run lint` and manually check both flag states (register → sign in works when off; still gated when on).

## Notes

<!-- Any extra notes -->

- **Mechanism (confirmed) — env var:** `EMAIL_VERIFICATION_ENABLED`, parsed in one place. Semantics: **enabled unless explicitly set to `"false"`/`"0"`** (fail safe — a misconfigured production environment keeps verification on). Set `EMAIL_VERIFICATION_ENABLED=false` in `.env` for now.
  - Alternatives considered:
    - `NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED` so the client can read it directly — not needed; pass the value from the server `register` page down to `RegisterForm` as a prop instead (single source of truth, no bundle exposure).
    - Auto-detect (enable only when a Resend sending domain/key is present) — too implicit/magical; avoid.
    - A DB/config setting — overkill for a boolean deployment concern; env var is the right tool.
- **Touch points to update (all read the central helper):**
  - `src/lib/email-verification.ts` — add `isEmailVerificationEnabled()`; `getAppUrl()` etc. unaffected.
  - `src/app/api/auth/register/route.ts` — skip token + send; set `emailVerified` when disabled.
  - `src/auth.ts` — only throw `EmailNotVerifiedError` when verification is enabled.
  - `src/app/register/page.tsx` + `src/components/auth/register-form.tsx` — pass a boolean prop; choose `/sign-in` vs `/check-email`.
  - `src/app/check-email/page.tsx`, `src/app/verify-email/page.tsx`, `src/app/api/auth/verify-email/route.ts`, `src/actions/email-verification.ts` — guard/redirect when disabled.
- **Decision (confirmed):** variable name `EMAIL_VERIFICATION_ENABLED`; verification is **enabled unless explicitly set to `"false"`/`"0"`** (opt-out, fail safe). Set `EMAIL_VERIFICATION_ENABLED=false` in `.env` for now.
- Reminder from the last feature: the Resend account is still in test mode, so even when enabled it only delivers to the account owner until a domain is verified.

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 completed — ShadCN UI init + components, `/dashboard` route, dark mode by default, top bar with search & New Item button, sidebar/main placeholders
- Dashboard UI Phase 2 completed — collapsible sidebar, item type links to `/items/TYPE`, favorite & recent collections, user avatar area, drawer toggle, mobile drawer; sidebar moved into a shared `(dashboard)` route group layout with placeholder item/collection pages
- Dashboard UI Phase 3 completed — dashboard main area: 4 stat cards (items, collections, favorite items, favorite collections), collections grid linking to `/collections/[id]`, pinned items and 10 recent items; shared item-type visuals extracted to `src/lib/item-type-meta.ts`
- Database completed — Prisma 7 + Neon PostgreSQL via the `@prisma/adapter-neon` driver adapter, `prisma.config.ts` config, client singleton at `src/lib/prisma.ts` and initial migration `20260929085629_init` (User, Item, ItemType, Collection, Tag, ItemTag + NextAuth models with indexes and cascade deletes); `prisma/seed.ts` seeds the 7 system item types and `scripts/test-db.ts` (`npm run db:test`) verifies the connection, tables, migrations and seed data
- Seed data completed — `prisma/seed.ts` now also seeds the demo user (`demo@devstash.io`, password hashed with bcryptjs at 12 rounds, `emailVerified` set), the 5 collections from `@context/features/seed-spec.md` (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources) and their 18 items with content/URLs and tags; idempotent via stable ids + upserts; `scripts/test-db.ts` verifies the demo user, collections and items; added the `bcryptjs` dependency
- Dashboard collections completed — added `src/lib/db/collections.ts` (`getRecentCollections`, `getCollectionStats`) to fetch the demo user's collections from Neon with Prisma; the dashboard server component now renders real collection cards (item count, type icons and a border colour derived from each collection's most-used type) and real collection stat counts; added `borderClass` to the shared type visuals in `src/lib/item-type-meta.ts`; `connection()` opts the route into dynamic rendering; pinned/recent items and the sidebar still use `src/lib/mock-data.ts`
- Dashboard items completed — added `src/lib/db/items.ts` (`getPinnedItems`, `getRecentItems`, `getItemStats`) to fetch the demo user's items from Neon with Prisma and map the `ItemTag` -> `Tag` relation to tag names; the dashboard server component now renders real pinned and recent item rows (icon and border colour derived from the item type), passes real item/favorite-item counts to the stat cards, and omits the Pinned section when there are no pinned items; `ItemRow` now takes the DB-backed `ItemSummary` type and handles `updatedAt` as a `Date`; the sidebar and collection pages still use `src/lib/mock-data.ts`
- Stats & sidebar completed — added `getItemTypes()` to `src/lib/db/items.ts` (system item types with the demo user's per-type counts via `groupBy`, returned in canonical order) and `getCollections()` to `src/lib/db/collections.ts` (shared mapper with `getRecentCollections`); the `(dashboard)` server layout fetches both and passes them through `DashboardShell`, so the sidebar now renders DB-backed system types with real counts/icons, favorite collections with stars and recents with a colored circle derived from the dominant type, plus a "View all collections" link and a new `/collections` listing page; `src/lib/item-type-meta.ts` no longer imports `mock-data` (icons resolve from a local map or the DB-provided icon name); removed a stray debug `console.log` in `items.ts`
- Connected the repo to Vercel
- Add Pro Badge to Sidebar completed — added the Feature Workflow skill (`.agents/skills/feature/`) and the `context/features/add-pro-badge-sidebar.md` spec; the sidebar now renders a subtle ShadCN `Badge` ("PRO", `outline` variant) before the item count for the `file` and `image` item types, gated by a `PRO_TYPE_IDS` set in `src/components/dashboard/sidebar.tsx`
- Auth Phase 1 completed — set up NextAuth v5 (`next-auth@5.0.0-beta.32`) with the split config pattern: `src/auth.config.ts` (edge-safe, GitHub provider + `trustHost`) and `src/auth.ts` (Prisma adapter + JWT strategy + a session callback exposing `session.user.id`); added the Auth.js route handler at `src/app/api/auth/[...nextauth]/route.ts`, protected `/dashboard/*` with a named-export Next.js 16 proxy at `src/proxy.ts` that redirects unauthenticated users to the default sign-in page with a `callbackUrl`, and added `src/types/next-auth.d.ts` to extend the `Session` type with `user.id`; documented `AUTH_SECRET`/`AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` in `.env.example`; verified `npm run build` + `npm run lint` and the GitHub OAuth handoff (302 to GitHub with PKCE)
- Auth Phase 2 (Credentials / Email-Password) completed — added the Credentials provider using the split pattern (`auth.config.ts` holds an edge-safe `authorize: () => null` placeholder; `auth.ts` provides the real bcrypt validation via `compare` against the stored hash) and added `POST /api/auth/register` (`src/app/api/auth/register/route.ts`) which validates `name/email/password/confirmPassword` with zod, rejects duplicate emails (409), hashes with bcryptjs at 12 rounds and creates the user; added `zod` as a dependency; no Prisma migration needed (`User.password` already existed from the initial migration); verified `npm run build` + `npm run lint` and end-to-end checks (register 201, duplicate 409, password mismatch 400, credentials login 302 → `/dashboard` with a session exposing `user.id`, GitHub handoff still works)
- Auth Phase 3 (UI: Sign In, Register & Sign Out) completed — replaced the default Auth.js pages with custom `src/app/sign-in` and `src/app/register` pages (credentials via a server action with inline errors, GitHub button, link between the pages) plus `src/actions/auth.ts`; added a reusable `UserAvatar` (GitHub image or initials via `getInitials`) and a sidebar `UserMenu` dropdown (Radix) with a Profile link and client `signOut({ redirectTo: "/sign-in" })`; set `pages.signIn = "/sign-in"` and extended the proxy matcher to protect the whole `(dashboard)` group (`/dashboard`, `/collections`, `/items`, `/profile`), redirecting to `/sign-in`; added a placeholder `/profile` page and a `sonner` toast ("Account created — you can now sign in.") on successful registration with `<Toaster />` mounted in the root layout; added `sonner` as a dependency; verified `npm run build` + `npm run lint` and the full flow in a real browser (credentials login, sidebar avatar + dropdown, sign-out redirect, register → toast → `/sign-in`)
- Email Verification on Register completed — added Resend-based email verification: `src/lib/email-verification.ts` issues SHA-256-hashed, single-use tokens (24h TTL) in the existing Auth.js `VerificationToken` table (resending invalidates prior links) and `src/lib/email.ts` sends a dark-themed verification email via Resend (dev-only fallback logs the link when `RESEND_API_KEY` is missing); `POST /api/auth/register` now creates a token and sends the email without rolling back the account on delivery failure; `GET /api/auth/verify-email` consumes the token and redirects to `/verify-email` (`success`/`expired`/`invalid`/`error` states) and a new `/check-email` page plus a resend server action (`src/actions/email-verification.ts`) let users request a fresh link without revealing which emails have accounts; `src/auth.ts` gates the Credentials provider on `emailVerified` via a `CredentialsSignin` subclass (`code: email_not_verified`) surfaced by `src/actions/auth.ts`/`sign-in-form.tsx` with a "Send a new link" link (GitHub OAuth is unaffected); updated `register-form.tsx` to redirect to `/check-email` and documented `RESEND_API_KEY`/`RESEND_FROM_EMAIL`/`NEXT_PUBLIC_APP_URL` in `.env.example`; verified `npm run build` + `npm run lint` and end-to-end (register 201, unverified sign-in → `code=email_not_verified`, wrong password → generic, valid token → success, reuse → invalid, expired → expired+email, verified sign-in → 302 `/dashboard` with session); note: the Resend account is in test mode so it only delivers to the account owner until a domain is verified
