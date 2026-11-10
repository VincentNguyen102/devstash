import { z } from "zod";

/**
 * Input accepted by the auto-tagging action. The title is what gives the model
 * enough context to suggest useful tags; content is optional because link and
 * upload items may not have any.
 */
export const generateAutoTagsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Add a title before suggesting tags")
    .max(200, "Title is too long"),
  content: z.string().max(20_000, "Content is too long").optional().default(""),
});

export type GenerateAutoTagsInput = z.input<typeof generateAutoTagsSchema>;

/**
 * Input accepted by the description generator. Every field comes from the
 * unsaved form; the item does not need to exist yet.
 */
export const generateDescriptionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Add a title before generating a description")
    .max(200, "Title is too long"),
  typeId: z.string().trim().max(40).optional().default(""),
  language: z.string().trim().max(40).optional().default(""),
  content: z.string().max(20_000, "Content is too long").optional().default(""),
  url: z.string().trim().max(2_048, "URL is too long").optional().default(""),
  fileName: z
    .string()
    .trim()
    .max(255, "File name is too long")
    .optional()
    .default(""),
  tags: z.string().trim().max(500, "Tags are too long").optional().default(""),
});

export type GenerateDescriptionInput = z.input<
  typeof generateDescriptionSchema
>;

/**
 * Input accepted by the code-explanation action. The drawer already has the
 * item, so the client sends the code and language rather than an item id.
 */
export const explainCodeSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "There is no code to explain")
    .max(20_000, "Code is too long"),
  language: z.string().trim().max(40).optional().default(""),
  typeId: z.string().trim().max(40).optional().default(""),
});

export type ExplainCodeInput = z.input<typeof explainCodeSchema>;

