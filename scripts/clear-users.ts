import "dotenv/config";

import { prisma } from "@/lib/prisma";

import { seed } from "../prisma/seed";

// Dev-only cleanup: remove every account except the demo user, reset the demo
// user's content, then re-seed it. Keeping the demo user (rather than deleting
// and recreating it) preserves its id and any active sessions.
const DEMO_USER_EMAIL = "demo@devstash.io";

async function main() {
  const demoUser = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  const removedUsers = await prisma.user.deleteMany({
    where: { email: { not: DEMO_USER_EMAIL } },
  });

  console.log(
    `Removed ${removedUsers.count} user(s); kept ${
      demoUser ? DEMO_USER_EMAIL : "none (demo user will be recreated)"
    }.`,
  );

  if (demoUser) {
    // Delete the demo user's content so the seed below is the source of truth
    // (otherwise collections/items removed from the seed would linger).
    // ItemTag/ItemCollection links cascade with their items, collections and tags.
    const [items, collections, tags] = await prisma.$transaction([
      prisma.item.deleteMany({ where: { userId: demoUser.id } }),
      prisma.collection.deleteMany({ where: { userId: demoUser.id } }),
      prisma.tag.deleteMany({ where: { userId: demoUser.id } }),
    ]);

    console.log(
      `Cleared demo content: ${items.count} items, ${collections.count} collections, ${tags.count} tags.`,
    );
  }

  await seed();
}

main()
  .catch((error: unknown) => {
    console.error(`\nClear users failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
