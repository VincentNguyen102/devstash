import { describe, expect, it } from "vitest";

import { generateToken, hashToken } from "@/lib/tokens";

describe("generateToken", () => {
  it("returns a 64-character hex string", () => {
    expect(generateToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns a different token on each call", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashToken("opaque-token")).toBe(hashToken("opaque-token"));
  });

  it("returns a sha256 hex digest, not the raw token", () => {
    const token = "opaque-token";
    const hash = hashToken(token);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe(token);
  });
});
