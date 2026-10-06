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

/** Types whose `language` field is shown and editable. */
export const LANGUAGE_TYPE_IDS: ReadonlySet<string> = new Set([
  "snippet",
  "command",
]);

/** Types whose `url` field is shown and editable. */
export const URL_TYPE_IDS: ReadonlySet<string> = new Set(["url"]);
