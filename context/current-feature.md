# Current Feature: Auth UI (Sign In, Register & Sign Out)

## Status

<!-- Not Started|In Progress|Complete -->

In Progress

## Goals

<!-- Goals & requirements -->

- Replace NextAuth's default pages with custom UI
- Create the sign-in page at `/sign-in` (email + password fields, "Sign in with GitHub" button, link to register, form validation and error display)
- Create the register page at `/register` (name, email, password, confirm password, client-side validation, submit to `/api/auth/register`, redirect to sign-in on success)
- Build a reusable avatar component (GitHub image or initials fallback)
- Update the bottom of the sidebar: user avatar + name, a dropdown that opens upward with a "Sign out" action and a link to `/profile`
- Set `pages.signIn` to `/sign-in` and protect the whole `(dashboard)` group, redirecting unauthenticated users to `/sign-in`
- Add a minimal placeholder `/profile` page so the sidebar link resolves

Success criteria (from spec Testing):

- `/sign-in` renders the custom page
- Signing in with GitHub works
- Signing in with email/password works
- The avatar shows the GitHub image or initials
- Clicking the avatar opens the dropdown
- Clicking "Sign out" logs out and redirects
- `/register` creates an account and redirects to sign-in

## Notes

<!-- Any extra notes -->

Decisions confirmed with the user:

- Protect the **whole `(dashboard)` route group** (`/dashboard`, `/collections`, `/items`, `/profile`) — not just `/dashboard/*`
- Create a **minimal placeholder `/profile` page** so the "go to /profile" interaction does not 404

Context / constraints:

- Auth forms use **Server Actions** (`src/actions/auth.ts`); the register form posts to the existing `/api/auth/register` route as specified
- Sign-out uses the client `signOut` from `next-auth/react` with `redirectTo: "/sign-in"` (a Radix menu item swallows a nested form's native submit, so a server-action-in-menu approach cleared the cookie without navigating)
- On successful registration a `sonner` toast ("Account created — you can now sign in.") is shown before redirecting to `/sign-in`; `sonner` was added as a dependency and `<Toaster />` is mounted in the root layout
- `pages.signIn = "/sign-in"` belongs in `auth.config.ts` (edge-safe, shared)
- Reference: https://authjs.dev/guides/pages/signin and https://authjs.dev/guides/pages/signout

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
