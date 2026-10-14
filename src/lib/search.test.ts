import { describe, expect, it } from "vitest";

import {
  buildItemPreview,
  paletteFilter,
  PREVIEW_MAX_LENGTH,
  scoreSearchMatch,
} from "@/lib/search";

describe("buildItemPreview", () => {
  it("returns the first non-empty source", () => {
    expect(buildItemPreview("const a = 1;", "https://example.com")).toBe(
      "const a = 1;",
    );
    expect(buildItemPreview(null, "https://example.com", "notes.txt")).toBe(
      "https://example.com",
    );
  });

  it("skips blank and whitespace-only sources", () => {
    expect(buildItemPreview("", "   ", "\n", "A description")).toBe(
      "A description",
    );
  });

  it("collapses whitespace and newlines into a single line", () => {
    expect(buildItemPreview("line one\n\n  line   two")).toBe(
      "line one line two",
    );
  });

  it("truncates long content with an ellipsis", () => {
    const long = "a".repeat(200);
    const preview = buildItemPreview(long);

    expect(preview).toHaveLength(PREVIEW_MAX_LENGTH);
    expect(preview.endsWith("…")).toBe(true);
  });

  it("keeps content at the limit untouched", () => {
    const exact = "b".repeat(PREVIEW_MAX_LENGTH);

    expect(buildItemPreview(exact)).toBe(exact);
  });

  it("returns an empty string when nothing is available", () => {
    expect(buildItemPreview(null, undefined, "")).toBe("");
    expect(buildItemPreview()).toBe("");
  });
});

describe("scoreSearchMatch", () => {
  const item = {
    primary: "Multi-stage Dockerfile Snippet",
    secondary:
      "FROM node:20-alpine AS deps WORKDIR /app COPY package.json package-lock.json ./",
  };

  it("matches everything for an empty query", () => {
    expect(scoreSearchMatch("", item)).toBeGreaterThan(0);
    expect(scoreSearchMatch("   ", item)).toBeGreaterThan(0);
  });

  it("matches a literal word from the title", () => {
    expect(scoreSearchMatch("dockerfile", item)).toBeGreaterThan(0);
    expect(scoreSearchMatch("stage", item)).toBeGreaterThan(0);
  });

  it("ranks word-start title matches above mid-word title matches", () => {
    const wordStart = scoreSearchMatch("multi", item);
    const midWord = scoreSearchMatch("ulti", item);

    expect(wordStart).toBeGreaterThan(midWord);
    expect(midWord).toBeGreaterThan(0);
  });

  it("matches literal text in the content preview", () => {
    expect(scoreSearchMatch("alpine", item)).toBeGreaterThan(0);
    expect(scoreSearchMatch("package.json", item)).toBeGreaterThan(0);
  });

  it("is case-insensitive", () => {
    expect(scoreSearchMatch("DOCKERFILE", item)).toBe(
      scoreSearchMatch("dockerfile", item),
    );
  });

  it("does not match scattered letters in the preview", () => {
    // Regression: the default cmdk filter matched "test" against almost every
    // item by finding t/e/s/t spread across the content preview.
    expect(scoreSearchMatch("test", item)).toBe(0);
  });

  it("does not match scattered letters across a title", () => {
    expect(
      scoreSearchMatch("test", {
        primary: "Component Patterns Snippet",
        secondary: "import { createContext } from \"react\";",
      }),
    ).toBe(0);
  });

  it("fuzzy-matches a word from its first letter", () => {
    expect(
      scoreSearchMatch("dcr", { primary: "Docker Cleanup Command" }),
    ).toBeGreaterThan(0);
    expect(scoreSearchMatch("prse", { primary: "Process Management" })).toBe(0);
  });

  it("requires every token to match", () => {
    expect(scoreSearchMatch("docker alpine", item)).toBeGreaterThan(0);
    expect(scoreSearchMatch("docker kubernetes", item)).toBe(0);
  });

  it("ranks title matches above preview-only matches", () => {
    const titleMatch = scoreSearchMatch("docker", {
      primary: "Docker Cleanup",
      secondary: "Remove stopped containers",
    });
    const previewMatch = scoreSearchMatch("docker", {
      primary: "Container Cleanup",
      secondary: "Remove stopped docker containers",
    });

    expect(titleMatch).toBeGreaterThan(previewMatch);
  });

  it("handles a missing secondary string", () => {
    expect(scoreSearchMatch("lucide", { primary: "Lucide Icons" })).toBeGreaterThan(
      0,
    );
  });
});

describe("paletteFilter", () => {
  it("scores keywords in primary/secondary order and ignores the value", () => {
    const matched = paletteFilter("ignored-id", "docker", [
      "Docker Cleanup Command",
      "# Remove all stopped containers docker container prune -f",
    ]);

    expect(matched).toBeGreaterThan(0);
    expect(paletteFilter("id", "docker", ["Unrelated", "no match here"])).toBe(
      0,
    );
  });

  it("treats an empty query as a match", () => {
    expect(paletteFilter("id", "", ["Anything", ""])).toBeGreaterThan(0);
  });
});
