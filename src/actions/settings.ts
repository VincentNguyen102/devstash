"use server";

import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesRecord } from "@/lib/db/settings";
import type { EditorPreferences } from "@/lib/editor-preferences";
import {
  editorPreferencesSchema,
  type EditorPreferencesInput,
} from "@/lib/validations/editor-preferences";

export interface UpdateEditorPreferencesResult {
  success: boolean;
  data?: EditorPreferences;
  error?: string;
}

/**
 * Persists the signed-in user's editor preferences. Zod validates the full
 * payload (the settings UI always sends every field) and the stored value is
 * returned so the caller can sync without a second fetch.
 */
export async function updateEditorPreferences(
  input: EditorPreferencesInput,
): Promise<UpdateEditorPreferencesResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  const parsed = editorPreferencesSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const preferences = await updateEditorPreferencesRecord(
      session.user.id,
      parsed.data,
    );

    return { success: true, data: preferences };
  } catch (error) {
    console.error("Update editor preferences failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
