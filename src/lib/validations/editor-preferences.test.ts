import { describe, expect, it } from "vitest";

import { editorPreferencesSchema } from "@/lib/validations/editor-preferences";

const valid = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark" as const,
};

describe("editorPreferencesSchema", () => {
  it("accepts a valid payload", () => {
    expect(editorPreferencesSchema.parse(valid)).toEqual(valid);
  });

  it("rejects an unsupported theme", () => {
    const result = editorPreferencesSchema.safeParse({
      ...valid,
      theme: "solarized",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unsupported font size", () => {
    const result = editorPreferencesSchema.safeParse({ ...valid, fontSize: 7 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Unsupported font size.");
    }
  });

  it("rejects a non-integer font size", () => {
    const result = editorPreferencesSchema.safeParse({
      ...valid,
      fontSize: 14.5,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unsupported tab size", () => {
    const result = editorPreferencesSchema.safeParse({ ...valid, tabSize: 3 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Unsupported tab size.");
    }
  });

  it("rejects non-boolean toggles", () => {
    expect(
      editorPreferencesSchema.safeParse({ ...valid, wordWrap: "on" }).success,
    ).toBe(false);
    expect(
      editorPreferencesSchema.safeParse({ ...valid, minimap: 1 }).success,
    ).toBe(false);
  });

  it("requires every field", () => {
    expect(editorPreferencesSchema.safeParse({ fontSize: 14 }).success).toBe(
      false,
    );
  });
});
