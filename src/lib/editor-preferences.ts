/**
 * Editor preferences: the shape stored in the `User.editorPreferences` JSON
 * column and consumed by the Monaco-backed `CodeEditor`.
 *
 * Framework-free so it can be imported from server code, client components and
 * tests alike. Anything read from the database is passed through
 * `normalizeEditorPreferences` so a missing/partial/legacy value always yields a
 * complete, valid set of preferences.
 */

/** Monaco themes offered in the settings dropdown. */
export const EDITOR_THEME_IDS = ["vs-dark", "monokai", "github-dark"] as const;

export type EditorThemeId = (typeof EDITOR_THEME_IDS)[number];

/** Dropdown options for the theme select. */
export const EDITOR_THEME_OPTIONS: ReadonlyArray<{
  value: EditorThemeId;
  label: string;
}> = [
  { value: "vs-dark", label: "VS Dark" },
  { value: "monokai", label: "Monokai" },
  { value: "github-dark", label: "GitHub Dark" },
];

/** Font sizes (in pixels) offered in the settings dropdown. */
export const EDITOR_FONT_SIZES = [12, 13, 14, 16, 18, 20] as const;

/** Tab sizes offered in the settings dropdown. */
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;

/**
 * Editor preferences shape. Declared as a type alias (not an interface) so it
 * is assignable to Prisma's `InputJsonValue` when written to the JSON column.
 */
export type EditorPreferences = {
  fontSize: number;
  tabSize: number;
  /** Wrap long lines instead of scrolling horizontally. */
  wordWrap: boolean;
  /** Show the minimap gutter. */
  minimap: boolean;
  theme: EditorThemeId;
};

/** Defaults used for new accounts and for invalid/missing stored values. */
export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

/** Narrowing guard for a stored/input theme value. */
export function isEditorThemeId(value: unknown): value is EditorThemeId {
  return (
    typeof value === "string" &&
    (EDITOR_THEME_IDS as readonly string[]).includes(value)
  );
}

/** Narrowing guard for a supported font size. */
export function isEditorFontSize(value: unknown): value is number {
  return (
    typeof value === "number" &&
    (EDITOR_FONT_SIZES as readonly number[]).includes(value)
  );
}

/** Narrowing guard for a supported tab size. */
export function isEditorTabSize(value: unknown): value is number {
  return (
    typeof value === "number" &&
    (EDITOR_TAB_SIZES as readonly number[]).includes(value)
  );
}

/**
 * Coerces an unknown JSON value (e.g. straight from the `editorPreferences`
 * column) into a complete `EditorPreferences`. Each field falls back to its
 * default independently, so a partial object keeps every valid field it has.
 */
export function normalizeEditorPreferences(value: unknown): EditorPreferences {
  if (value === null || typeof value !== "object") {
    return { ...DEFAULT_EDITOR_PREFERENCES };
  }

  const record = value as Record<string, unknown>;

  return {
    fontSize: isEditorFontSize(record.fontSize)
      ? record.fontSize
      : DEFAULT_EDITOR_PREFERENCES.fontSize,
    tabSize: isEditorTabSize(record.tabSize)
      ? record.tabSize
      : DEFAULT_EDITOR_PREFERENCES.tabSize,
    wordWrap:
      typeof record.wordWrap === "boolean"
        ? record.wordWrap
        : DEFAULT_EDITOR_PREFERENCES.wordWrap,
    minimap:
      typeof record.minimap === "boolean"
        ? record.minimap
        : DEFAULT_EDITOR_PREFERENCES.minimap,
    theme: isEditorThemeId(record.theme)
      ? record.theme
      : DEFAULT_EDITOR_PREFERENCES.theme,
  };
}
