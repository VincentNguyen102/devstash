import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getBillingEntitlements: vi.fn(),
  checkRateLimit: vi.fn(),
  getOpenAIClient: vi.fn(),
  isAiConfigured: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));

vi.mock("@/lib/db/billing", () => ({
  getBillingEntitlements: mocks.getBillingEntitlements,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  rateLimitKey: (...parts: string[]) => parts.join(":").toLowerCase(),
}));

vi.mock("@/lib/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai")>();

  return {
    ...actual,
    getOpenAIClient: mocks.getOpenAIClient,
    isAiConfigured: mocks.isAiConfigured,
  };
});

import { generateAutoTags, generateDescription } from "@/actions/ai";

const validInput = {
  title: "React hooks snippet",
  content: "const [count, setCount] = useState(0);",
};

const validDescriptionInput = {
  title: "React hooks snippet",
  typeId: "snippet",
  content: "const [count, setCount] = useState(0);",
};

beforeEach(() => {
  mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
  mocks.getBillingEntitlements.mockResolvedValue({
    isPro: true,
    itemCount: 0,
    collectionCount: 0,
  });
  mocks.checkRateLimit.mockResolvedValue({
    success: true,
    remaining: 19,
    reset: 0,
    retryAfterSeconds: 0,
  });
  mocks.isAiConfigured.mockReturnValue(true);
  mocks.create.mockResolvedValue({
    output_text: '{"tags":["react","hooks"]}',
  });
  mocks.getOpenAIClient.mockReturnValue({
    responses: { create: mocks.create },
  });
});

describe("generateAutoTags", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("validates the input before calling OpenAI", async () => {
    const result = await generateAutoTags({ title: "   " });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/title/i);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("blocks Free users", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: false,
      itemCount: 0,
      collectionCount: 0,
    });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "AI features are available on the Pro plan.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns a friendly error when AI is not configured", async () => {
    mocks.isAiConfigured.mockReturnValue(false);

    const result = await generateAutoTags(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/temporarily unavailable/i);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("blocks requests over the rate limit", async () => {
    mocks.checkRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: 0,
      retryAfterSeconds: 3_600,
    });

    const result = await generateAutoTags(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain("60 minutes");
    expect(mocks.checkRateLimit).toHaveBeenCalledWith(
      "aiTags",
      "ai-tags:user-1",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns normalized suggestions from the object shape", async () => {
    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: true,
      data: { tags: ["react", "hooks"] },
    });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5-nano",
        text: { format: { type: "json_object" } },
        input: expect.stringContaining("React hooks snippet"),
      }),
    );
  });

  it("accepts the bare-array response shape", async () => {
    mocks.create.mockResolvedValue({
      output_text: '["TypeScript","Testing"]',
    });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: true,
      data: { tags: ["typescript", "testing"] },
    });
  });

  it("truncates content before sending it to the model", async () => {
    await generateAutoTags({
      title: "Long item",
      content: "a".repeat(5_000),
    });

    const request = mocks.create.mock.calls[0]?.[0] as { input: string };

    expect(request.input).toContain("a".repeat(2_000));
    expect(request.input).not.toContain("a".repeat(2_001));
  });

  it("reports an empty or unparseable response", async () => {
    mocks.create.mockResolvedValue({ output_text: "not json" });

    const result = await generateAutoTags(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no tags were suggested/i);
  });

  it("returns a generic error when the API call fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.create.mockRejectedValue(new Error("boom"));

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "AI is temporarily unavailable. Please try again.",
    });
    consoleError.mockRestore();
  });
});

describe("generateDescription", () => {
  it("requires a signed-in user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("validates the input before calling OpenAI", async () => {
    const result = await generateDescription({ title: "   " });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/title/i);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("blocks Free users", async () => {
    mocks.getBillingEntitlements.mockResolvedValue({
      isPro: false,
      itemCount: 0,
      collectionCount: 0,
    });

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: false,
      error: "AI features are available on the Pro plan.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns a friendly error when AI is not configured", async () => {
    mocks.isAiConfigured.mockReturnValue(false);

    const result = await generateDescription(validDescriptionInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/temporarily unavailable/i);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("blocks requests over the rate limit", async () => {
    mocks.checkRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: 0,
      retryAfterSeconds: 3_600,
    });

    const result = await generateDescription(validDescriptionInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain("60 minutes");
    expect(mocks.checkRateLimit).toHaveBeenCalledWith(
      "aiDescriptions",
      "ai-descriptions:user-1",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns the generated description with the expected request", async () => {
    mocks.create.mockResolvedValue({
      output_text:
        '{"description":"A React hook that tracks a counter in local state."}',
    });

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: true,
      data: {
        description: "A React hook that tracks a counter in local state.",
      },
    });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5-nano",
        text: { format: { type: "json_object" } },
        input: expect.stringContaining("React hooks snippet"),
      }),
    );
  });

  it("includes the item type label in the request", async () => {
    mocks.create.mockResolvedValue({
      output_text: '{"description":"A reusable link."}',
    });

    await generateDescription({
      title: "Lucide icons",
      typeId: "url",
      url: "https://lucide.dev/",
      tags: "icons, ui",
    });

    const request = mocks.create.mock.calls[0]?.[0] as { input: string };

    expect(request.input).toContain("Item type:\nLink");
    expect(request.input).toContain("URL:\nhttps://lucide.dev/");
    expect(request.input).toContain("Tags:\nicons, ui");
  });

  it("truncates content before sending it to the model", async () => {
    mocks.create.mockResolvedValue({
      output_text: '{"description":"A long snippet."}',
    });

    await generateDescription({
      title: "Long item",
      content: "a".repeat(5_000),
    });

    const request = mocks.create.mock.calls[0]?.[0] as { input: string };

    expect(request.input).toContain("a".repeat(2_000));
    expect(request.input).not.toContain("a".repeat(2_001));
  });

  it("reports an empty or unparseable response", async () => {
    mocks.create.mockResolvedValue({ output_text: "not json" });

    const result = await generateDescription(validDescriptionInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no description was generated/i);
  });

  it("returns a generic error when the API call fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.create.mockRejectedValue(new Error("boom"));

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: false,
      error: "AI is temporarily unavailable. Please try again.",
    });
    consoleError.mockRestore();
  });
});
