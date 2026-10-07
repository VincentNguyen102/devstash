import { getSessionUserId, jsonError, unauthorized } from "@/lib/api";
import { getItemFile } from "@/lib/db/items";
import { getObjectStream } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Streams a `file`/`image` item's stored object back to its owner. Proxying
 * through the app keeps the Tigris object private and avoids cross-origin
 * issues in the browser. Add `?download=1` to force a download.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/items/[id]/file">,
) {
  const userId = await getSessionUserId();

  if (!userId) {
    return unauthorized("You must be signed in to view this file.");
  }

  const { id } = await ctx.params;
  const item = await getItemFile(id, userId);

  if (!item) {
    return jsonError("File not found.", 404);
  }

  const download = new URL(request.url).searchParams.get("download") === "1";

  try {
    const object = await getObjectStream(
      item.fileUrl,
      download ? "attachment" : "inline",
    );

    if (!object) {
      return jsonError("File not found.", 404);
    }

    const fileName = item.fileName ?? "download";

    return new Response(object.body, {
      headers: {
        "Content-Type": object.contentType,
        "Content-Length": String(object.size),
        "Content-Disposition": contentDisposition(download, fileName),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("File download failed", error);

    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** Attachment/inline disposition with a UTF-8 safe filename. */
function contentDisposition(download: boolean, fileName: string): string {
  const type = download ? "attachment" : "inline";
  const encoded = encodeURIComponent(fileName);

  return `${type}; filename="${encoded}"; filename*=UTF-8''${encoded}`;
}
