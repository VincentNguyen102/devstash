import { z } from "zod";

/**
 * Validation for creating a collection. Framework/DB free so it can be imported
 * from actions, route handlers and tests alike.
 *
 * The name is required and trimmed; a blank or missing description normalises
 * to `null` so the DB column stays clean.
 */
export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z
    .string()
    .nullish()
    .transform((value) => (value == null || value.trim() === "" ? null : value)),
});

/** Shape accepted by the action (before defaults/transforms). */
export type CreateCollectionInput = z.input<typeof createCollectionSchema>;

/** Shape passed to the data layer after parsing. */
export type CreateCollectionData = z.output<typeof createCollectionSchema>;

/**
 * Editing a collection has the same name/description requirements as creating
 * one, so it reuses the create schema.
 */
export const updateCollectionSchema = createCollectionSchema;

/** Shape accepted by the update action (before defaults/transforms). */
export type UpdateCollectionInput = z.input<typeof updateCollectionSchema>;

/** Shape passed to the data layer after parsing. */
export type UpdateCollectionData = z.output<typeof updateCollectionSchema>;
