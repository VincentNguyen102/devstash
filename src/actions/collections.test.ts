import { beforeEach, describe, expect, it, vi } from "vitest";

// The data layer and auth are mocked so the action's validation, ownership and
// error handling can be exercised without a database or Next.js runtime.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createCollectionRecord: vi.fn(),
  updateCollectionRecord: vi.fn(),
  setCollectionFavoriteRecord: vi.fn(),
  deleteCollectionRecord: vi.fn(),
  getBillingEntitlements: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));

vi.mock("@/lib/db/billing", () => ({
  getBillingEntitlements: mocks.getBillingEntitlements,
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: mocks.createCollectionRecord,
  updateCollection: mocks.updateCollectionRecord,
  setCollectionFavorite: mocks.setCollectionFavoriteRecord,
  deleteCollection: mocks.deleteCollectionRecord,
}));

import {
  createCollection,
  deleteCollection,
  setCollectionFavorite,
  updateCollection,
} from "@/actions/collections";

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
  mocks.setCollectionFavoriteRecord.mockResolvedValue({
    id: "collection-1",
    isFavorite: true,
  });
  // Existing tests focus on CRUD; default them to Pro so billing gates do not
  // interfere. The Free-tier cases below override this explicitly.
  mocks.getBillingEntitlements.mockResolvedValue({
    isPro: true,
    itemCount: 0,
    collectionCount: 0,
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

  it("blocks a Free user at the collection limit", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: false,
      itemCount: 0,
      collectionCount: 3,
    });

    const result = await createCollection(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain("3");
    expect(mocks.createCollectionRecord).not.toHaveBeenCalled();
  });

  it("allows a Free user under the collection limit", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: false,
      itemCount: 0,
      collectionCount: 2,
    });

    const result = await createCollection(validInput);

    expect(result.success).toBe(true);
    expect(mocks.createCollectionRecord).toHaveBeenCalled();
  });

  it("allows Pro users at any collection count", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: true,
      itemCount: 0,
      collectionCount: 10,
    });

    const result = await createCollection(validInput);

    expect(result.success).toBe(true);
    expect(mocks.createCollectionRecord).toHaveBeenCalled();
  });
});

describe("updateCollection", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await updateCollection("collection-1", validInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.updateCollectionRecord).not.toHaveBeenCalled();
  });

  it("validates the payload before hitting the database", async () => {
    const result = await updateCollection("collection-1", { name: "   " });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(mocks.updateCollectionRecord).not.toHaveBeenCalled();
  });

  it("passes parsed data to the query and returns the updated collection", async () => {
    const collection = { id: "collection-1", name: "React Patterns" };
    mocks.updateCollectionRecord.mockResolvedValue(collection);

    const result = await updateCollection("collection-1", validInput);

    expect(result).toEqual({ success: true, data: collection });
    expect(mocks.updateCollectionRecord).toHaveBeenCalledWith(
      "user-1",
      "collection-1",
      { name: "React Patterns", description: "Reusable patterns" },
    );
  });

  it("returns not found when the collection is not the user's", async () => {
    mocks.updateCollectionRecord.mockResolvedValue(null);

    const result = await updateCollection("someone-elses", validInput);

    expect(result).toEqual({ success: false, error: "Collection not found." });
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.updateCollectionRecord.mockRejectedValue(new Error("boom"));

    const result = await updateCollection("collection-1", validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});

describe("setCollectionFavorite", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await setCollectionFavorite("collection-1", true);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.setCollectionFavoriteRecord).not.toHaveBeenCalled();
  });

  it("rejects a non-boolean value", async () => {
    const result = await setCollectionFavorite(
      "collection-1",
      1 as unknown as boolean,
    );

    expect(result).toEqual({ success: false, error: "Invalid input." });
    expect(mocks.setCollectionFavoriteRecord).not.toHaveBeenCalled();
  });

  it("persists the requested state and returns the updated collection", async () => {
    const collection = { id: "collection-1", isFavorite: true };
    mocks.setCollectionFavoriteRecord.mockResolvedValue(collection);

    const result = await setCollectionFavorite("collection-1", true);

    expect(result).toEqual({ success: true, data: collection });
    expect(mocks.setCollectionFavoriteRecord).toHaveBeenCalledWith(
      "user-1",
      "collection-1",
      true,
    );
  });

  it("returns not found when the collection is not the user's", async () => {
    mocks.setCollectionFavoriteRecord.mockResolvedValue(null);

    const result = await setCollectionFavorite("someone-elses", true);

    expect(result).toEqual({ success: false, error: "Collection not found." });
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.setCollectionFavoriteRecord.mockRejectedValue(new Error("boom"));

    const result = await setCollectionFavorite("collection-1", true);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});

describe("deleteCollection", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.deleteCollectionRecord).not.toHaveBeenCalled();
  });

  it("deletes the user's collection", async () => {
    mocks.deleteCollectionRecord.mockResolvedValue(true);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({ success: true });
    expect(mocks.deleteCollectionRecord).toHaveBeenCalledWith(
      "user-1",
      "collection-1",
    );
  });

  it("returns not found when the collection is not the user's", async () => {
    mocks.deleteCollectionRecord.mockResolvedValue(false);

    const result = await deleteCollection("someone-elses");

    expect(result).toEqual({ success: false, error: "Collection not found." });
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.deleteCollectionRecord.mockRejectedValue(new Error("boom"));

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});
