import { beforeEach, describe, expect, it, vi } from "vitest";

// The data layer and auth are mocked so the action's validation, ownership and
// error handling can be exercised without a database or Next.js runtime.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createCollectionRecord: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));

vi.mock("@/lib/db/collections", () => ({
  createCollection: mocks.createCollectionRecord,
}));

import { createCollection } from "@/actions/collections";

const validInput = {
  name: "  React Patterns  ",
  description: "Reusable patterns",
};

beforeEach(() => {
  mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
  mocks.createCollectionRecord.mockResolvedValue({
    id: "collection-1",
    name: "React Patterns",
  });
});

describe("createCollection", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await createCollection(validInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.createCollectionRecord).not.toHaveBeenCalled();
  });

  it("validates the payload before hitting the database", async () => {
    const result = await createCollection({ name: "   " });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(mocks.createCollectionRecord).not.toHaveBeenCalled();
  });

  it("passes parsed data to the query and returns the created collection", async () => {
    const collection = { id: "collection-1", name: "React Patterns" };
    mocks.createCollectionRecord.mockResolvedValue(collection);

    const result = await createCollection(validInput);

    expect(result).toEqual({ success: true, data: collection });
    expect(mocks.createCollectionRecord).toHaveBeenCalledWith("user-1", {
      name: "React Patterns",
      description: "Reusable patterns",
    });
  });

  it("normalises a blank description before the query", async () => {
    await createCollection({ name: "React", description: "  " });

    expect(mocks.createCollectionRecord).toHaveBeenCalledWith("user-1", {
      name: "React",
      description: null,
    });
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createCollectionRecord.mockRejectedValue(new Error("boom"));

    const result = await createCollection(validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});
