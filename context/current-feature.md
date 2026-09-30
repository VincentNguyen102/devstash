# Current Feature: Add Pro Badge to Sidebar

## Status

<!-- Not Started|In Progress|Complete -->

In Progress

## Goals

<!-- Goals & requirements -->

- Add a PRO badge to the file and image item types in the sidebar
- Use the ShadCN UI Badge component (`src/components/ui/badge.tsx`)
- Keep the badge clean and subtle
- Render the label as all uppercase "PRO"

## Notes

<!-- Any extra notes -->

- Spec reference: `@context/features/add-pro-badge-sidebar.md`
- Only the `file` and `image` system item types get the badge (stable slugs; see `src/lib/item-type-meta.ts` and `prisma/seed.ts`)
- Sidebar is `src/components/dashboard/sidebar.tsx`; it renders DB-backed item types passed down through `DashboardShell` from the `(dashboard)` server layout
- `Badge` component already exists at `src/components/ui/badge.tsx`

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
