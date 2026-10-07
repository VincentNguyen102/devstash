import { describe, expect, it } from "vitest";

import { getItemCopyText } from "@/lib/item-copy";

describe("getItemCopyText", () => {
  it("prefers content and returns it untrimmed", () => {
    const text = getItemCopyText({
      id: "item_1",
      content: "  const x = 1;\n",
      url: "https://example.com",
      fileName: null,
    });

    expect(text).toBe("  const x = 1;\n");
  });

  it("falls back to the URL when there is no content", () => {
    expect(
      getItemCopyText({
        id: "item_1",
        content: null,
        url: "https://example.com",
        fileName: null,
      })
    ).toBe("https://example.com");
  });

  it("ignores whitespace-only content and URL", () => {
    expect(
      getItemCopyText({
        id: "item_1",
        content: "   ",
        url: " https://example.com ",
        fileName: null,
      })
    ).toBe(" https://example.com ");
  });

  it("returns a relative file link for upload-backed items", () => {
    expect(
      getItemCopyText({
        id: "item_1",
        content: null,
        url: null,
        fileName: "photo.png",
      })
    ).toBe("/api/items/item_1/file");
  });

  it("prefixes the origin when one is provided", () => {
    expect(
      getItemCopyText(
        { id: "item_1", content: null, url: null, fileName: "photo.png" },
        "https://devstash.app"
      )
    ).toBe("https://devstash.app/api/items/item_1/file");
  });

  it("returns null when nothing is copyable", () => {
    expect(
      getItemCopyText({ id: "item_1", content: null, url: null, fileName: null })
    ).toBeNull();
    expect(
      getItemCopyText({ id: "item_1", content: "  ", url: " ", fileName: null })
    ).toBeNull();
  });
});
