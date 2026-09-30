import { connection } from "next/server";

import { prisma } from "@/lib/prisma";

// Auth is not wired up yet, so dashboard data is scoped to the seeded demo
// user. Replace this with the signed-in user once NextAuth is in place.
const DEMO_USER_EMAIL = "demo@devstash.io";

export interface CollectionSummary {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  /** Distinct item type ids present in the collection, most-used first. */
  typeIds: string[];
  /** Type used by the most items, or null for an empty collection. */
  dominantTypeId: string | null;
}

export interface CollectionStats {
  total: number;
  favorites: number;
}

/**
 * Query the demo user's collections, most recently updated first, including the
 * item type breakdown used to render the type icons and border colours.
 */
async function findCollections(limit?: number): Promise<CollectionSummary[]> {
  // Prisma queries are not tied to a request-time API, so opt into dynamic
  // rendering explicitly instead of baking the result into a static shell.
  await connection();

  const collections = await prisma.collection.findMany({
    where: { user: { email: DEMO_USER_EMAIL } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      items: { select: { typeId: true } },
    },
  });

  return collections.map((collection) => {
    const counts = new Map<string, number>();

    for (const { typeId } of collection.items) {
      counts.set(typeId, (counts.get(typeId) ?? 0) + 1);
    }

    const typeIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([typeId]) => typeId);

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description ?? "",
      isFavorite: collection.isFavorite,
      itemCount: collection.items.length,
      typeIds,
      dominantTypeId: typeIds[0] ?? null,
    };
  });
}

/** Most recent collections for the dashboard grid. */
export async function getRecentCollections(
  limit = 6,
): Promise<CollectionSummary[]> {
  return findCollections(limit);
}

/** All of the demo user's collections, for the sidebar. */
export async function getCollections(): Promise<CollectionSummary[]> {
  return findCollections();
}

/** Aggregate collection counts for the dashboard stat cards. */
export async function getCollectionStats(): Promise<CollectionStats> {
  await connection();

  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { user: { email: DEMO_USER_EMAIL } } }),
    prisma.collection.count({
      where: { user: { email: DEMO_USER_EMAIL }, isFavorite: true },
    }),
  ]);

  return { total, favorites };
}
