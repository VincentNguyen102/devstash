import { NextResponse } from "next/server";

import { getSessionUserId, jsonError, unauthorized } from "@/lib/api";
import { getItemDetail } from "@/lib/db/items";

/**
 * Returns the full detail for a single item owned by the signed-in user. The
 * client drawer fetches this on click so item lists stay lightweight.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/items/[id]">,
) {
  const userId = await getSessionUserId();

  if (!userId) {
    return unauthorized("You must be signed in to view this item.");
  }

  try {
    const { id } = await params;
    const item = await getItemDetail(id, userId);

    if (!item) {
      return jsonError("Item not found.", 404);
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Failed to load item", error);

    return jsonError("Something went wrong. Please try again.", 500);
  }
}
