"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { updateEditorPreferences } from "@/actions/settings";
import { EditorPreferencesContext } from "@/hooks/use-editor-preferences";
import type { EditorPreferences } from "@/lib/editor-preferences";

/** Single toast id so repeated auto-saves replace instead of stack. */
const SAVE_TOAST_ID = "editor-preferences-save";

interface EditorPreferencesProviderProps {
  children: ReactNode;
  /** Preferences resolved on the server and passed down from the layout. */
  initialPreferences: EditorPreferences;
}

/**
 * Owns the signed-in user's editor preferences, exposes them (and an auto-save
 * updater) through `useEditorPreferences`, and is mounted once in the dashboard
 * shell so both the `CodeEditor` and the settings page share one source.
 *
 * Updates apply optimistically and roll back if the server rejects them; a
 * success toast confirms the auto-save.
 */
export function EditorPreferencesProvider({
  children,
  initialPreferences,
}: EditorPreferencesProviderProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  // Mirrors the latest preferences so concurrent saves can roll back correctly.
  const latest = useRef(initialPreferences);

  const updatePreferences = useCallback(
    async (patch: Partial<EditorPreferences>) => {
      const previous = latest.current;
      const next = { ...previous, ...patch };

      latest.current = next;
      setPreferences(next);
      setIsSaving(true);

      try {
        const result = await updateEditorPreferences(next);

        if (!result.success || !result.data) {
          latest.current = previous;
          setPreferences(previous);
          toast.error(result.error ?? "Couldn't save editor preferences.");
          return false;
        }

        latest.current = result.data;
        setPreferences(result.data);
        toast.success("Editor preferences saved", { id: SAVE_TOAST_ID });
        return true;
      } catch {
        latest.current = previous;
        setPreferences(previous);
        toast.error("Couldn't save editor preferences.");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ preferences, isSaving, updatePreferences }),
    [preferences, isSaving, updatePreferences],
  );

  return (
    <EditorPreferencesContext.Provider value={value}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}
