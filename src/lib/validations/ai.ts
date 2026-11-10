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
