import { beforeEach, describe, expect, it, vi } from "vitest";

// `next-auth` is mocked so the action's error handling can be exercised without
// loading the framework runtime (which expects a Next.js server context).
const auth = vi.hoisted(() => {
  class AuthError extends Error {
    type = "AuthError";
    kind = "error";
  }

  class CredentialsSignin extends AuthError {
    type = "CredentialsSignin";
    kind = "signIn";
    code = "credentials";
  }

  return { AuthError, CredentialsSignin };
});

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  rateLimitKey: vi.fn(),
  rateLimitMessage: vi.fn(),
}));

vi.mock("next-auth", () => ({
  AuthError: auth.AuthError,
  CredentialsSignin: auth.CredentialsSignin,
}));

vi.mock("@/auth", () => ({ signIn: mocks.signIn }));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getClientIp: mocks.getClientIp,
  rateLimitKey: mocks.rateLimitKey,
  rateLimitMessage: mocks.rateLimitMessage,
}));

import { authenticate } from "@/actions/auth";

function buildFormData(
  fields: { email?: string; password?: string; callbackUrl?: string } = {},
): FormData {
  const formData = new FormData();
  formData.set("email", fields.email ?? "User@Example.com");
  formData.set("password", fields.password ?? "password123");

  if (fields.callbackUrl) {
    formData.set("callbackUrl", fields.callbackUrl);
  }

  return formData;
}

const ALLOWED_LIMIT = {
  success: true,
  remaining: 4,
  reset: 0,
  retryAfterSeconds: 0,
};

beforeEach(() => {
  mocks.getClientIp.mockResolvedValue("203.0.113.1");
  mocks.rateLimitKey.mockReturnValue("203.0.113.1:user@example.com");
  mocks.checkRateLimit.mockResolvedValue(ALLOWED_LIMIT);
  mocks.rateLimitMessage.mockReturnValue("Too many attempts.");
  mocks.signIn.mockResolvedValue(undefined);
});

describe("authenticate", () => {
  it("normalizes the email and checks the login rate limit", async () => {
    await authenticate(null, buildFormData());

    expect(mocks.rateLimitKey).toHaveBeenCalledWith(
      "203.0.113.1",
      "user@example.com",
    );
    expect(mocks.checkRateLimit).toHaveBeenCalledWith(
      "login",
      "203.0.113.1:user@example.com",
    );
  });

  it("returns a rate-limited state without signing in", async () => {
    mocks.checkRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
      retryAfterSeconds: 60,
    });

    const result = await authenticate(null, buildFormData());

    expect(result).toEqual({
      message: "Too many attempts.",
      rateLimited: true,
    });
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("asks the user to verify their email when the provider rejects it", async () => {
    const error = new auth.CredentialsSignin();
    error.code = "email_not_verified";
    mocks.signIn.mockRejectedValue(error);

    const result = await authenticate(null, buildFormData());

    expect(result).toEqual({
      message: "Please verify your email before signing in.",
      code: "email_not_verified",
    });
  });

  it("returns a generic message for invalid credentials", async () => {
    mocks.signIn.mockRejectedValue(new auth.CredentialsSignin());

    const result = await authenticate(null, buildFormData());

    expect(result).toEqual({ message: "Invalid email or password." });
  });

  it("returns a generic message for other auth errors", async () => {
    mocks.signIn.mockRejectedValue(new auth.AuthError("boom"));

    const result = await authenticate(null, buildFormData());

    expect(result).toEqual({
      message: "Something went wrong. Please try again.",
    });
  });

  it("re-throws redirects and unexpected errors", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    mocks.signIn.mockRejectedValue(redirectError);

    await expect(authenticate(null, buildFormData())).rejects.toBe(
      redirectError,
    );
  });

  it("passes a provided callback url to signIn", async () => {
    await authenticate(null, buildFormData({ callbackUrl: "/profile" }));

    expect(mocks.signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/profile" }),
    );
  });
});
