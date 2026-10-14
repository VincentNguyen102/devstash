import { describe, expect, it } from "vitest";

import { getTypeLabel } from "@/lib/item-type-meta";

describe("getTypeLabel", () => {
  it("returns the display label for each system type", () => {
    expect(getTypeLabel("snippet")).toBe("Snippet");
    expect(getTypeLabel("prompt")).toBe("Prompt");
    expect(getTypeLabel("command")).toBe("Command");
    expect(getTypeLabel("note")).toBe("Note");
    expect(getTypeLabel("file")).toBe("File");
    expect(getTypeLabel("image")).toBe("Image");
    expect(getTypeLabel("url")).toBe("Link");
  });

  it("falls back to the raw id for unknown/custom types", () => {
    expect(getTypeLabel("bookmark")).toBe("bookmark");
  });
});
