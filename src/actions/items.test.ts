import { beforeEach, describe, expect, it, vi } from "vitest";

// The data layer and auth are mocked so the action's validation, ownership and
// error handling can be exercised without a database or Next.js runtime.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createItemRecord: vi.fn(),
  updateItemRecord: vi.fn(),
  setItemFavoriteRecord: vi.fn(),
  setItemPinRecord: vi.fn(),
  deleteItemRecord: vi.fn(),
  deleteObject: vi.fn(),
  getOwnedCollectionIds: vi.fn(),
  getBillingEntitlements: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));

vi.mock("@/lib/db/collections", () => ({
  getOwnedCollectionIds: mocks.getOwnedCollectionIds,
}));

vi.mock("@/lib/db/billing", () => ({
  getBillingEntitlements: mocks.getBillingEntitlements,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: mocks.createItemRecord,
  updateItem: mocks.updateItemRecord,
  setItemFavorite: mocks.setItemFavoriteRecord,
  setItemPin: mocks.setItemPinRecord,
  deleteItem: mocks.deleteItemRecord,
}));

vi.mock("@/lib/storage", () => ({ deleteObject: mocks.deleteObject }));

import {
  createItem,
  deleteItem,
  setItemFavorite,
  toggleItemPin,
  updateItem,
} from "@/actions/items";

const validInput = {
  title: "My Snippet",
  description: "A description",
  content: "const x = 1;",
  url: "",
  language: "ts",
  tags: ["react"],
  collectionIds: [],
};

beforeEach(() => {
  mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
  mocks.createItemRecord.mockResolvedValue({ id: "item-1", title: "My Snippet" });
  mocks.updateItemRecord.mockResolvedValue({ id: "item-1", title: "My Snippet" });
  mocks.setItemFavoriteRecord.mockResolvedValue({
    id: "item-1",
    isFavorite: true,
  });
  mocks.setItemPinRecord.mockResolvedValue({ id: "item-1", isPinned: true });
  mocks.deleteItemRecord.mockResolvedValue({ fileKey: null });
  mocks.deleteObject.mockResolvedValue(true);
  // Ownership check defaults to "everything the caller passes is owned".
  mocks.getOwnedCollectionIds.mockImplementation((_userId, ids: string[]) =>
    Promise.resolve(ids),
  );
  // Existing tests focus on CRUD; default them to Pro so billing gates do not
  // interfere. The Free-tier cases below override this explicitly.
  mocks.getBillingEntitlements.mockResolvedValue({
    isPro: true,
    itemCount: 0,
    collectionCount: 0,
  });
});

const validCreateInput = {
  typeId: "snippet" as const,
  title: "My Snippet",
  description: "A description",
  content: "const x = 1;",
  url: "",
  language: "ts",
  tags: ["react"],
  collectionIds: [],
};

describe("createItem", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await createItem(validCreateInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.createItemRecord).not.toHaveBeenCalled();
  });

  it("validates the payload before hitting the database", async () => {
    const result = await createItem({ ...validCreateInput, title: "  " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mocks.createItemRecord).not.toHaveBeenCalled();
  });

  it("requires a URL for url items", async () => {
    const result = await createItem({
      ...validCreateInput,
      typeId: "url",
      url: "",
    });

    expect(result).toEqual({ success: false, error: "URL is required" });
    expect(mocks.createItemRecord).not.toHaveBeenCalled();
  });

  it("passes parsed data to the query and returns the created item", async () => {
    const item = { id: "item-1", title: "My Snippet" };
    mocks.createItemRecord.mockResolvedValue(item);

    const result = await createItem(validCreateInput);

    expect(result).toEqual({ success: true, data: item });
    expect(mocks.createItemRecord).toHaveBeenCalledWith("user-1", {
      typeId: "snippet",
      title: "My Snippet",
      description: "A description",
      content: "const x = 1;",
      url: null,
      language: "ts",
      tags: ["react"],
      collectionIds: [],
      fileKey: null,
      fileName: null,
      fileSize: null,
    });
  });

  it("rejects a file reference that belongs to another user", async () => {
    const result = await createItem({
      ...validCreateInput,
      typeId: "file",
      fileKey: "uploads/someone-else/abc.pdf",
      fileName: "notes.pdf",
      fileSize: 2048,
    });

    expect(result).toEqual({ success: false, error: "Invalid file reference." });
    expect(mocks.createItemRecord).not.toHaveBeenCalled();
  });

  it("creates an upload-backed item for the signed-in user", async () => {
    const item = { id: "item-2", title: "Notes" };
    mocks.createItemRecord.mockResolvedValue(item);

    const result = await createItem({
      ...validCreateInput,
      typeId: "image",
      fileKey: "uploads/user-1/abc.png",
      fileName: "pic.png",
      fileSize: 1234,
    });

    expect(result).toEqual({ success: true, data: item });
    expect(mocks.createItemRecord).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        typeId: "image",
        fileKey: "uploads/user-1/abc.png",
        fileName: "pic.png",
        fileSize: 1234,
      }),
    );
  });

  it("rejects a collection that belongs to another user", async () => {
    mocks.getOwnedCollectionIds.mockResolvedValueOnce([]);

    const result = await createItem({
      ...validCreateInput,
      collectionIds: ["someone-elses-collection"],
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid collection selection.",
    });
    expect(mocks.createItemRecord).not.toHaveBeenCalled();
  });

  it("passes owned collection ids through to the query", async () => {
    const result = await createItem({
      ...validCreateInput,
      collectionIds: ["col-1", "col-2"],
    });

    expect(mocks.getOwnedCollectionIds).toHaveBeenCalledWith("user-1", [
      "col-1",
      "col-2",
    ]);
    expect(result.success).toBe(true);
    expect(mocks.createItemRecord).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ collectionIds: ["col-1", "col-2"] }),
    );
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createItemRecord.mockRejectedValue(new Error("boom"));

    const result = await createItem(validCreateInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });

  it("blocks a Free user at the item limit", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: false,
      itemCount: 50,
      collectionCount: 0,
    });

    const result = await createItem(validCreateInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain("50");
    expect(mocks.createItemRecord).not.toHaveBeenCalled();
  });

  it("allows a Free user under the item limit", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: false,
      itemCount: 49,
      collectionCount: 0,
    });

    const result = await createItem(validCreateInput);

    expect(result.success).toBe(true);
    expect(mocks.createItemRecord).toHaveBeenCalled();
  });

  it("allows Pro users at any item count", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: true,
      itemCount: 10_000,
      collectionCount: 0,
    });

    const result = await createItem(validCreateInput);

    expect(result.success).toBe(true);
    expect(mocks.createItemRecord).toHaveBeenCalled();
  });

  it("blocks Free users from creating file and image items", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: false,
      itemCount: 0,
      collectionCount: 0,
    });

    for (const typeId of ["file", "image"] as const) {
      const result = await createItem({
        ...validCreateInput,
        typeId,
        fileKey: `uploads/user-1/${typeId}.pdf`,
        fileName: `${typeId}.pdf`,
        fileSize: 1024,
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Pro feature/);
    }

    expect(mocks.createItemRecord).not.toHaveBeenCalled();
  });

  it("allows Pro users to create file and image items", async () => {
    const item = { id: "item-2", title: "File" };
    mocks.createItemRecord.mockResolvedValue(item);

    const result = await createItem({
      ...validCreateInput,
      typeId: "file",
      fileKey: "uploads/user-1/notes.pdf",
      fileName: "notes.pdf",
      fileSize: 2048,
    });

    expect(result).toEqual({ success: true, data: item });
  });
});

describe("updateItem", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.updateItemRecord).not.toHaveBeenCalled();
  });

  it("validates the payload before hitting the database", async () => {
    const result = await updateItem("item-1", { ...validInput, title: "  " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mocks.updateItemRecord).not.toHaveBeenCalled();
  });

  it("returns an error when the item is not owned by the user", async () => {
    mocks.updateItemRecord.mockResolvedValue(null);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("passes parsed data to the query and returns the updated item", async () => {
    const item = { id: "item-1", title: "Updated" };
    mocks.updateItemRecord.mockResolvedValue(item);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({ success: true, data: item });
    expect(mocks.updateItemRecord).toHaveBeenCalledWith("item-1", "user-1", {
      title: "My Snippet",
      description: "A description",
      content: "const x = 1;",
      url: null,
      language: "ts",
      tags: ["react"],
      collectionIds: [],
    });
  });

  it("rejects a collection that belongs to another user", async () => {
    mocks.getOwnedCollectionIds.mockResolvedValueOnce([]);

    const result = await updateItem("item-1", {
      ...validInput,
      collectionIds: ["someone-elses-collection"],
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid collection selection.",
    });
    expect(mocks.updateItemRecord).not.toHaveBeenCalled();
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.updateItemRecord.mockRejectedValue(new Error("boom"));

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});

describe("setItemFavorite", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await setItemFavorite("item-1", true);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.setItemFavoriteRecord).not.toHaveBeenCalled();
  });

  it("rejects a non-boolean value", async () => {
    const result = await setItemFavorite(
      "item-1",
      "yes" as unknown as boolean,
    );

    expect(result).toEqual({ success: false, error: "Invalid input." });
    expect(mocks.setItemFavoriteRecord).not.toHaveBeenCalled();
  });

  it("persists the requested state and returns the updated item", async () => {
    const item = { id: "item-1", isFavorite: false };
    mocks.setItemFavoriteRecord.mockResolvedValue(item);

    const result = await setItemFavorite("item-1", false);

    expect(result).toEqual({ success: true, data: item });
    expect(mocks.setItemFavoriteRecord).toHaveBeenCalledWith(
      "item-1",
      "user-1",
      false,
    );
  });

  it("returns not found when the item is not the user's", async () => {
    mocks.setItemFavoriteRecord.mockResolvedValue(null);

    const result = await setItemFavorite("item-1", true);

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.setItemFavoriteRecord.mockRejectedValue(new Error("boom"));

    const result = await setItemFavorite("item-1", true);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});

describe("toggleItemPin", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await toggleItemPin("item-1", true);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.setItemPinRecord).not.toHaveBeenCalled();
  });

  it("rejects a non-boolean value", async () => {
    const result = await toggleItemPin("item-1", "yes" as unknown as boolean);

    expect(result).toEqual({ success: false, error: "Invalid input." });
    expect(mocks.setItemPinRecord).not.toHaveBeenCalled();
  });

  it("persists the requested state and returns the updated item", async () => {
    const item = { id: "item-1", isPinned: true };
    mocks.setItemPinRecord.mockResolvedValue(item);

    const result = await toggleItemPin("item-1", true);

    expect(result).toEqual({ success: true, data: item });
    expect(mocks.setItemPinRecord).toHaveBeenCalledWith(
      "item-1",
      "user-1",
      true,
    );
  });

  it("returns not found when the item is not the user's", async () => {
    mocks.setItemPinRecord.mockResolvedValue(null);

    const result = await toggleItemPin("item-1", true);

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.setItemPinRecord.mockRejectedValue(new Error("boom"));

    const result = await toggleItemPin("item-1", true);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});

describe("deleteItem", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.deleteItemRecord).not.toHaveBeenCalled();
  });

  it("returns an error when the item is not owned by the user", async () => {
    mocks.deleteItemRecord.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Item not found." });
    expect(mocks.deleteItemRecord).toHaveBeenCalledWith("item-1", "user-1");
    expect(mocks.deleteObject).not.toHaveBeenCalled();
  });

  it("deletes the item owned by the signed-in user", async () => {
    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true });
    expect(mocks.deleteItemRecord).toHaveBeenCalledWith("item-1", "user-1");
    expect(mocks.deleteObject).not.toHaveBeenCalled();
  });

  it("removes the stored object when deleting a file item", async () => {
    mocks.deleteItemRecord.mockResolvedValue({
      fileKey: "uploads/user-1/abc.pdf",
    });

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true });
    expect(mocks.deleteObject).toHaveBeenCalledWith("uploads/user-1/abc.pdf");
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.deleteItemRecord.mockRejectedValue(new Error("boom"));

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});
