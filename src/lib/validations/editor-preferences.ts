import { z } from "zod";

import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEME_IDS,
} from "@/lib/editor-preferences";

/**
 * Validation for the editor-preferences server action. Framework/DB free so it
 * can be imported from the action and tests alike.
 *
 * Every field is required and constrained to the values the settings UI offers,
 * so an invalid payload never reaches the database's JSON column.
 */
export const editorPreferencesSchema = z.object({
  fontSize: z
    .number()
    .int()
    .refine((value) => (EDITOR_FONT_SIZES as readonly number[]).includes(value), {
      message: "Unsupported font size.",
    }),
  tabSize: z
    .number()
    .int()
    .refine((value) => (EDITOR_TAB_SIZES as readonly number[]).includes(value), {
      message: "Unsupported tab size.",
    }),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEME_IDS),
});

/** Shape accepted by the action (before parsing). */
export type EditorPreferencesInput = z.input<typeof editorPreferencesSchema>;

/** Shape passed to the data layer after parsing. */
export type EditorPreferencesData = z.output<typeof editorPreferencesSchema>;
