import { describe, expect, it } from "vitest";

import { parseTags } from "@/lib/tags";

describe("parseTags", () => {
  it("splits, trims and drops empty entries", () => {
    expect(parseTags(" react , hooks ,, ")).toEqual(["react", "hooks"]);
  });

  it("de-duplicates tags while keeping the first-seen order", () => {
    expect(parseTags("react, react, hooks")).toEqual(["react", "hooks"]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("   ,  ")).toEqual([]);
  });

  it("keeps non-comma whitespace inside a tag", () => {
    expect(parseTags("machine learning")).toEqual(["machine learning"]);
  });
});
