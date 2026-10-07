import { describe, expect, it } from "vitest";

import {
  CODE_TYPE_IDS,
  CONTENT_TYPE_IDS,
  IMAGE_TYPE_IDS,
  LANGUAGE_TYPE_IDS,
  MARKDOWN_TYPE_IDS,
  URL_TYPE_IDS,
  UPLOAD_TYPE_IDS,
  uploadKindForTypeId,
} from "@/lib/item-type-fields";

describe("item type field sets", () => {
  it("routes notes and prompts to the markdown editor", () => {
    expect(MARKDOWN_TYPE_IDS.has("note")).toBe(true);
    expect(MARKDOWN_TYPE_IDS.has("prompt")).toBe(true);
  });

  it("never uses both the code and markdown editors for the same type", () => {
    for (const typeId of MARKDOWN_TYPE_IDS) {
      expect(CODE_TYPE_IDS.has(typeId)).toBe(false);
      expect(CONTENT_TYPE_IDS.has(typeId)).toBe(true);
    }
  });

  it("keeps snippets and commands on the code editor", () => {
    expect(CODE_TYPE_IDS.has("snippet")).toBe(true);
    expect(CODE_TYPE_IDS.has("command")).toBe(true);
    expect(MARKDOWN_TYPE_IDS.has("snippet")).toBe(false);
    expect(MARKDOWN_TYPE_IDS.has("command")).toBe(false);
  });

  it("only exposes a language field alongside the code editor", () => {
    expect([...LANGUAGE_TYPE_IDS]).toEqual([...CODE_TYPE_IDS]);
  });

  it("only shows the url field for link items", () => {
    expect([...URL_TYPE_IDS]).toEqual(["url"]);
  });

  it("maps only file and image to an upload kind", () => {
    expect(uploadKindForTypeId("file")).toBe("file");
    expect(uploadKindForTypeId("image")).toBe("image");
    expect(uploadKindForTypeId("snippet")).toBeNull();
  });

  it("keeps upload types separate from inline content types", () => {
    for (const typeId of UPLOAD_TYPE_IDS) {
      expect(CONTENT_TYPE_IDS.has(typeId)).toBe(false);
    }

    expect([...IMAGE_TYPE_IDS]).toEqual(["image"]);
  });
});
