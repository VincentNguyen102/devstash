import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  isEditorFontSize,
  isEditorTabSize,
  isEditorThemeId,
  normalizeEditorPreferences,
} from "@/lib/editor-preferences";

describe("editor preference guards", () => {
  it("accepts only the offered themes", () => {
    expect(isEditorThemeId("vs-dark")).toBe(true);
    expect(isEditorThemeId("monokai")).toBe(true);
    expect(isEditorThemeId("github-dark")).toBe(true);
    expect(isEditorThemeId("solarized")).toBe(false);
    expect(isEditorThemeId(undefined)).toBe(false);
  });

  it("accepts only the offered font sizes", () => {
    expect(isEditorFontSize(12)).toBe(true);
    expect(isEditorFontSize(14)).toBe(true);
    expect(isEditorFontSize(13.5)).toBe(false);
    expect(isEditorFontSize(99)).toBe(false);
    expect(isEditorFontSize("14")).toBe(false);
  });

  it("accepts only the offered tab sizes", () => {
    expect(isEditorTabSize(2)).toBe(true);
    expect(isEditorTabSize(4)).toBe(true);
    expect(isEditorTabSize(3)).toBe(false);
    expect(isEditorTabSize(true)).toBe(false);
  });
});

describe("normalizeEditorPreferences", () => {
  it("returns the defaults for a missing value", () => {
    expect(normalizeEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(normalizeEditorPreferences(undefined)).toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
    expect(normalizeEditorPreferences("nope")).toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
  });

  it("returns a copy, not the shared default object", () => {
    const normalized = normalizeEditorPreferences(null);

    expect(normalized).not.toBe(DEFAULT_EDITOR_PREFERENCES);
  });

  it("keeps a complete, valid value", () => {
    const value = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai" as const,
    };

    expect(normalizeEditorPreferences(value)).toEqual(value);
  });

  it("fills only the invalid fields, keeping the valid ones", () => {
    const normalized = normalizeEditorPreferences({
      fontSize: 18,
      tabSize: 3, // invalid
      wordWrap: "yes", // invalid
      minimap: true,
      theme: "nope", // invalid
    });

    expect(normalized).toEqual({
      fontSize: 18,
      tabSize: DEFAULT_EDITOR_PREFERENCES.tabSize,
      wordWrap: DEFAULT_EDITOR_PREFERENCES.wordWrap,
      minimap: true,
      theme: DEFAULT_EDITOR_PREFERENCES.theme,
    });
  });
});
