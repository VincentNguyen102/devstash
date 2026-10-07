import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { uploadObject } from "@/lib/storage";
import {
  buildStorageKey,
  isUploadKind,
  validateUpload,
} from "@/lib/upload";

export const runtime = "nodejs";

/**
 * Accepts a single `file` upload (`kind` = `file` | `image`) from the signed-in
 * user, validates it against the size/extension rules and stores it in Tigris.
 * Returns the metadata the create form needs to persist the item.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in to upload files." },
      { status: 401 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid upload." },
      { status: 400 },
    );
  }

  const kind = formData.get("kind");

  if (!isUploadKind(kind)) {
    return NextResponse.json(
      { success: false, error: "Unknown upload type." },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "No file provided." },
      { status: 400 },
    );
  }

  const validation = validateUpload({ name: file.name, size: file.size }, kind);

  if (!validation.ok) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  try {
    const key = buildStorageKey(session.user.id, file.name);
    const stored = await uploadObject({
      key,
      body: file,
      contentType: validation.contentType,
    });

    if (!stored) {
      return NextResponse.json(
        { success: false, error: "Upload failed. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        key: stored.key,
        fileName: file.name,
        fileSize: stored.size,
        contentType: validation.contentType,
      },
    });
  } catch (error) {
    console.error("Upload failed", error);

    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
