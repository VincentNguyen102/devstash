import { NextResponse } from "next/server";

import { getSessionUserId, jsonError, unauthorized } from "@/lib/api";
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
  const userId = await getSessionUserId();

  if (!userId) {
    return unauthorized("You must be signed in to upload files.");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid upload.", 400);
  }

  const kind = formData.get("kind");

  if (!isUploadKind(kind)) {
    return jsonError("Unknown upload type.", 400);
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("No file provided.", 400);
  }

  const validation = validateUpload({ name: file.name, size: file.size }, kind);

  if (!validation.ok) {
    return jsonError(validation.error, 400);
  }

  try {
    const key = buildStorageKey(userId, file.name);
    const stored = await uploadObject({
      key,
      body: file,
      contentType: validation.contentType,
    });

    if (!stored) {
      return jsonError("Upload failed. Please try again.", 502);
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

    return jsonError("Upload failed. Please try again.", 500);
  }
}
