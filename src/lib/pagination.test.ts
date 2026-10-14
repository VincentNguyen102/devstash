import { describe, expect, it } from "vitest";

import {
  clampPage,
  getPageCount,
  getPageSkip,
  getVisiblePages,
  parsePage,
} from "@/lib/pagination";

describe("parsePage", () => {
  it("defaults to page 1", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("")).toBe(1);
  });

  it("parses a numeric string", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("12")).toBe(12);
  });

  it("uses the first value of a repeated param", () => {
    expect(parsePage(["4", "9"])).toBe(4);
  });

  it("falls back to 1 for invalid or negative values", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("2x")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
  });
});

describe("getPageCount", () => {
  it("returns 0 when there are no rows", () => {
    expect(getPageCount(0, 21)).toBe(0);
  });

  it("rounds up partial pages", () => {
    expect(getPageCount(1, 21)).toBe(1);
    expect(getPageCount(21, 21)).toBe(1);
    expect(getPageCount(22, 21)).toBe(2);
    expect(getPageCount(42, 21)).toBe(2);
    expect(getPageCount(43, 21)).toBe(3);
  });

  it("returns 0 for a non-positive page size", () => {
    expect(getPageCount(10, 0)).toBe(0);
  });
});

describe("clampPage", () => {
  it("keeps an in-range page", () => {
    expect(clampPage(2, 5)).toBe(2);
  });

  it("clamps below 1 and above the last page", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
  });

  it("returns 1 when there are no pages", () => {
    expect(clampPage(3, 0)).toBe(1);
  });
});

describe("getPageSkip", () => {
  it("skips zero rows on the first page", () => {
    expect(getPageSkip(1, 21)).toBe(0);
  });

  it("skips whole pages before the current one", () => {
    expect(getPageSkip(3, 21)).toBe(42);
  });

  it("never skips a negative amount", () => {
    expect(getPageSkip(0, 21)).toBe(0);
  });
});

describe("getVisiblePages", () => {
  it("lists every page when the count is small", () => {
    expect(getVisiblePages(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns a single page", () => {
    expect(getVisiblePages(1, 1)).toEqual([1]);
  });

  it("returns nothing when there are no pages", () => {
    expect(getVisiblePages(1, 0)).toEqual([]);
  });

  it("collapses large ranges into first, window and last", () => {
    const items = getVisiblePages(5, 20);

    expect(items[0]).toBe(1);
    expect(items[items.length - 1]).toBe(20);
    expect(items).toContain(5);
    expect(items).toContain("ellipsis");
  });

  it("omits the trailing ellipsis on the last page", () => {
    const items = getVisiblePages(20, 20);

    expect(items[items.length - 1]).toBe(20);
    expect(items.filter((item) => item === "ellipsis")).toHaveLength(1);
  });
});
