import { beforeEach, describe, expect, it, vi } from "vitest";

// Auth and the data layer are mocked so the action's validation and error
// handling can be exercised without a database or Next.js runtime.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  updateEditorPreferencesRecord: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));

vi.mock("@/lib/db/settings", () => ({
  updateEditorPreferences: mocks.updateEditorPreferencesRecord,
}));

import { updateEditorPreferences } from "@/actions/settings";
import type { EditorPreferencesInput } from "@/lib/validations/editor-preferences";

const valid = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai" as const,
};

beforeEach(() => {
  mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
  mocks.updateEditorPreferencesRecord.mockResolvedValue(valid);
});

describe("updateEditorPreferences", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await updateEditorPreferences(valid);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.updateEditorPreferencesRecord).not.toHaveBeenCalled();
  });

  it("validates the payload before hitting the database", async () => {
    const invalid = { ...valid, theme: "nope" } as unknown as EditorPreferencesInput;

    const result = await updateEditorPreferences(invalid);

    expect(result.success).toBe(false);
    expect(mocks.updateEditorPreferencesRecord).not.toHaveBeenCalled();
  });

  it("persists for the signed-in user and returns the stored value", async () => {
    const result = await updateEditorPreferences(valid);

    expect(result).toEqual({ success: true, data: valid });
    expect(mocks.updateEditorPreferencesRecord).toHaveBeenCalledWith(
      "user-1",
      valid,
    );
  });

  it("returns a generic error when the query fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.updateEditorPreferencesRecord.mockRejectedValue(new Error("boom"));

    const result = await updateEditorPreferences(valid);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    consoleError.mockRestore();
  });
});
