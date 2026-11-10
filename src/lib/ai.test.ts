import { describe, expect, it } from "vitest";

import {
  AUTO_TAG_CONTENT_LIMIT,
  AUTO_TAG_MAX_TAGS,
  buildAutoTagInput,
  parseAutoTagResponse,
  truncateForAutoTags,
} from "@/lib/ai";

describe("truncateForAutoTags", () => {
  it("keeps content shorter than the limit untouched", () => {
    expect(truncateForAutoTags("short content")).toBe("short content");
  });

  it("cuts content at the configured limit", () => {
    const content = "a".repeat(AUTO_TAG_CONTENT_LIMIT + 50);

    expect(truncateForAutoTags(content)).toHaveLength(AUTO_TAG_CONTENT_LIMIT);
  });
});

describe("buildAutoTagInput", () => {
  it("includes the trimmed title and the content", () => {
    const input = buildAutoTagInput("  My snippet  ", "const x = 1;");

    expect(input).toContain("Title:\nMy snippet");
    expect(input).toContain("Content:\nconst x = 1;");
  });

  it("truncates long content before it is sent", () => {
    const input = buildAutoTagInput("Title", "a".repeat(5_000));

    expect(input).toContain("a".repeat(AUTO_TAG_CONTENT_LIMIT));
    expect(input).not.toContain("a".repeat(AUTO_TAG_CONTENT_LIMIT + 1));
  });

  it("mentions JSON in the input for json_object mode", () => {
    expect(buildAutoTagInput("Title", "content")).toMatch(/json/i);
  });
});

describe("parseAutoTagResponse", () => {
  it("parses the object shape", () => {
    expect(parseAutoTagResponse('{"tags":["React","Hooks"]}')).toEqual([
      "react",
      "hooks",
    ]);
  });

  it("parses a bare array", () => {
    expect(parseAutoTagResponse('["TypeScript","testing"]')).toEqual([
      "typescript",
      "testing",
    ]);
  });

  it("normalizes whitespace, casing and leading hashes", () => {
    expect(
      parseAutoTagResponse('{"tags":["  #React  ","  State Management "]}'),
    ).toEqual(["react", "state management"]);
  });

  it("removes empty and duplicate tags", () => {
    expect(
      parseAutoTagResponse('{"tags":["react","React","   ", "react"]}'),
    ).toEqual(["react"]);
  });

  it("caps the number of suggestions", () => {
    const tags = Array.from({ length: 10 }, (_, index) => `tag-${index}`);

    expect(parseAutoTagResponse(JSON.stringify({ tags }))).toHaveLength(
      AUTO_TAG_MAX_TAGS,
    );
  });

  it("ignores non-string entries", () => {
    expect(
      parseAutoTagResponse('{"tags":["react", 42, null, {"x": 1}]}'),
    ).toEqual(["react"]);
  });

  it("returns an empty array for invalid JSON", () => {
    expect(parseAutoTagResponse("not json")).toEqual([]);
  });

  it("returns an empty array for an unexpected shape", () => {
    expect(parseAutoTagResponse('{"tags":"react"}')).toEqual([]);
    expect(parseAutoTagResponse("null")).toEqual([]);
  });
});
