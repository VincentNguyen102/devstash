"use server";

import { auth } from "@/auth";
import {
  AI_MODEL,
  AUTO_TAG_INSTRUCTIONS,
  DESCRIPTION_INSTRUCTIONS,
  buildAutoTagInput,
  buildDescriptionInput,
  getOpenAIClient,
  isAiConfigured,
  parseAutoTagResponse,
  parseDescriptionResponse,
} from "@/lib/ai";
import { getBillingEntitlements } from "@/lib/db/billing";
import { getTypeLabel } from "@/lib/item-type-meta";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import {
  generateAutoTagsSchema,
  generateDescriptionSchema,
  type GenerateAutoTagsInput,
  type GenerateDescriptionInput,
} from "@/lib/validations/ai";

export interface GenerateAutoTagsResult {
  success: boolean;
  data?: { tags: string[] };
  error?: string;
}

/**
 * Suggests tags for the item currently being drafted. The title and content
 * come from the form (create and edit both have unsaved values), so no item is
 * read from the database. Pro gating and the rate limit are enforced here even
 * though the button is hidden for Free users.
 */
export async function generateAutoTags(
  input: GenerateAutoTagsInput,
): Promise<GenerateAutoTagsResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  const parsed = generateAutoTagsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const entitlement = await getBillingEntitlements(session.user.id);

    if (!entitlement) {
      return { success: false, error: "Account not found." };
    }

    if (!entitlement.isPro) {
      return {
        success: false,
        error: "AI features are available on the Pro plan.",
      };
    }

    if (!isAiConfigured()) {
      return {
        success: false,
        error: "AI is temporarily unavailable. Please try again.",
      };
    }

    const limit = await checkRateLimit(
      "aiTags",
      rateLimitKey("ai-tags", session.user.id),
    );

    if (!limit.success) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));

      return {
        success: false,
        error: `Too many tag suggestions. Please try again in ${minutes} minute${
          minutes === 1 ? "" : "s"
        }.`,
      };
    }

    const response = await getOpenAIClient().responses.create({
      model: AI_MODEL,
      instructions: AUTO_TAG_INSTRUCTIONS,
      input: buildAutoTagInput(parsed.data.title, parsed.data.content),
      reasoning: { effort: "minimal" },
      max_output_tokens: 400,
      text: { format: { type: "json_object" } },
    });

    const tags = parseAutoTagResponse(response.output_text);

    if (tags.length === 0) {
      return {
        success: false,
        error: "No tags were suggested. Try adding more detail.",
      };
    }

    return { success: true, data: { tags } };
  } catch (error) {
    console.error("Generate auto tags failed", error);

    return {
      success: false,
      error: "AI is temporarily unavailable. Please try again.",
    };
  }
}

export interface GenerateDescriptionResult {
  success: boolean;
  data?: { description: string };
  error?: string;
}

/**
 * Writes a concise description for the item currently being drafted. Title,
 * content, URL and file name come from the form (create and edit have unsaved
 * values), so no item is read from the database. Pro gating and the rate limit
 * are enforced here even though the button is hidden for Free users.
 */
export async function generateDescription(
  input: GenerateDescriptionInput,
): Promise<GenerateDescriptionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  const parsed = generateDescriptionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const entitlement = await getBillingEntitlements(session.user.id);

    if (!entitlement) {
      return { success: false, error: "Account not found." };
    }

    if (!entitlement.isPro) {
      return {
        success: false,
        error: "AI features are available on the Pro plan.",
      };
    }

    if (!isAiConfigured()) {
      return {
        success: false,
        error: "AI is temporarily unavailable. Please try again.",
      };
    }

    const limit = await checkRateLimit(
      "aiDescriptions",
      rateLimitKey("ai-descriptions", session.user.id),
    );

    if (!limit.success) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));

      return {
        success: false,
        error: `Too many description suggestions. Please try again in ${minutes} minute${
          minutes === 1 ? "" : "s"
        }.`,
      };
    }

    const { title, typeId, language, content, url, fileName, tags } =
      parsed.data;
    const response = await getOpenAIClient().responses.create({
      model: AI_MODEL,
      instructions: DESCRIPTION_INSTRUCTIONS,
      input: buildDescriptionInput({
        title,
        typeName: typeId ? getTypeLabel(typeId) : undefined,
        language,
        content,
        url,
        fileName,
        tags,
      }),
      reasoning: { effort: "minimal" },
      max_output_tokens: 300,
      text: { format: { type: "json_object" } },
    });

    const description = parseDescriptionResponse(response.output_text);

    if (!description) {
      return {
        success: false,
        error: "No description was generated. Try adding more detail.",
      };
    }

    return { success: true, data: { description } };
  } catch (error) {
    console.error("Generate description failed", error);

    return {
      success: false,
      error: "AI is temporarily unavailable. Please try again.",
    };
  }
}
