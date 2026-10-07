/**
 * Item type ids grouped by the form fields they expose. Shared by the item
 * drawer and the New Item dialog so create and edit stay in sync.
 */

/** Types whose `content` field is shown and editable. */
export const CONTENT_TYPE_IDS: ReadonlySet<string> = new Set([
  "snippet",
  "prompt",
  "command",
  "note",
]);

/** Types rendered with the Monaco code editor instead of a plain textarea. */
export const CODE_TYPE_IDS: ReadonlySet<string> = new Set([
  "snippet",
  "command",
]);

/** Types rendered with the Markdown editor (Write/Preview) instead of a textarea. */
export const MARKDOWN_TYPE_IDS: ReadonlySet<string> = new Set([
  "note",
  "prompt",
]);

/** Types whose `language` field is shown and editable. */
export const LANGUAGE_TYPE_IDS: ReadonlySet<string> = new Set([
  "snippet",
  "command",
]);

/** Types whose `url` field is shown and editable. */
export const URL_TYPE_IDS: ReadonlySet<string> = new Set(["url"]);

/** Types whose content lives in Tigris instead of the `content` column. */
export const UPLOAD_TYPE_IDS: ReadonlySet<string> = new Set(["file", "image"]);

/** Types that render an inline image preview from the stored object. */
export const IMAGE_TYPE_IDS: ReadonlySet<string> = new Set(["image"]);

/** Types that render file information and a download action. */
export const FILE_TYPE_IDS: ReadonlySet<string> = new Set(["file"]);

/** The upload kind for an item type id, or null when it is not an upload. */
export function uploadKindForTypeId(typeId: string): "file" | "image" | null {
  return typeId === "file" || typeId === "image" ? typeId : null;
}
