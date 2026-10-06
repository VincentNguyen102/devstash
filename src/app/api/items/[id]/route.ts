import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

/**
 * Returns the full detail for a single item owned by the signed-in user. The
 * client drawer fetches this on click so item lists stay lightweight.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/items/[id]">,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in to view this item." },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const item = await getItemDetail(id, session.user.id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Failed to load item", error);

    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
