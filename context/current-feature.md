# Current Feature

Database — Neon PostgreSQL + Prisma ORM

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

See @context/features/database-spec.md

- Set up Prisma 7 with a Neon PostgreSQL (serverless) database
- Create the initial schema based on the data models in `@context/project-overview.md` (will evolve)
- Include NextAuth models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes

## Notes

<!-- Any extra notes -->

- Use Prisma 7 — it has breaking changes. Read the full upgrade guide before writing any code: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Setup reference: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres
- We have a development branch (in `DATABASE_URL`) and a production branch. ALWAYS create migrations — never `db push` directly unless explicitly specified.
- Database standards: `@context/coding-standards.md`

### Implementation

- `prisma/schema.prisma` — initial models (User, Item, ItemType, Collection, Tag, ItemTag) + NextAuth models (Account, Session, VerificationToken), with indexes and cascade deletes.
- `prisma.config.ts` — Prisma 7 config (schema path, migrations path, datasource URL). Replaces `url` in the datasource block / `package.json#prisma`.
- `src/lib/prisma.ts` — Prisma Client singleton using the Neon driver adapter (`@prisma/adapter-neon`).
- Generated client is written to `src/generated/prisma` (gitignored) — import it from `@/generated/prisma/client`, never `@prisma/client`.
- Env vars: `DATABASE_URL` (pooled dev branch, used by the app) + `DIRECT_URL` (direct/non-pooled, used by Prisma CLI for migrations). See `.env.example`.
- Scripts: `db:generate`, `db:migrate`, `db:deploy`, `db:seed`, `db:status`, `db:studio`, `db:test`; `build` and `postinstall` run `prisma generate`.
- Initial migration `prisma/migrations/20260929085629_init` created and applied with `prisma migrate dev --name init` (never `db push`). Migrations ran fine against the pooled `DATABASE_URL`, so `DIRECT_URL` is only an optional override.
- `prisma/seed.ts` — seeds the 7 system item types (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `url`) with stable slug ids, icons and colours matching `src/lib/mock-data.ts`. Idempotent (upserts by id). Run with `npm run db:seed` (Prisma 7 never seeds automatically after a migration).
- `scripts/test-db.ts` — `npm run db:test`: connects with the app's client/adapter and checks expected tables, applied migrations and seeded system types, printing row counts. Exits non-zero on failure so it can be used as a pre-flight/CI check.

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 completed — ShadCN UI init + components, `/dashboard` route, dark mode by default, top bar with search & New Item button, sidebar/main placeholders
- Dashboard UI Phase 2 completed — collapsible sidebar, item type links to `/items/TYPE`, favorite & recent collections, user avatar area, drawer toggle, mobile drawer; sidebar moved into a shared `(dashboard)` route group layout with placeholder item/collection pages
- Dashboard UI Phase 3 completed — dashboard main area: 4 stat cards (items, collections, favorite items, favorite collections), collections grid linking to `/collections/[id]`, pinned items and 10 recent items; shared item-type visuals extracted to `src/lib/item-type-meta.ts`
- Database completed — Prisma 7 + Neon PostgreSQL via the `@prisma/adapter-neon` driver adapter, `prisma.config.ts` config, client singleton at `src/lib/prisma.ts` and initial migration `20260929085629_init` (User, Item, ItemType, Collection, Tag, ItemTag + NextAuth models with indexes and cascade deletes); `prisma/seed.ts` seeds the 7 system item types and `scripts/test-db.ts` (`npm run db:test`) verifies the connection, tables, migrations and seed data
