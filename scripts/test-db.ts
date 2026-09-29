import "dotenv/config";

import { prisma } from "@/lib/prisma";

// Tables created by the initial migration (see `prisma/migrations`).
const EXPECTED_TABLES = [
  "Account",
  "Collection",
  "Item",
  "ItemTag",
  "ItemType",
  "Session",
  "Tag",
  "User",
  "VerificationToken",
];

// System item types created by `npm run db:seed`.
const EXPECTED_TYPE_IDS = ["snippet", "prompt", "command", "note", "file", "image", "url"];

// Demo data created by `npm run db:seed` (see `context/features/seed-spec.md`).
const DEMO_USER_EMAIL = "demo@devstash.io";
const EXPECTED_COLLECTION_NAMES = [
  "React Patterns",
  "AI Workflows",
  "DevOps",
  "Terminal Commands",
  "Design Resources",
];
const EXPECTED_ITEM_COUNT = 18;

interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

const checks: Check[] = [];

const check = (label: string, ok: boolean, detail: string) => {
  checks.push({ label, ok, detail });
};

/** Host of the database being tested (credentials stripped). */
const databaseHost = () => {
  const url = process.env.DATABASE_URL;

  if (!url) return "DATABASE_URL is not set";

  try {
    return new URL(url).host;
  } catch {
    return "DATABASE_URL could not be parsed";
  }
};

const list = (values: string[]) => values.join(", ") || "none";

async function runChecks() {
  const [version] = await prisma.$queryRaw<{ version: string }[]>`
    SELECT version() AS version
  `;
  check("connection", true, version.version.split(",")[0]);

  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name::text AS table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  const tableNames = tables.map((table) => table.table_name);
  const missingTables = EXPECTED_TABLES.filter((table) => !tableNames.includes(table));
  check(
    "tables",
    missingTables.length === 0,
    missingTables.length
      ? `missing: ${list(missingTables)} (run npm run db:migrate)`
      : `${EXPECTED_TABLES.length}/${EXPECTED_TABLES.length} expected tables present`,
  );

  const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name::text AS migration_name
    FROM _prisma_migrations
    WHERE finished_at IS NOT NULL
    ORDER BY finished_at
  `;
  check(
    "migrations",
    migrations.length > 0,
    migrations.length
      ? `${migrations.length} applied, latest: ${migrations[migrations.length - 1].migration_name}`
      : "none applied (run npm run db:migrate)",
  );

  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    select: { id: true },
  });
  const typeIds = systemTypes.map((type) => type.id);
  const missingTypes = EXPECTED_TYPE_IDS.filter((id) => !typeIds.includes(id));
  check(
    "system types",
    missingTypes.length === 0,
    missingTypes.length
      ? `missing: ${list(missingTypes)} (run npm run db:seed)`
      : `${EXPECTED_TYPE_IDS.length}/${EXPECTED_TYPE_IDS.length} seeded`,
  );

  const demoUser = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  check(
    "demo user",
    demoUser !== null,
    demoUser
      ? DEMO_USER_EMAIL
      : `missing ${DEMO_USER_EMAIL} (run npm run db:seed)`,
  );

  const collections = demoUser
    ? await prisma.collection.findMany({
        where: { userId: demoUser.id },
        select: { name: true },
      })
    : [];
  const collectionNames = collections.map((collection) => collection.name);
  const missingCollections = EXPECTED_COLLECTION_NAMES.filter(
    (name) => !collectionNames.includes(name),
  );
  check(
    "demo collections",
    demoUser !== null && missingCollections.length === 0,
    missingCollections.length
      ? `missing: ${list(missingCollections)} (run npm run db:seed)`
      : `${EXPECTED_COLLECTION_NAMES.length}/${EXPECTED_COLLECTION_NAMES.length} seeded`,
  );

  const itemCount = demoUser
    ? await prisma.item.count({ where: { userId: demoUser.id } })
    : 0;
  check(
    "demo items",
    itemCount >= EXPECTED_ITEM_COUNT,
    itemCount >= EXPECTED_ITEM_COUNT
      ? `${itemCount} seeded`
      : `${itemCount}/${EXPECTED_ITEM_COUNT} seeded (run npm run db:seed)`,
  );

  return Promise.all([
    prisma.user.count(),
    prisma.collection.count(),
    prisma.item.count(),
    prisma.tag.count(),
  ]).then(
    ([users, collections, items, tags]) =>
      `users: ${users}, collections: ${collections}, items: ${items}, tags: ${tags}`,
  );
}

function report() {
  const width = Math.max(...checks.map((entry) => entry.label.length));

  for (const entry of checks) {
    console.log(`${entry.ok ? "PASS" : "FAIL"}  ${entry.label.padEnd(width)}  ${entry.detail}`);
  }

  const failed = checks.filter((entry) => !entry.ok);
  console.log(failed.length ? `\n${failed.length} check(s) failed.` : "\nAll checks passed.");

  return failed.length === 0;
}

async function main() {
  console.log(`Database check → ${databaseHost()}\n`);

  const counts = await runChecks();
  const ok = report();

  console.log(`Rows → ${counts}`);

  await prisma.$disconnect();

  if (!ok) process.exitCode = 1;
}

main().catch(async (error: unknown) => {
  console.error(`\nDatabase check failed: ${error instanceof Error ? error.message : error}`);
  await prisma.$disconnect();
  process.exit(1);
});
