import { NextResponse } from "next/server";

import { getSessionUserId, jsonError, unauthorized } from "@/lib/api";
import { getCollections } from "@/lib/db/collections";

/**
 * Returns the signed-in user's collections. The dashboard UI fetches these
 * server-side, so this route exists for client-side callers that need the
 * user-scoped list without a full navigation.
 */
export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return unauthorized("You must be signed in to view collections.");
  }

  try {
    const collections = await getCollections(userId);

    return NextResponse.json({ success: true, data: collections });
  } catch (error) {
    console.error("Failed to load collections", error);

    return jsonError("Something went wrong. Please try again.", 500);
  }
}
