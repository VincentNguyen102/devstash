import { describe, expect, it } from "vitest";

import { createCollectionSchema } from "@/lib/validations/collection";

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
