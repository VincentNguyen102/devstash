import { describe, expect, it } from "vitest";

import {
  MAX_UPLOAD_BYTES,
  UPLOAD_EXTENSIONS,
  acceptAttribute,
  buildStorageKey,
  extensionOf,
  formatFileSize,
  inferContentType,
  isStorageKeyForUser,
  isUploadKind,
  validateUpload,
} from "@/lib/upload";

describe("isUploadKind", () => {
  it("accepts only file and image", () => {
    expect(isUploadKind("file")).toBe(true);
    expect(isUploadKind("image")).toBe(true);
    expect(isUploadKind("snippet")).toBe(false);
    expect(isUploadKind(null)).toBe(false);
    expect(isUploadKind(undefined)).toBe(false);
  });
});

describe("extensionOf", () => {
  it("returns the lowercased extension without the dot", () => {
    expect(extensionOf("Photo.PNG")).toBe("png");
    expect(extensionOf("archive.tar.gz")).toBe("gz");
  });

  it("returns an empty string when there is no extension", () => {
    expect(extensionOf("README")).toBe("");
    expect(extensionOf("trailing.")).toBe("");
  });
});

describe("inferContentType", () => {
  it("maps known extensions to MIME types", () => {
    expect(inferContentType("a.png")).toBe("image/png");
    expect(inferContentType("a.svg")).toBe("image/svg+xml");
    expect(inferContentType("a.yaml")).toBe("application/x-yaml");
    expect(inferContentType("a.ini")).toBe("text/plain");
  });

  it("falls back to octet-stream", () => {
    expect(inferContentType("a.exe")).toBe("application/octet-stream");
  });
});

describe("acceptAttribute", () => {
  it("lists dotted extensions for the kind", () => {
    expect(acceptAttribute("image")).toBe(".png,.jpg,.jpeg,.gif,.webp,.svg");
    expect(acceptAttribute("file")).toContain(".pdf");
  });
});

describe("validateUpload", () => {
  it("accepts an image within the size limit", () => {
    const result = validateUpload({ name: "photo.jpg", size: 1024 }, "image");

    expect(result).toEqual({
      ok: true,
      extension: "jpg",
      contentType: "image/jpeg",
    });
  });

  it("accepts a document within the size limit", () => {
    const result = validateUpload({ name: "notes.pdf", size: 1024 }, "file");

    expect(result.ok).toBe(true);
  });

  it("rejects an unsupported extension for the kind", () => {
    expect(validateUpload({ name: "photo.pdf", size: 10 }, "image").ok).toBe(
      false,
    );
    expect(validateUpload({ name: "notes.png", size: 10 }, "file").ok).toBe(
      false,
    );
  });

  it("rejects a file with no extension", () => {
    expect(validateUpload({ name: "README", size: 10 }, "file").ok).toBe(false);
  });

  it("rejects empty files", () => {
    expect(validateUpload({ name: "notes.txt", size: 0 }, "file").ok).toBe(
      false,
    );
  });

  it("rejects images over 5 MB", () => {
    const result = validateUpload(
      { name: "big.png", size: MAX_UPLOAD_BYTES.image + 1 },
      "image",
    );

    expect(result.ok).toBe(false);
  });

  it("rejects files over 10 MB", () => {
    const result = validateUpload(
      { name: "big.pdf", size: MAX_UPLOAD_BYTES.file + 1 },
      "file",
    );

    expect(result.ok).toBe(false);
  });

  it("accepts files at exactly the size limit", () => {
    expect(
      validateUpload(
        { name: "big.pdf", size: MAX_UPLOAD_BYTES.file },
        "file",
      ).ok,
    ).toBe(true);
  });
});

describe("storage keys", () => {
  it("namespaces the key by user and keeps the extension", () => {
    const key = buildStorageKey("user-1", "My Notes.PDF");

    expect(key.startsWith("uploads/user-1/")).toBe(true);
    expect(key.endsWith(".pdf")).toBe(true);
  });

  it("omits the extension when the file has none", () => {
    const key = buildStorageKey("user-1", "README");

    expect(key.endsWith("README")).toBe(false);
    expect(key).toMatch(/^uploads\/user-1\/[0-9a-f-]+$/);
  });

  it("only matches keys issued to the given user", () => {
    const key = buildStorageKey("user-1", "a.png");

    expect(isStorageKeyForUser(key, "user-1")).toBe(true);
    expect(isStorageKeyForUser(key, "user-2")).toBe(false);
    expect(isStorageKeyForUser("uploads/user-10/a.png", "user-1")).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("upload extension lists", () => {
  it("matches the documented constraints", () => {
    expect(UPLOAD_EXTENSIONS.image).toEqual([
      "png",
      "jpg",
      "jpeg",
      "gif",
      "webp",
      "svg",
    ]);
    expect(UPLOAD_EXTENSIONS.file).toEqual([
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
    ]);
  });
});
