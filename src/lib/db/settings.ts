import { connection } from "next/server";

import { prisma } from "@/lib/prisma";

export interface AccountSettings {
  /** Whether the account can sign in with a password (credential account). */
  hasPassword: boolean;
}

/**
 * The account-settings data the `/settings` page needs, scoped to `userId`.
 *
 * Returns `null` when the user no longer exists, so the caller can sign out a
 * stale session. Only the fields the page renders are queried — the profile
 * page's usage statistics are intentionally not loaded here.
 */
export async function getAccountSettings(
  userId: string,
): Promise<AccountSettings | null> {
  // Prisma queries are not tied to a request-time API, so opt into dynamic
  // rendering explicitly instead of baking the result into a static shell.
  await connection();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    return null;
  }

  return { hasPassword: Boolean(user.password) };
}
