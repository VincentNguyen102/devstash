import { beforeEach, describe, expect, it, vi } from "vitest";

// The data layer and auth are mocked so the action's validation, ownership and
// error handling can be exercised without a database or Next.js runtime.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createItemRecord: vi.fn(),
  updateItemRecord: vi.fn(),
  deleteItemRecord: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));

vi.mock("@/lib/db/items", () => ({
  createItem: mocks.createItemRecord,
  updateItem: mocks.updateItemRecord,
  deleteItem: mocks.deleteItemRecord,
}));

import { createItem, deleteItem, updateItem } from "@/actions/items";

const validInput = {
  title: "My Snippet",
  description: "A description",
  content: "const x = 1;",
  url: "",
  language: "ts",
  tags: ["react"],
};

beforeEach(() => {
  mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
  mocks.createItemRecord.mockResolvedValue({ id: "item-1", title: "My Snippet" });
  mocks.updateItemRecord.mockResolvedValue({ id: "item-1", title: "My Snippet" });
  mocks.deleteItemRecord.mockResolvedValue(true);
});

const validCreateInput = {
  typeId: "snippet" as const,
  title: "My Snippet",
  description: "A description",
  content: "const x = 1;",
  url: "",
  language: "ts",
  tags: ["react"],
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
    });
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
    });
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
    mocks.deleteItemRecord.mockResolvedValue(false);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Item not found." });
    expect(mocks.deleteItemRecord).toHaveBeenCalledWith("item-1", "user-1");
  });

  it("deletes the item owned by the signed-in user", async () => {
    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true });
    expect(mocks.deleteItemRecord).toHaveBeenCalledWith("item-1", "user-1");
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
