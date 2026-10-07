/**
 * Shared date formatters. The `Intl.DateTimeFormat` instances are created once
 * at module scope so list rows and cards don't rebuild them on every render.
 * All formatters use UTC so server and client output match.
 */

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const MEDIUM_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

/** e.g. `Oct 7`. */
export function formatShortDate(date: Date): string {
  return SHORT_DATE.format(date);
}

/** e.g. `Oct 7, 2026`. */
export function formatMediumDate(date: Date): string {
  return MEDIUM_DATE.format(date);
}

/** e.g. `October 7, 2026`. */
export function formatLongDate(date: Date): string {
  return LONG_DATE.format(date);
}
