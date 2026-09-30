# Current Feature

Stats & Sidebar — Wire Dashboard Stats, Item Types and Collections to the Database

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

See @context/features/stats-sidebar-spec.md

- Show the main-area stats from the database instead of `src/lib/mock-data.ts`
- Show the system item types in the sidebar with their icons and real item counts, linking to `/items/[typename]`
- Show the actual collection data from the database in the sidebar
- Add a "View all collections" link under the collections list that goes to `/collections`
- Keep the star icons for favorite collections; for recents show a colored circle based on the most-used item type in the collection
- Create `src/lib/db/items.ts` and add the database functions (the file already exists from the dashboard items feature — extend it)

## Notes

<!-- Any extra notes -->

- Spec reference: `@context/features/stats-sidebar-spec.md`
- Main-area stat cards already read from the database; the sidebar still imports `itemTypes`, `collections` and `currentUser` from `src/lib/mock-data.ts`
- `src/lib/db/collections.ts` already exposes `dominantTypeId` on `CollectionSummary`; extend it with a function that returns the sidebar's collections
- The sidebar is a client component, so the `(dashboard)` server layout fetches the data and passes it down through `DashboardShell`
- System item type ids are stable slugs (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `url`) matching the keys in `src/lib/item-type-meta.ts`
- Follow the established pattern: server components fetch directly with Prisma, scoped to the seeded demo user and using `connection()` to opt into dynamic rendering — see `src/lib/prisma.ts`

### Implementation

- `src/lib/db/items.ts` — add `ItemTypeSummary` and `getItemTypes()`; fetch the system item types plus the demo user's per-type item counts (via `groupBy`) and return them in the canonical type order
- `src/lib/db/collections.ts` — add `getSidebarCollections()` (all of the demo user's collections with their dominant type) and extract the shared mapper used by `getRecentCollections`
- `src/lib/item-type-meta.ts` — resolve icons from a local system-type map and an optional DB-provided icon name instead of importing `mock-data`
- `src/app/(dashboard)/layout.tsx` — fetch item types + collections in the server layout and pass them to `DashboardShell`
- `src/components/dashboard/dashboard-shell.tsx` — accept the DB data and forward it to both sidebar instances (desktop + mobile)
- `src/components/dashboard/sidebar.tsx` — render the DB system types with real counts, favorite collections with stars, recents with a colored circle derived from the dominant type, and a "View all collections" link to `/collections`
- `src/app/(dashboard)/collections/page.tsx` — minimal all-collections listing so the new link resolves
- `src/lib/mock-data.ts` — still used for the sidebar user and the item/collection detail placeholders; leave those untouched

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
