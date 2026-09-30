# Current Feature

Dashboard Collections — Wire Recent Collections to the Database

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

See @context/features/dashboard-collections-spec.md

- Replace the dummy collection data in the dashboard main area with real data from the Neon database via Prisma
- Keep the current design of the 6 recent collection cards — same layout, just real data
- Create `src/lib/db/collections.ts` with the data fetching functions
- Fetch collections directly in the dashboard server component
- Derive each collection card's border colour from the most-used content type in that collection
- Show small icons of all types present in that collection
- Update the collection stats display to use real data
- Do **not** add the items underneath the collections yet — that comes later

## Notes

<!-- Any extra notes -->

- Spec reference: `@context/features/dashboard-collections-spec.md`
- Current dummy data lives in `src/lib/mock-data.ts` (`collections`, `items`, `itemTypes`); the dashboard page imports from there today
- Collection cards are rendered by `src/components/dashboard/collection-card.tsx` and stats by `src/components/dashboard/stat-cards.tsx`
- Type visuals (icon + colour classes) come from `src/lib/item-type-meta.ts`
- Follow the data-fetching standard: server components fetch directly with Prisma; see `src/lib/prisma.ts` for the client singleton
- Design reference: `@context/screenshots/dashboard-ui-main.png` (layout already exists)
- Prisma model: `Collection` has `name`, `description`, `isFavorite`, `userId`; `Item` has `typeId` and `collectionId` for grouping/counts

### Implementation

- `src/lib/db/collections.ts` — add data fetching functions (e.g. `getCollections`) using the Prisma client singleton:
  - return the recent collections with their item count and the set of item types they contain
  - compute the most-used content type per collection so the card border colour can be derived
  - keep the return shape aligned with the existing `Collection` type used by `CollectionCard` (or define a dedicated type)
- `src/app/(dashboard)/dashboard/page.tsx` — replace the `mock-data` collection import with the new DB query; keep the rest of the page (stats, pinned, recent items) as-is for now
- `src/components/dashboard/collection-card.tsx` — apply a border colour derived from the most-used type; keep the existing icons row and design
- `src/components/dashboard/stat-cards.tsx` — update the collections/favorite collections stats to use real data
- Leave the pinned and recent item sections untouched (still mock data) until a follow-up feature

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 completed — ShadCN UI init + components, `/dashboard` route, dark mode by default, top bar with search & New Item button, sidebar/main placeholders
- Dashboard UI Phase 2 completed — collapsible sidebar, item type links to `/items/TYPE`, favorite & recent collections, user avatar area, drawer toggle, mobile drawer; sidebar moved into a shared `(dashboard)` route group layout with placeholder item/collection pages
- Dashboard UI Phase 3 completed — dashboard main area: 4 stat cards (items, collections, favorite items, favorite collections), collections grid linking to `/collections/[id]`, pinned items and 10 recent items; shared item-type visuals extracted to `src/lib/item-type-meta.ts`
- Database completed — Prisma 7 + Neon PostgreSQL via the `@prisma/adapter-neon` driver adapter, `prisma.config.ts` config, client singleton at `src/lib/prisma.ts` and initial migration `20260929085629_init` (User, Item, ItemType, Collection, Tag, ItemTag + NextAuth models with indexes and cascade deletes); `prisma/seed.ts` seeds the 7 system item types and `scripts/test-db.ts` (`npm run db:test`) verifies the connection, tables, migrations and seed data
- Seed data completed — `prisma/seed.ts` now also seeds the demo user (`demo@devstash.io`, password hashed with bcryptjs at 12 rounds, `emailVerified` set), the 5 collections from `@context/features/seed-spec.md` (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources) and their 18 items with content/URLs and tags; idempotent via stable ids + upserts; `scripts/test-db.ts` verifies the demo user, collections and items; added the `bcryptjs` dependency
- Dashboard collections completed — added `src/lib/db/collections.ts` (`getRecentCollections`, `getCollectionStats`) to fetch the demo user's collections from Neon with Prisma; the dashboard server component now renders real collection cards (item count, type icons and a border colour derived from each collection's most-used type) and real collection stat counts; added `borderClass` to the shared type visuals in `src/lib/item-type-meta.ts`; `connection()` opts the route into dynamic rendering; pinned/recent items and the sidebar still use `src/lib/mock-data.ts`
