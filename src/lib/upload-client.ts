import type { UploadKind } from "@/lib/upload";

/** Metadata returned by the upload route for a stored object. */
export interface UploadedFile {
  key: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export type UploadResult =
  | { ok: true; data: UploadedFile }
  | { ok: false; error: string };

/**
 * Uploads a file to `/api/upload` with `XMLHttpRequest` (so callers can show
 * progress) and resolves with the stored metadata or a user-facing error.
 * Client-only: depends on `XMLHttpRequest` and `FormData`.
 */
export function uploadFile(
  file: File,
  kind: UploadKind,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          success: boolean;
          data?: UploadedFile;
          error?: string;
        };

        if (xhr.status >= 200 && xhr.status < 300 && body.success && body.data) {
          resolve({ ok: true, data: body.data });
          return;
        }

        resolve({ ok: false, error: body.error ?? "Upload failed." });
      } catch {
        resolve({ ok: false, error: "Upload failed. Please try again." });
      }
    };

    xhr.onerror = () => {
      resolve({ ok: false, error: "Upload failed. Please try again." });
    };

    xhr.send(formData);
  });
}
