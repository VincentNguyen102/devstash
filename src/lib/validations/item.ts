import { z } from "zod";

/**
 * Validation for editing an existing item. Shared by the `updateItem` server
 * action, which is the source of truth for the payload the drawer sends.
 *
 * Framework/DB free so it can be imported from actions, route handlers and
 * tests alike.
 */

/**
 * Optional free-text field. `null`, `undefined` and whitespace-only input all
 * normalise to `null`; any other value is kept verbatim (content is not
 * trimmed so code formatting survives an edit).
 */
const nullableText = z
  .string()
  .nullish()
  .transform((value) => (value == null || value.trim() === "" ? null : value));

/** Optional URL. Blank input normalises to `null`; anything else must parse. */
const nullableUrl = z
  .string()
  .nullish()
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed === "" ? null : trimmed;
  })
  .pipe(z.url("Enter a valid URL").nullable());

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: nullableText,
  content: nullableText,
  url: nullableUrl,
  language: nullableText,
  tags: z.array(z.string().trim().min(1, "Tags cannot be empty")).default([]),
});

/** Shape accepted by the action (before defaults/transforms). */
export type UpdateItemInput = z.input<typeof updateItemSchema>;

/** Shape passed to the data layer after parsing. */
export type UpdateItemData = z.output<typeof updateItemSchema>;
