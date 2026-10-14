"use server";

import { auth } from "@/auth";
import {
  createCollection as createCollectionRecord,
  deleteCollection as deleteCollectionRecord,
  updateCollection as updateCollectionRecord,
  type CollectionSummary,
} from "@/lib/db/collections";
import {
  createCollectionSchema,
  updateCollectionSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
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

export interface UpdateCollectionResult {
  success: boolean;
  data?: CollectionSummary;
  error?: string;
}

/**
 * Updates the name/description of a collection owned by the signed-in user.
 * Zod validates the payload and ownership is enforced by the query, which
 * returns null for a collection that is not the user's.
 */
export async function updateCollection(
  collectionId: string,
  input: UpdateCollectionInput,
): Promise<UpdateCollectionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  const parsed = updateCollectionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const collection = await updateCollectionRecord(
      session.user.id,
      collectionId,
      parsed.data,
    );

    if (!collection) {
      return { success: false, error: "Collection not found." };
    }

    return { success: true, data: collection };
  } catch (error) {
    console.error("Update collection failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

export interface DeleteCollectionResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes a collection owned by the signed-in user. The items it contained are
 * not deleted — they simply stop belonging to the collection.
 */
export async function deleteCollection(
  collectionId: string,
): Promise<DeleteCollectionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  try {
    const deleted = await deleteCollectionRecord(session.user.id, collectionId);

    if (!deleted) {
      return { success: false, error: "Collection not found." };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete collection failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
