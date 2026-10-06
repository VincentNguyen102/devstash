"use server";

import { auth } from "@/auth";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  updateItem as updateItemRecord,
  type ItemDetail,
} from "@/lib/db/items";
import {
  createItemSchema,
  updateItemSchema,
  type CreateItemInput,
  type UpdateItemInput,
} from "@/lib/validations/item";

export interface CreateItemResult {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

/**
 * Creates an item owned by the signed-in user. Zod validates the payload (the
 * source of truth), including the required URL for `url` items, and the
 * refreshed detail is returned so the caller can react without a second fetch.
 */
export async function createItem(
  input: CreateItemInput,
): Promise<CreateItemResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  const parsed = createItemSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const item = await createItemRecord(session.user.id, parsed.data);

    if (!item) {
      return { success: false, error: "Couldn't create item." };
    }

    return { success: true, data: item };
  } catch (error) {
    console.error("Create item failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

export interface UpdateItemResult {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

/**
 * Persists edits to an item owned by the signed-in user. Zod validates the
 * payload (the source of truth), ownership is enforced by the query helper, and
 * the refreshed detail is returned so the drawer can update without a second
 * fetch.
 */
export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<UpdateItemResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  const parsed = updateItemSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const item = await updateItemRecord(itemId, session.user.id, parsed.data);

    if (!item) {
      return { success: false, error: "Item not found." };
    }

    return { success: true, data: item };
  } catch (error) {
    console.error("Update item failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

export interface DeleteItemResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes an item owned by the signed-in user. Ownership is enforced by the
 * query helper, so another user's item can never be removed.
 */
export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  try {
    const deleted = await deleteItemRecord(itemId, session.user.id);

    if (!deleted) {
      return { success: false, error: "Item not found." };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete item failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
