import { describe, expect, it } from "vitest";

import {
  getClientIpFrom,
  rateLimitKey,
  rateLimitMessage,
} from "@/lib/rate-limit";

describe("getClientIpFrom", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.1, 70.41.3.18",
    });

    expect(getClientIpFrom(headers)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.2" });

    expect(getClientIpFrom(headers)).toBe("203.0.113.2");
  });

  it("falls back to cf-connecting-ip", () => {
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.3" });

    expect(getClientIpFrom(headers)).toBe("203.0.113.3");
  });

  it("returns 'unknown' when no IP header is present", () => {
    expect(getClientIpFrom(new Headers())).toBe("unknown");
  });
});

describe("rateLimitKey", () => {
  it("trims, lowercases and joins non-empty parts", () => {
    const key = rateLimitKey(
      " 203.0.113.1 ",
      "User@Example.com",
      "",
      null,
      undefined,
    );

    expect(key).toBe("203.0.113.1:user@example.com");
  });

  it("returns an empty string when there are no usable parts", () => {
    expect(rateLimitKey("", null, undefined)).toBe("");
  });
});

describe("rateLimitMessage", () => {
  it("rounds a partial minute up to one minute", () => {
    expect(rateLimitMessage(30)).toBe(
      "Too many attempts. Please try again in 1 minute.",
    );
  });

  it("pluralizes whole minutes correctly", () => {
    expect(rateLimitMessage(60)).toBe(
      "Too many attempts. Please try again in 1 minute.",
    );
    expect(rateLimitMessage(61)).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    );
  });

  it("never reports less than one minute", () => {
    expect(rateLimitMessage(0)).toBe(
      "Too many attempts. Please try again in 1 minute.",
    );
  });
});
