import { afterEach, describe, expect, it, vi } from "vitest";

import { copyToClipboard } from "@/lib/clipboard";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("copyToClipboard", () => {
  it("writes to the async clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("falls back to a temporary textarea when the clipboard API throws", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const textarea = {
      value: "",
      style: {} as Record<string, string>,
      setAttribute: vi.fn(),
      select: vi.fn(),
    };
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const execCommand = vi.fn().mockReturnValue(true);

    vi.stubGlobal("document", {
      createElement: vi.fn(() => textarea),
      body: { appendChild, removeChild },
      execCommand,
    });

    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(appendChild).toHaveBeenCalledWith(textarea);
    expect(textarea.value).toBe("hello");
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(removeChild).toHaveBeenCalledWith(textarea);
  });

  it("returns false when both strategies fail", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        value: "",
        style: {},
        setAttribute: vi.fn(),
        select: vi.fn(),
      })),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      execCommand: vi.fn().mockReturnValue(false),
    });

    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });

  it("returns false when there is no clipboard API or DOM", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("document", undefined);

    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });
});
