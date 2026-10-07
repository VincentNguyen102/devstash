import { connection } from "next/server";

import { systemTypeOrder } from "@/lib/item-type-meta";
import { prisma } from "@/lib/prisma";
import {
  isUploadItemTypeId,
  type CreateItemData,
  type UpdateItemData,
} from "@/lib/validations/item";

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
  /** Text content for snippet/prompt/command/note items. */
  content: string | null;
  /** Link for `url` items. */
  url: string | null;
  /** Stored object name, set for `file`/`image` items. */
  fileName: string | null;
  /** Stored object size in bytes, set for `file`/`image` items. */
  fileSize: number | null;
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

export interface ItemDetail {
  id: string;
  title: string;
  description: string;
  typeId: string;
  typeName: string;
  typeIcon: string | null;
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  tags: string[];
  collectionId: string | null;
  collectionName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Query the demo user's items, newest first, mapped to the row shape. */
async function findItemSummaries(
  filter: { isPinned?: boolean; typeId?: string },
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
      content: true,
      url: true,
      fileName: true,
      fileSize: true,
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
    content: item.content,
    url: item.url,
    fileName: item.fileName,
    fileSize: item.fileSize,
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

/** The demo user's items of a single item type, most recently updated first. */
export async function getItemsByType(typeId: string): Promise<ItemSummary[]> {
  await connection();

  return findItemSummaries({ typeId });
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

/**
 * A single item type with the demo user's item count, or null when the id is
 * unknown. Used by the `/items/[type]` page to validate the route segment.
 */
export async function getItemTypeById(
  typeId: string,
): Promise<ItemTypeSummary | null> {
  await connection();

  const type = await prisma.itemType.findUnique({
    where: { id: typeId },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      _count: {
        select: {
          items: { where: { user: { email: DEMO_USER_EMAIL } } },
        },
      },
    },
  });

  if (!type) {
    return null;
  }

  return {
    id: type.id,
    name: type.name,
    icon: type.icon,
    color: type.color,
    itemCount: type._count.items,
  };
}

/** Selected item row for `ItemDetail`; keeps the mapper decoupled from Prisma. */
interface ItemDetailRow {
  id: string;
  title: string;
  description: string | null;
  typeId: string;
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: { name: string; icon: string | null };
  collection: { id: string; name: string } | null;
  tags: { tag: { name: string } }[];
}

/** Maps a selected item row to the drawer's `ItemDetail` shape. */
function mapItemDetail(item: ItemDetailRow): ItemDetail {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    typeId: item.typeId,
    typeName: item.type.name,
    typeIcon: item.type.icon,
    content: item.content,
    url: item.url,
    fileName: item.fileName,
    fileSize: item.fileSize,
    language: item.language,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    tags: item.tags.map(({ tag }) => tag.name),
    collectionId: item.collection?.id ?? null,
    collectionName: item.collection?.name ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * A single item's full detail for the signed-in user, or null when the item
 * does not exist or belongs to someone else. Used by `GET /api/items/[id]`.
 */
export async function getItemDetail(
  itemId: string,
  userId: string,
): Promise<ItemDetail | null> {
  await connection();

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: {
      id: true,
      title: true,
      description: true,
      typeId: true,
      content: true,
      url: true,
      fileName: true,
      fileSize: true,
      language: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      type: { select: { name: true, icon: true } },
      collection: { select: { id: true, name: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  if (!item) {
    return null;
  }

  return mapItemDetail(item);
}

/** The stored object backing a `file`/`image` item. */
export interface ItemFile {
  /** Tigris object key (stored in the legacy `fileUrl` column). */
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
}

/**
 * The storage object for a `file`/`image` item owned by `userId`, or null when
 * the item does not exist, belongs to someone else, or has no stored object.
 * Used by the download/preview proxy route.
 */
export async function getItemFile(
  itemId: string,
  userId: string,
): Promise<ItemFile | null> {
  await connection();

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { fileUrl: true, fileName: true, fileSize: true },
  });

  if (!item?.fileUrl) {
    return null;
  }

  return {
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
  };
}

/**
 * Deletes an item owned by `userId`, returning null when the item does not
 * exist or belongs to someone else. The deleted item's storage key is returned
 * so the caller can remove the backing Tigris object. The item's tag links are
 * removed by the cascade rule in the Prisma schema.
 */
export async function deleteItem(
  itemId: string,
  userId: string,
): Promise<{ fileKey: string | null } | null> {
  await connection();

  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findFirst({
      where: { id: itemId, userId },
      select: { fileUrl: true },
    });

    if (!item) {
      return null;
    }

    await tx.item.delete({ where: { id: itemId } });

    return { fileKey: item.fileUrl };
  });
}

/**
 * Nested Prisma payload that connects each tag to an item, creating any missing
 * tag for the user. De-duplicates names; shared by create and update.
 */
function tagConnections(userId: string, tags: string[]) {
  return [...new Set(tags)].map((name) => ({
    tag: {
      connectOrCreate: {
        where: { userId_name: { userId, name } },
        create: { name, userId },
      },
    },
  }));
}

/**
 * Creates an item owned by `userId`. Text types are stored as `text` content;
 * `file`/`image` types store the uploaded object's key, name and size. Each
 * supplied tag name is connected to the user's tag (created on demand). Returns
 * the refreshed detail, or null if the item cannot be read back.
 */
export async function createItem(
  userId: string,
  data: CreateItemData,
): Promise<ItemDetail | null> {
  await connection();

  const isUpload = isUploadItemTypeId(data.typeId);

  const item = await prisma.item.create({
    data: {
      title: data.title,
      contentType: isUpload ? "file" : "text",
      description: data.description,
      content: isUpload ? null : data.content,
      url: isUpload ? null : data.url,
      language: isUpload ? null : data.language,
      fileUrl: isUpload ? data.fileKey : null,
      fileName: isUpload ? data.fileName : null,
      fileSize: isUpload ? data.fileSize : null,
      userId,
      typeId: data.typeId,
      tags: { create: tagConnections(userId, data.tags) },
    },
    select: { id: true },
  });

  return getItemDetail(item.id, userId);
}

/**
 * Updates an item owned by `userId`. Tags are replaced wholesale: the item's
 * existing links are disconnected and each supplied name is connected to the
 * user's tag (created on demand). Returns the refreshed detail so the drawer
 * can render it without a second round-trip, or null when the item does not
 * exist or belongs to someone else.
 */
export async function updateItem(
  itemId: string,
  userId: string,
  data: UpdateItemData,
): Promise<ItemDetail | null> {
  await connection();

  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.item.update({
      where: { id: itemId },
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        language: data.language,
        tags: {
          deleteMany: {},
          create: tagConnections(userId, data.tags),
        },
      },
    });
  });

  return getItemDetail(itemId, userId);
}
