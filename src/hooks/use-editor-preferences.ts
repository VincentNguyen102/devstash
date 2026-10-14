"use client";

import { createContext, useContext } from "react";

import type { EditorPreferences } from "@/lib/editor-preferences";

export interface EditorPreferencesContextValue {
  /** The signed-in user's current editor preferences. */
  preferences: EditorPreferences;
  /** Whether a preferences save is currently in flight. */
  isSaving: boolean;
  /**
   * Applies and persists a partial preferences update. Returns `true` when the
   * save succeeds. Used by the settings controls to auto-save on change.
   */
  updatePreferences: (patch: Partial<EditorPreferences>) => Promise<boolean>;
}

/** Context backing editor preferences; provided by `EditorPreferencesProvider`. */
export const EditorPreferencesContext =
  createContext<EditorPreferencesContextValue | null>(null);

/**
 * Read (and update) the current editor preferences from any client component.
 * The `CodeEditor` uses it to apply the user's font/tab/wrap/minimap/theme
 * settings; the settings page uses it to render and auto-save the controls.
 */
export function useEditorPreferences(): EditorPreferencesContextValue {
  const context = useContext(EditorPreferencesContext);

  if (!context) {
    throw new Error(
      "useEditorPreferences must be used within an EditorPreferencesProvider",
    );
  }

  return context;
}
