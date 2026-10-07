/**
 * Shared sizing for the code and markdown editors so both grow and clamp their
 * height the same way.
 */

/** Minimum editor height in pixels. */
export const EDITOR_MIN_HEIGHT = 96;

/** Maximum editor height in pixels; longer content scrolls internally. */
export const EDITOR_MAX_HEIGHT = 400;

/** Clamps a measured content height into the editor's min/max range. */
export function clampEditorHeight(height: number): number {
  if (!Number.isFinite(height)) return EDITOR_MIN_HEIGHT;

  return Math.min(
    Math.max(Math.round(height), EDITOR_MIN_HEIGHT),
    EDITOR_MAX_HEIGHT,
  );
}
