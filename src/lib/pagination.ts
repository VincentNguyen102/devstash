/** Helpers for paginated listings. Pure functions, unit tested. */

/** A single page of rows plus the counts a pagination control needs. */
export interface Paginated<T> {
  items: T[];
  /** Total rows across every page. */
  total: number;
  /** 1-based page actually returned (clamped into range). */
  page: number;
  /** Total number of pages; 0 when there are no rows. */
  pageCount: number;
}

/** A numbered page link, or a gap between two groups of numbers. */
export type PaginationItem = number | "ellipsis";

/** Parse a `?page=` search param into a 1-based page number (defaults to 1). */
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw || !/^\d+$/.test(raw)) {
    return 1;
  }

  const parsed = Number.parseInt(raw, 10);

  return parsed < 1 ? 1 : parsed;
}

/** Number of pages needed for `total` rows at `perPage` per page. */
export function getPageCount(total: number, perPage: number): number {
  if (perPage <= 0 || total <= 0) {
    return 0;
  }

  return Math.ceil(total / perPage);
}

/** Clamp a requested page into `1..pageCount` (a page even when empty). */
export function clampPage(page: number, pageCount: number): number {
  const max = Math.max(pageCount, 1);

  return Math.min(Math.max(page, 1), max);
}

/** Rows to skip for a 1-based `page`. */
export function getPageSkip(page: number, perPage: number): number {
  return (Math.max(page, 1) - 1) * perPage;
}

/**
 * The numbered links to render for a pagination control: every page when the
 * count is small, otherwise the first and last pages plus a window around the
 * current one, with `"ellipsis"` marking each gap.
 */
export function getVisiblePages(
  page: number,
  pageCount: number,
  maxVisible = 7,
): PaginationItem[] {
  if (pageCount <= maxVisible) {
    return Array.from({ length: Math.max(pageCount, 0) }, (_, index) => index + 1);
  }

  const start = Math.max(2, Math.min(page - 2, pageCount - maxVisible + 2));
  const end = Math.min(pageCount - 1, Math.max(page + 2, maxVisible - 1));
  const items: PaginationItem[] = [1];

  if (start > 2) {
    items.push("ellipsis");
  }

  for (let current = start; current <= end; current += 1) {
    items.push(current);
  }

  if (end < pageCount - 1) {
    items.push("ellipsis");
  }

  items.push(pageCount);

  return items;
}
