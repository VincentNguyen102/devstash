import { connection } from "next/server";

import { systemTypeOrder } from "@/lib/item-type-meta";
import { prisma } from "@/lib/prisma";

export interface ProfileTypeCount {
  id: string;
  name: string;
  icon: string | null;
  /** Number of the user's items of this type. */
  itemCount: number;
}

export interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  /** Whether the account can sign in with a password (credential account). */
  hasPassword: boolean;
  itemCount: number;
  collectionCount: number;
  /** System item types in canonical order, including types with no items. */
  typeCounts: ProfileTypeCount[];
}

/**
 * Fetch the signed-in user's profile info plus their usage statistics, scoped
 * entirely to `userId` (unlike the dashboard helpers, which use the demo user).
 *
 * Returns `null` when the user no longer exists, so the caller can sign out a
 * stale session.
 */
export async function getProfile(userId: string): Promise<ProfileData | null> {
  // Prisma queries are not tied to a request-time API, so opt into dynamic
  // rendering explicitly instead of baking the result into a static shell.
  await connection();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
    },
  });

  if (!user) {
    return null;
  }

  const [itemCount, collectionCount, types, counts] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({ where: { isSystem: true } }),
    prisma.item.groupBy({
      by: ["typeId"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const countByTypeId = new Map(
    counts.map(({ typeId, _count }) => [typeId, _count._all]),
  );

  const typeCounts = types
    .map((type) => ({
      id: type.id,
      name: type.name,
      icon: type.icon,
      itemCount: countByTypeId.get(type.id) ?? 0,
    }))
    .sort((a, b) => systemTypeOrder(a.id) - systemTypeOrder(b.id));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: Boolean(user.password),
    itemCount,
    collectionCount,
    typeCounts,
  };
}
