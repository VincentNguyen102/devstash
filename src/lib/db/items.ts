import { connection } from "next/server";

import { systemTypeOrder } from "@/lib/item-type-meta";
import { prisma } from "@/lib/prisma";

// Auth is not wired up yet, so dashboard data is scoped to the seeded demo
// user. Replace this with the signed-in user once NextAuth is in place.
const DEMO_USER_EMAIL = "demo@devstash.io";

export interface ItemSummary {
  id: string;
  title: string;
  description: string;
  typeId: string;
  isFavorite: boolean;
  isPinned: boolean;
  tags: string[];
  updatedAt: Date;
}

export interface ItemStats {
  total: number;
  favorites: number;
}

export interface ItemTypeSummary {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  /** Number of the demo user's items of this type. */
  itemCount: number;
}

/** Query the demo user's items, newest first, mapped to the row shape. */
async function findItemSummaries(
  filter: { isPinned?: boolean },
  limit?: number,
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { user: { email: DEMO_USER_EMAIL }, ...filter },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      typeId: true,
      isFavorite: true,
      isPinned: true,
      updatedAt: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    typeId: item.typeId,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    tags: item.tags.map(({ tag }) => tag.name),
    updatedAt: item.updatedAt,
  }));
}

/** The demo user's pinned items, most recently updated first. */
export async function getPinnedItems(): Promise<ItemSummary[]> {
  // Prisma queries are not tied to a request-time API, so opt into dynamic
  // rendering explicitly instead of baking the result into a static shell.
  await connection();

  return findItemSummaries({ isPinned: true });
}

/** The demo user's most recently updated items. */
export async function getRecentItems(limit = 10): Promise<ItemSummary[]> {
  await connection();

  return findItemSummaries({}, limit);
}

/** Aggregate item counts for the dashboard stat cards. */
export async function getItemStats(): Promise<ItemStats> {
  await connection();

  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { user: { email: DEMO_USER_EMAIL } } }),
    prisma.item.count({
      where: { user: { email: DEMO_USER_EMAIL }, isFavorite: true },
    }),
  ]);

  return { total, favorites };
}

/**
 * The system item types with the demo user's item count per type, for the
 * sidebar. Types with no items are included so the full set is always visible.
 */
export async function getItemTypes(): Promise<ItemTypeSummary[]> {
  await connection();

  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({ where: { isSystem: true } }),
    prisma.item.groupBy({
      by: ["typeId"],
      where: { user: { email: DEMO_USER_EMAIL } },
      _count: { _all: true },
    }),
  ]);

  const countByTypeId = new Map(
    counts.map(({ typeId, _count }) => [typeId, _count._all])
  );

  return types
    .map((type) => ({
      id: type.id,
      name: type.name,
      icon: type.icon,
      color: type.color,
      itemCount: countByTypeId.get(type.id) ?? 0,
    }))
    .sort((a, b) => systemTypeOrder(a.id) - systemTypeOrder(b.id));
}
