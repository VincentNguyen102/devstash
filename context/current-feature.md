# Current Feature

Dashboard Items — Wire Pinned & Recent Items to the Database

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

See @context/features/dashboard-items-spec.md

- Replace the dummy pinned and recent item data in the dashboard main area with real data from the Neon database via Prisma
- Keep the current design of the item rows — same layout, just real data
- Create `src/lib/db/items.ts` with the data fetching functions
- Fetch items directly in the dashboard server component
- Derive each item row's icon and border colour from the item's type
- Display the item type, tags and everything else currently shown
- If there are no pinned items, don't render the Pinned section
- Update the item stats display (total/favorite items) to use real data

## Notes

<!-- Any extra notes -->

- Spec reference: `@context/features/dashboard-items-spec.md`
- Current dummy data lives in `src/lib/mock-data.ts` (`items`); the dashboard page imports from there today
- Item rows are rendered by `src/components/dashboard/item-row.tsx`; type visuals (icon + colour classes) come from `src/lib/item-type-meta.ts`
- Follow the established data-fetching pattern: server components fetch directly with Prisma, scoped to the seeded demo user and using `connection()` to opt into dynamic rendering — see `src/lib/db/collections.ts` and `src/lib/prisma.ts`
- Prisma model: `Item` has `title`, `description`, `isFavorite`, `isPinned`, `language`, `typeId` and `updatedAt`; tags come from the `ItemTag` -> `Tag` relation; system item type ids (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `url`) match the keys in `item-type-meta.ts`
- Design reference: `@context/screenshots/dashboard-ui-main.png` (layout already exists)

### Implementation

- `src/lib/db/items.ts` — add data fetching functions using the Prisma client singleton:
  - `getPinnedItems()` — the demo user's pinned items, most recently updated first
  - `getRecentItems(limit)` — the demo user's most recently updated items
  - `getItemStats()` — total item count and favorite item count for the demo user
  - map the `tags` relation to `tag.name` and return a dedicated `ItemSummary` type aligned with what `ItemRow` needs
  - `await connection()` in each function to keep the route dynamic
- `src/app/(dashboard)/dashboard/page.tsx` — replace the `mock-data` item import with the new DB queries; remove the local `byMostRecent` sort helper; pass real item counts to `DashboardStats`; only render the Pinned section when there are pinned items
- `src/components/dashboard/item-row.tsx` — accept the DB-backed item type and apply the type's `borderClass` to the row ring (the icon already uses the type visual); handle `updatedAt` as a `Date`
- `src/components/dashboard/stat-cards.tsx` — no structural change; the item/favorite item stats now come from real data
- Leave the sidebar and collection sections untouched

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
