import { describe, expect, it } from "vitest";

import {
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/validations/collection";

describe("createCollectionSchema", () => {
  it("trims the name", () => {
    const result = createCollectionSchema.parse({ name: "  React Patterns  " });

    expect(result.name).toBe("React Patterns");
  });

  it("rejects a missing or empty name", () => {
    expect(createCollectionSchema.safeParse({ name: "   " }).success).toBe(
      false,
    );
    expect(createCollectionSchema.safeParse({}).success).toBe(false);
  });

  it("normalises a blank description to null", () => {
    expect(
      createCollectionSchema.parse({ name: "React", description: "   " })
        .description,
    ).toBeNull();
    expect(
      createCollectionSchema.parse({ name: "React", description: null })
        .description,
    ).toBeNull();
    expect(createCollectionSchema.parse({ name: "React" }).description).toBeNull();
  });

  it("keeps a provided description", () => {
    const result = createCollectionSchema.parse({
      name: "React",
      description: "Reusable patterns",
    });

    expect(result.description).toBe("Reusable patterns");
  });
});

describe("updateCollectionSchema", () => {
  it("requires a non-empty name", () => {
    expect(updateCollectionSchema.safeParse({ name: "   " }).success).toBe(
      false,
    );
    expect(updateCollectionSchema.safeParse({}).success).toBe(false);
  });

  it("trims the name and normalises a blank description to null", () => {
    const result = updateCollectionSchema.parse({
      name: "  React Patterns  ",
      description: "   ",
    });

    expect(result).toEqual({ name: "React Patterns", description: null });
  });

  it("keeps a provided description", () => {
    const result = updateCollectionSchema.parse({
      name: "React",
      description: "Reusable patterns",
    });

    expect(result.description).toBe("Reusable patterns");
  });
});
