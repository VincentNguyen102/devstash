import { get, put, remove } from "@tigrisdata/storage";

import { inferContentType } from "@/lib/upload";

/**
 * Thin server-only wrapper around the Tigris object store. Configuration comes
 * from the `TIGRIS_STORAGE_*` environment variables (see `.env.example`); this
 * module only deals with object keys, never user input.
 */

export interface StoredObject {
  /** Object key within the bucket. */
  key: string;
  /** Stored size in bytes. */
  size: number;
  /** Stored content type, if the backend reported one. */
  contentType: string | null;
}

/** Uploads `body` to `key`, overwriting is disabled so keys stay unique. */
export async function uploadObject(input: {
  key: string;
  body: Blob | Buffer | ReadableStream | string;
  contentType: string;
}): Promise<StoredObject | null> {
  const { data, error } = await put(input.key, input.body, {
    access: "private",
    contentType: input.contentType,
    contentDisposition: "inline",
  });

  if (error || !data) {
    console.error("Tigris upload failed", error);

    return null;
  }

  return {
    key: data.path,
    size: data.size,
    contentType: data.contentType ?? input.contentType,
  };
}

/** Deletes `key`. Returns false when the object could not be removed. */
export async function deleteObject(key: string): Promise<boolean> {
  const { error } = await remove(key);

  if (error) {
    console.error("Tigris delete failed", error);

    return false;
  }

  return true;
}

export interface ObjectStream {
  body: ReadableStream;
  size: number;
  contentType: string;
}

/**
 * Streams `key` back from Tigris. `disposition` controls whether the browser
 * renders the object inline (previews) or downloads it (attachments).
 */
export async function getObjectStream(
  key: string,
  disposition: "inline" | "attachment" = "inline",
): Promise<ObjectStream | null> {
  const { data, error } = await get(key, "stream", {
    includeMetadata: true,
    contentDisposition: disposition,
  });

  if (error || !data) {
    if (error) console.error("Tigris download failed", error);

    return null;
  }

  return {
    body: data.body,
    size: data.metadata.size,
    contentType: data.metadata.contentType || inferContentType(key),
  };
}
