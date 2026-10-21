import { connection } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { DASHBOARD_COLLECTIONS_LIMIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type {
  CreateCollectionData,
  UpdateCollectionData,
} from "@/lib/validations/collection";

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

/** A collection summary plus the timestamp the favorites page sorts by. */
export interface FavoriteCollectionSummary extends CollectionSummary {
  updatedAt: Date;
}

export interface CollectionStats {
  total: number;
  favorites: number;
}

const COLLECTION_SUMMARY_SELECT = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  items: { select: { item: { select: { typeId: true } } } },
} satisfies Prisma.CollectionSelect;

type CollectionSummaryRow = Prisma.CollectionGetPayload<{
  select: typeof COLLECTION_SUMMARY_SELECT;
}>;

const FAVORITE_COLLECTION_SELECT = {
  ...COLLECTION_SUMMARY_SELECT,
  updatedAt: true,
} satisfies Prisma.CollectionSelect;

type FavoriteCollectionRow = Prisma.CollectionGetPayload<{
  select: typeof FAVORITE_COLLECTION_SELECT;
}>;

/** Map a collection row (with its item types) to the shared summary shape. */
function toCollectionSummary(
  collection: CollectionSummaryRow,
): CollectionSummary {
  const counts = new Map<string, number>();

  for (const { item } of collection.items) {
    counts.set(item.typeId, (counts.get(item.typeId) ?? 0) + 1);
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
}

/** Map a favorite collection row to a summary plus its `updatedAt` date. */
function toFavoriteCollectionSummary(
  collection: FavoriteCollectionRow,
): FavoriteCollectionSummary {
  return {
    ...toCollectionSummary(collection),
    updatedAt: collection.updatedAt,
  };
}

/**
 * Query `userId`'s collections, most recently updated first, including the item
 * type breakdown used to render the type icons and border colours.
 */
async function findCollections(
  userId: string,
  limit?: number,
): Promise<CollectionSummary[]> {
  // Prisma queries are not tied to a request-time API, so opt into dynamic
  // rendering explicitly instead of baking the result into a static shell.
  await connection();

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: COLLECTION_SUMMARY_SELECT,
  });

  return collections.map(toCollectionSummary);
}

/** `userId`'s most recent collections for the dashboard grid. */
export async function getRecentCollections(
  userId: string,
  limit = DASHBOARD_COLLECTIONS_LIMIT,
): Promise<CollectionSummary[]> {
  return findCollections(userId, limit);
}

/** All of `userId`'s collections, for the sidebar and listing page. */
export async function getCollections(
  userId: string,
): Promise<CollectionSummary[]> {
  return findCollections(userId);
}

/** `userId`'s favorite collections, most recently updated first. */
export async function getFavoriteCollections(
  userId: string,
): Promise<FavoriteCollectionSummary[]> {
  await connection();

  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    select: FAVORITE_COLLECTION_SELECT,
  });

  return collections.map(toFavoriteCollectionSummary);
}

/**
 * A single collection owned by `userId`, or null when it does not exist or
 * belongs to someone else. Used by the `/collections/[id]` page.
 */
export async function getCollectionById(
  userId: string,
  id: string,
): Promise<CollectionSummary | null> {
  await connection();

  const collection = await prisma.collection.findFirst({
    where: { id, userId },
    select: COLLECTION_SUMMARY_SELECT,
  });

  return collection ? toCollectionSummary(collection) : null;
}

/** Aggregate collection counts for the dashboard stat cards. */
export async function getCollectionStats(
  userId: string,
): Promise<CollectionStats> {
  await connection();

  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}

/**
 * Creates a collection owned by `userId`. A new collection has no items yet, so
 * its summary is returned with zero counts and no type breakdown.
 */
export async function createCollection(
  userId: string,
  data: CreateCollectionData,
): Promise<CollectionSummary> {
  await connection();

  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? "",
    isFavorite: collection.isFavorite,
    itemCount: 0,
    typeIds: [],
    dominantTypeId: null,
  };
}

/**
 * Sets the favorite flag on a collection owned by `userId`, returning the
 * refreshed summary or null when the collection does not exist or belongs to
 * someone else. The desired value is passed explicitly so the write is
 * idempotent rather than toggling whatever is currently stored.
 */
export async function setCollectionFavorite(
  userId: string,
  id: string,
  isFavorite: boolean,
): Promise<CollectionSummary | null> {
  await connection();

  const result = await prisma.collection.updateMany({
    where: { id, userId },
    data: { isFavorite },
  });

  if (result.count === 0) {
    return null;
  }

  return getCollectionById(userId, id);
}

/**
 * Updates the name/description of a collection owned by `userId`. Returns the
 * refreshed summary, or null when the collection does not exist or belongs to
 * someone else.
 */
export async function updateCollection(
  userId: string,
  id: string,
  data: UpdateCollectionData,
): Promise<CollectionSummary | null> {
  await connection();

  const result = await prisma.collection.updateMany({
    where: { id, userId },
    data: { name: data.name, description: data.description },
  });

  if (result.count === 0) {
    return null;
  }

  return getCollectionById(userId, id);
}

/**
 * Deletes a collection owned by `userId`. Only the collection (and its
 * `ItemCollection` links via cascade) is removed — the items themselves are
 * left untouched. Returns false when nothing was deleted.
 */
export async function deleteCollection(
  userId: string,
  id: string,
): Promise<boolean> {
  await connection();

  const result = await prisma.collection.deleteMany({ where: { id, userId } });

  return result.count > 0;
}

/**
 * The subset of `ids` that are collections owned by `userId`. Used to reject a
 * crafted payload that tries to attach an item to someone else's collection.
 */
export async function getOwnedCollectionIds(
  userId: string,
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });

  return collections.map((collection) => collection.id);
}
