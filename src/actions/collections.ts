"use server";

import { auth } from "@/auth";
import {
  createCollection as createCollectionRecord,
  type CollectionSummary,
} from "@/lib/db/collections";
import {
  createCollectionSchema,
  type CreateCollectionInput,
} from "@/lib/validations/collection";

export interface CreateCollectionResult {
  success: boolean;
  data?: CollectionSummary;
  error?: string;
}

/**
 * Creates a collection owned by the signed-in user. Zod validates the payload
 * (the source of truth) and the new summary is returned so the caller can
 * react without a second fetch.
 */
export async function createCollection(
  input: CreateCollectionInput,
): Promise<CreateCollectionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  const parsed = createCollectionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const collection = await createCollectionRecord(
      session.user.id,
      parsed.data,
    );

    return { success: true, data: collection };
  } catch (error) {
    console.error("Create collection failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
