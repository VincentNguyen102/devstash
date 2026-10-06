import { describe, expect, it } from "vitest";

import { createItemSchema, updateItemSchema } from "@/lib/validations/item";

function buildInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "  My Snippet  ",
    description: "  A description  ",
    content: "const x = 1;",
    url: "",
    language: "ts",
    tags: ["react", "hooks"],
    ...overrides,
  };
}

describe("updateItemSchema", () => {
  it("trims the title", () => {
    const result = updateItemSchema.parse(buildInput());

    expect(result.title).toBe("My Snippet");
  });

  it("rejects an empty or whitespace-only title", () => {
    expect(updateItemSchema.safeParse(buildInput({ title: "   " })).success).toBe(
      false,
    );
  });

  it("normalises blank optional text fields to null", () => {
    const result = updateItemSchema.parse(
      buildInput({ description: "  ", content: "", language: null }),
    );

    expect(result.description).toBeNull();
    expect(result.content).toBeNull();
    expect(result.language).toBeNull();
  });

  it("keeps non-empty text verbatim", () => {
    const result = updateItemSchema.parse(
      buildInput({ description: "  keep me  ", content: "line 1\nline 2" }),
    );

    expect(result.description).toBe("  keep me  ");
    expect(result.content).toBe("line 1\nline 2");
  });

  it("accepts a valid URL and normalises a blank one to null", () => {
    expect(
      updateItemSchema.parse(buildInput({ url: "https://example.com" })).url,
    ).toBe("https://example.com");
    expect(updateItemSchema.parse(buildInput({ url: "  " })).url).toBeNull();
  });

  it("rejects an invalid URL", () => {
    const result = updateItemSchema.safeParse(
      buildInput({ url: "not-a-url" }),
    );

    expect(result.success).toBe(false);
  });

  it("trims tags and defaults to an empty array", () => {
    expect(
      updateItemSchema.parse(buildInput({ tags: [" react ", "hooks"] })).tags,
    ).toEqual(["react", "hooks"]);
    expect(updateItemSchema.parse(buildInput({ tags: undefined })).tags).toEqual(
      [],
    );
  });

  it("rejects blank tag names", () => {
    expect(
      updateItemSchema.safeParse(buildInput({ tags: ["react", "  "] })).success,
    ).toBe(false);
  });

  it("fills optional fields with null when omitted", () => {
    const result = updateItemSchema.parse({ title: "Only a title" });

    expect(result).toEqual({
      title: "Only a title",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
  });
});

function buildCreateInput(overrides: Record<string, unknown> = {}) {
  return {
    typeId: "snippet",
    title: "My Snippet",
    description: "A description",
    content: "const x = 1;",
    url: "",
    language: "ts",
    tags: ["react"],
    ...overrides,
  };
}

describe("createItemSchema", () => {
  it("accepts a valid text item and applies the same normalisation as edit", () => {
    const result = createItemSchema.parse(buildCreateInput());

    expect(result).toEqual({
      typeId: "snippet",
      title: "My Snippet",
      description: "A description",
      content: "const x = 1;",
      url: null,
      language: "ts",
      tags: ["react"],
    });
  });

  it("rejects an unknown item type", () => {
    expect(
      createItemSchema.safeParse(buildCreateInput({ typeId: "file" })).success,
    ).toBe(false);
  });

  it("requires a URL for url items", () => {
    const result = createItemSchema.safeParse(
      buildCreateInput({ typeId: "url", url: "  " }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("URL is required");
  });

  it("rejects an invalid URL for url items", () => {
    expect(
      createItemSchema.safeParse(
        buildCreateInput({ typeId: "url", url: "not-a-url" }),
      ).success,
    ).toBe(false);
  });

  it("accepts a valid URL for url items", () => {
    const result = createItemSchema.parse(
      buildCreateInput({ typeId: "url", url: " https://example.com " }),
    );

    expect(result.url).toBe("https://example.com");
  });
});
