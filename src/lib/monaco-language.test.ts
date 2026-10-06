import { describe, expect, it } from "vitest";

import { toMonacoLanguage } from "@/lib/monaco-language";

describe("toMonacoLanguage", () => {
  it("falls back to plaintext for empty input", () => {
    expect(toMonacoLanguage()).toBe("plaintext");
    expect(toMonacoLanguage(null)).toBe("plaintext");
    expect(toMonacoLanguage("   ")).toBe("plaintext");
  });

  it("maps common aliases to their Monaco language id", () => {
    expect(toMonacoLanguage("bash")).toBe("shell");
    expect(toMonacoLanguage("sh")).toBe("shell");
    expect(toMonacoLanguage("ts")).toBe("typescript");
    expect(toMonacoLanguage("tsx")).toBe("typescript");
    expect(toMonacoLanguage("yml")).toBe("yaml");
    expect(toMonacoLanguage("docker")).toBe("dockerfile");
    expect(toMonacoLanguage("py")).toBe("python");
  });

  it("is case-insensitive and trims surrounding whitespace", () => {
    expect(toMonacoLanguage("  BASH ")).toBe("shell");
    expect(toMonacoLanguage("TypeScript")).toBe("typescript");
  });

  it("passes unknown languages through unchanged", () => {
    expect(toMonacoLanguage("brainfuck")).toBe("brainfuck");
  });
});
