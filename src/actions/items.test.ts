import { beforeEach, describe, expect, it, vi } from "vitest";

// The data layer and auth are mocked so the action's validation, ownership and
// error handling can be exercised without a database or Next.js runtime.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  updateItemRecord: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));

vi.mock("@/lib/db/items", () => ({
  updateItem: mocks.updateItemRecord,
}));

import { updateItem } from "@/actions/items";

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
  mocks.updateItemRecord.mockResolvedValue({ id: "item-1", title: "My Snippet" });
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
