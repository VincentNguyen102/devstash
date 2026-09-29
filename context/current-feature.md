# Current Feature

Seed Data — Demo User, Collections & Items

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

See @context/features/seed-spec.md

- Extend `prisma/seed.ts` to populate the database with realistic sample data for development and demos
- Seed a demo user (`demo@devstash.io`, name "Demo User", password `12345678` hashed with bcryptjs at 12 rounds, `isPro: false`, `emailVerified` set to the current date)
- Keep the 7 system item types (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `url`) with `isSystem: true` and the icons/colours from the spec
- Seed 5 collections with their items:
  - **React Patterns** — 3 snippets (custom hooks, component patterns, utility functions)
  - **AI Workflows** — 3 prompts (code review, documentation generation, refactoring assistance)
  - **DevOps** — 1 snippet, 1 command, 2 links (real URLs)
  - **Terminal Commands** — 4 commands (Git, Docker, process management, package manager)
  - **Design Resources** — 4 links (real URLs)
- Use real, working URLs for every link item

## Notes

<!-- Any extra notes -->

- Seed reference: `@context/features/seed-spec.md`
- Database standards: `@context/coding-standards.md`
- Icons are Lucide React component names; type visuals should stay consistent with `src/lib/item-type-meta.ts` / `src/lib/mock-data.ts`
- Seed only for the development branch — never run against production
- Idempotent: re-running `npm run db:seed` must not duplicate rows (upsert by stable id / unique field)

### Implementation

- `prisma/seed.ts` — the current file only seeds the 7 system item types. Overwrite/extend it to also seed:
  - the demo user (upsert by unique `email`), hashing the password with `bcryptjs` (12 rounds)
  - the 5 collections, owned by the demo user, with stable ids so re-runs are safe
  - the items for each collection, linked to the demo user, the matching item type and collection, with `contentType`, `content`/`url`, `language` and `description` set as appropriate
  - run in order: system item types → demo user → collections → items
- `scripts/test-db.ts` — extend the `npm run db:test` pre-flight check to also verify the seeded user, collections and items (counts), not just the system item types.

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 completed — ShadCN UI init + components, `/dashboard` route, dark mode by default, top bar with search & New Item button, sidebar/main placeholders
- Dashboard UI Phase 2 completed — collapsible sidebar, item type links to `/items/TYPE`, favorite & recent collections, user avatar area, drawer toggle, mobile drawer; sidebar moved into a shared `(dashboard)` route group layout with placeholder item/collection pages
- Dashboard UI Phase 3 completed — dashboard main area: 4 stat cards (items, collections, favorite items, favorite collections), collections grid linking to `/collections/[id]`, pinned items and 10 recent items; shared item-type visuals extracted to `src/lib/item-type-meta.ts`
- Database completed — Prisma 7 + Neon PostgreSQL via the `@prisma/adapter-neon` driver adapter, `prisma.config.ts` config, client singleton at `src/lib/prisma.ts` and initial migration `20260929085629_init` (User, Item, ItemType, Collection, Tag, ItemTag + NextAuth models with indexes and cascade deletes); `prisma/seed.ts` seeds the 7 system item types and `scripts/test-db.ts` (`npm run db:test`) verifies the connection, tables, migrations and seed data
- Seed data completed — `prisma/seed.ts` now also seeds the demo user (`demo@devstash.io`, password hashed with bcryptjs at 12 rounds, `emailVerified` set), the 5 collections from `@context/features/seed-spec.md` (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources) and their 18 items with content/URLs and tags; idempotent via stable ids + upserts; `scripts/test-db.ts` verifies the demo user, collections and items; added the `bcryptjs` dependency
