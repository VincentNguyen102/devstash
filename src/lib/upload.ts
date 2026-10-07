/**
 * Pure helpers for file and image uploads: the size/extension allow-lists, the
 * shared validation used by both the browser (`FileUpload`) and the upload API
 * route, and the object-key builder for Tigris storage.
 *
 * Kept free of framework and storage imports so it can run on the client, on
 * the server and in Vitest without any setup.
 */

/** The two kinds of uploads the app supports. */
export const UPLOAD_KINDS = ["file", "image"] as const;

export type UploadKind = (typeof UPLOAD_KINDS)[number];

/** Type guard for an untrusted upload kind (e.g. a `FormData` field). */
export function isUploadKind(value: unknown): value is UploadKind {
  return value === "file" || value === "image";
}

const KB = 1024;
const MB = 1024 * KB;

/** Maximum upload size per kind. */
export const MAX_UPLOAD_BYTES: Record<UploadKind, number> = {
  image: 5 * MB,
  file: 10 * MB,
};

/** Extensions accepted for images, without the leading dot. */
export const IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
] as const;

/** Extensions accepted for files, without the leading dot. */
export const FILE_EXTENSIONS = [
  "pdf",
  "txt",
  "md",
  "json",
  "yaml",
  "yml",
  "xml",
  "csv",
  "toml",
  "ini",
] as const;

/** Accepted extensions per kind, lowercased. */
export const UPLOAD_EXTENSIONS: Record<UploadKind, readonly string[]> = {
  image: IMAGE_EXTENSIONS,
  file: FILE_EXTENSIONS,
};

/** Canonical MIME type for each accepted extension. */
const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
  xml: "application/xml",
  csv: "text/csv",
  toml: "application/toml",
  ini: "text/plain",
};

/** The lowercase extension of a filename, without the dot ("" when none). */
export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");

  if (dot === -1 || dot === fileName.length - 1) {
    return "";
  }

  return fileName.slice(dot + 1).toLowerCase();
}

/** The canonical MIME type for a filename, or `application/octet-stream`. */
export function inferContentType(fileName: string): string {
  return MIME_BY_EXTENSION[extensionOf(fileName)] ?? "application/octet-stream";
}

/** `accept` attribute value for a file input of the given kind. */
export function acceptAttribute(kind: UploadKind): string {
  return UPLOAD_EXTENSIONS[kind].map((extension) => `.${extension}`).join(",");
}

export type UploadValidation =
  | { ok: true; extension: string; contentType: string }
  | { ok: false; error: string };

/**
 * Validates a file against the size and extension rules for its kind. The
 * browser-reported MIME type is intentionally ignored in favour of the
 * extension, which a server can trust more than a client-supplied header.
 */
export function validateUpload(
  file: { name: string; size: number },
  kind: UploadKind,
): UploadValidation {
  const extension = extensionOf(file.name);

  if (!extension || !UPLOAD_EXTENSIONS[kind].includes(extension)) {
    return {
      ok: false,
      error:
        kind === "image"
          ? "Unsupported image. Use PNG, JPG, GIF, WEBP or SVG."
          : "Unsupported file type.",
    };
  }

  if (file.size <= 0) {
    return { ok: false, error: "That file is empty." };
  }

  if (file.size > MAX_UPLOAD_BYTES[kind]) {
    return {
      ok: false,
      error: `That file is too large. The maximum is ${formatFileSize(
        MAX_UPLOAD_BYTES[kind],
      )}.`,
    };
  }

  return { ok: true, extension, contentType: inferContentType(file.name) };
}

/**
 * Builds the storage key for an upload. Keys are namespaced by user so the
 * server can verify ownership, and carry a random id to avoid collisions.
 */
export function buildStorageKey(userId: string, fileName: string): string {
  const extension = extensionOf(fileName);
  const unique = crypto.randomUUID();

  return `uploads/${userId}/${unique}${extension ? `.${extension}` : ""}`;
}

/** True when `key` was issued to `userId` by {@link buildStorageKey}. */
export function isStorageKeyForUser(key: string, userId: string): boolean {
  return key.startsWith(`uploads/${userId}/`);
}

/** Human-readable byte size, e.g. `1.5 MB`. */
export function formatFileSize(bytes: number): string {
  if (bytes < KB) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / KB;

  if (kilobytes < KB) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / KB).toFixed(1)} MB`;
}
