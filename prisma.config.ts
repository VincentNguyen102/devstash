import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 config: replaces the `url` in the datasource block and the
// `package.json#prisma` field. Environment variables are no longer loaded
// automatically, hence the `dotenv/config` import above.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Prisma 7 no longer seeds automatically after `migrate dev`/`reset`.
    // Run it explicitly with `npm run db:seed`.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI commands (migrations, introspection) prefer a direct,
    // non-pooled connection. `DIRECT_URL` is optional — it falls back to
    // `DATABASE_URL`. `process.env` is used instead of the `env()` helper so
    // that `prisma generate` still works when no database URL is configured.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
