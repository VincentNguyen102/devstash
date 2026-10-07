import { describe, expect, it } from "vitest";

import { formatLongDate, formatMediumDate, formatShortDate } from "@/lib/date";

const DATE = new Date("2026-10-07T12:00:00Z");

describe("date formatters", () => {
  it("formats a short date without the year", () => {
    expect(formatShortDate(DATE)).toBe("Oct 7");
  });

  it("formats a medium date with a short month and year", () => {
    expect(formatMediumDate(DATE)).toBe("Oct 7, 2026");
  });

  it("formats a long date with the full month and year", () => {
    expect(formatLongDate(DATE)).toBe("October 7, 2026");
  });

  it("renders UTC-relative dates consistently", () => {
    // Late in the UTC day: a non-UTC formatter could roll over to the next day.
    expect(formatShortDate(new Date("2026-10-07T23:30:00Z"))).toBe("Oct 7");
  });
});
