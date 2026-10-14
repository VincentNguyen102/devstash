import { connection } from "next/server";

import {
  normalizeEditorPreferences,
  type EditorPreferences,
} from "@/lib/editor-preferences";
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

/**
 * The signed-in user's editor preferences. Used by the dashboard shell to seed
 * the client `EditorPreferencesProvider` on every page. Falls back to the
 * defaults when the user does not exist (the session is then stale and the
 * caller redirects to sign-in anyway).
 */
export async function getEditorPreferences(
  userId: string,
): Promise<EditorPreferences> {
  await connection();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });

  return normalizeEditorPreferences(user?.editorPreferences);
}

/**
 * Persists a complete set of editor preferences for `userId` and returns the
 * stored value.
 */
export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<EditorPreferences> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: preferences },
    select: { editorPreferences: true },
  });

  return normalizeEditorPreferences(user.editorPreferences);
}
