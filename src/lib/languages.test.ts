import { describe, expect, it } from "vitest";

import {
  LANGUAGE_OPTIONS,
  getLanguageLabel,
  languageOptionsFor,
  toLanguageValue,
} from "@/lib/languages";

describe("LANGUAGE_OPTIONS", () => {
  it("uses unique, non-empty Monaco language ids", () => {
    const values = LANGUAGE_OPTIONS.map((option) => option.value);

    expect(values.every((value) => value.trim().length > 0)).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("toLanguageValue", () => {
  it("returns undefined when no language is stored", () => {
    expect(toLanguageValue()).toBeUndefined();
    expect(toLanguageValue(null)).toBeUndefined();
    expect(toLanguageValue("   ")).toBeUndefined();
  });

  it("normalises legacy aliases to the option value", () => {
    expect(toLanguageValue("tsx")).toBe("typescript");
    expect(toLanguageValue("bash")).toBe("shell");
    expect(toLanguageValue("  TS ")).toBe("typescript");
  });

  it("keeps unknown languages so they can still be selected", () => {
    expect(toLanguageValue("brainfuck")).toBe("brainfuck");
  });
});

describe("getLanguageLabel", () => {
  it("labels an empty value as plain text", () => {
    expect(getLanguageLabel()).toBe("Plain text");
    expect(getLanguageLabel("")).toBe("Plain text");
  });

  it("uses the option label for stored ids and aliases", () => {
    expect(getLanguageLabel("typescript")).toBe("TypeScript");
    expect(getLanguageLabel("tsx")).toBe("TypeScript");
    expect(getLanguageLabel("bash")).toBe("Shell");
  });

  it("falls back to the raw value for unknown languages", () => {
    expect(getLanguageLabel("brainfuck")).toBe("brainfuck");
  });
});

describe("languageOptionsFor", () => {
  it("returns the curated list when nothing is selected", () => {
    expect(languageOptionsFor("")).toEqual([...LANGUAGE_OPTIONS]);
  });

  it("does not duplicate an alias that maps to a curated option", () => {
    const options = languageOptionsFor("tsx");

    expect(options).toHaveLength(LANGUAGE_OPTIONS.length);
    expect(options.filter((option) => option.value === "typescript")).toHaveLength(
      1,
    );
  });

  it("appends an unknown stored language so editing preserves it", () => {
    const options = languageOptionsFor("brainfuck");

    expect(options).toHaveLength(LANGUAGE_OPTIONS.length + 1);
    expect(options.at(-1)).toEqual({
      value: "brainfuck",
      label: "brainfuck",
    });
  });
});
