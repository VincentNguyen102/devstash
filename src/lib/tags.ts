/**
 * Tag input helpers shared by the item drawer and the New Item dialog. Parsing
 * lives in one place so create and edit treat the comma-separated field the
 * same way.
 */

/** Splits the comma-separated tag input into a de-duplicated, trimmed array. */
export function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}
