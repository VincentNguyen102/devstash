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

/**
 * Item types that can be created from the New Item dialog. The text system
 * types plus `url` (the "Link" option) and the two upload-backed types
 * (`file` and `image`), in canonical order.
 */
export const CREATE_ITEM_TYPE_IDS = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "url",
] as const;

export type CreateItemTypeId = (typeof CREATE_ITEM_TYPE_IDS)[number];

/** Type guard for the creatable item type ids. */
export function isCreateItemTypeId(value: string): value is CreateItemTypeId {
  return (CREATE_ITEM_TYPE_IDS as readonly string[]).includes(value);
}

/** Item types backed by an uploaded object rather than inline content. */
export function isUploadItemTypeId(
  value: string,
): value is "file" | "image" {
  return value === "file" || value === "image";
}

/** Optional positive integer, e.g. an uploaded file's size in bytes. */
const nullableFileSize = z
  .number()
  .int()
  .nonnegative()
  .nullish()
  .transform((value) => value ?? null);

/**
 * Validation for creating an item. Reuses the edit fields (title, description,
 * content, url, language, tags) and adds the item type plus the storage
 * metadata for upload-backed types. A `url` item must carry a URL; a `file` or
 * `image` item must carry an uploaded object key.
 */
export const createItemSchema = updateItemSchema
  .extend({
    typeId: z.enum(CREATE_ITEM_TYPE_IDS),
    fileKey: nullableText,
    fileName: nullableText,
    fileSize: nullableFileSize,
  })
  .superRefine((data, ctx) => {
    if (data.typeId === "url" && !data.url) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "URL is required",
      });
    }

    if (isUploadItemTypeId(data.typeId) && !data.fileKey) {
      ctx.addIssue({
        code: "custom",
        path: ["fileKey"],
        message: "Upload a file first",
      });
    }
  });

/** Shape accepted by the action (before defaults/transforms). */
export type CreateItemInput = z.input<typeof createItemSchema>;

/** Shape passed to the data layer after parsing. */
export type CreateItemData = z.output<typeof createItemSchema>;
