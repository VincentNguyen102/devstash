import "dotenv/config";

import { prisma } from "@/lib/prisma";

// Built-in item types available to every user. Ids are stable slugs so the
// `/items/[type]` routes and the shared type visuals keep working now that
// data comes from the database. Custom types are created by Pro users and
// live alongside these with a `userId` set and `isSystem: false`.
const SYSTEM_ITEM_TYPES = [
  { id: "snippet", name: "Snippets", icon: "CodeXml", color: "#60a5fa" },
  { id: "prompt", name: "Prompts", icon: "Sparkles", color: "#a78bfa" },
  { id: "command", name: "Commands", icon: "Terminal", color: "#fb923c" },
  { id: "note", name: "Notes", icon: "StickyNote", color: "#facc15" },
  { id: "file", name: "Files", icon: "File", color: "#94a3b8" },
  { id: "image", name: "Images", icon: "Image", color: "#f472b6" },
  { id: "url", name: "Links", icon: "Link", color: "#4ade80" },
];

async function main() {
  // Upsert by id so re-running the seed is safe and never duplicates types.
  // (`@@unique([userId, name])` can't be used here because system types have
  // no `userId` and Postgres treats NULLs as distinct.)
  for (const { id, ...type } of SYSTEM_ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { id },
      update: { ...type, isSystem: true, userId: null },
      create: { id, ...type, isSystem: true },
    });
  }

  const count = await prisma.itemType.count({ where: { isSystem: true } });
  console.log(`Seeded ${count} system item types.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
