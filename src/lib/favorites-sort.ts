import type { FavoriteCollectionSummary } from "@/lib/db/collections";
import type { ItemSummary } from "@/lib/db/items";
import { systemTypeOrder } from "@/lib/item-type-meta";

/** Client-side sort options for the favorites page. */
export type FavoriteSort = "date" | "name" | "type";

/** Type guard for the values the sort select can emit. */
export function isFavoriteSort(value: string): value is FavoriteSort {
  return value === "date" || value === "name" || value === "type";
}

const collator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});

function compareNames(a: string, b: string): number {
  return collator.compare(a, b);
}

function compareDates(a: Date, b: Date): number {
  return b.getTime() - a.getTime();
}

/**
 * Compare two item type ids in canonical order. `null` represents a collection
 * with no dominant type and sorts after every real type.
 */
function compareTypeIds(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  const order = systemTypeOrder(a) - systemTypeOrder(b);

  return order !== 0 ? order : compareNames(a, b);
}

/**
 * Sort favorite items without mutating the incoming array. Date is newest
 * first; Type groups items in canonical system-type order; Name is A–Z.
 */
export function sortFavoriteItems(
  items: readonly ItemSummary[],
  sort: FavoriteSort,
): ItemSummary[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    switch (sort) {
      case "date":
        return compareDates(a.updatedAt, b.updatedAt) || compareNames(a.title, b.title);
      case "type":
        return (
          compareTypeIds(a.typeId, b.typeId) || compareNames(a.title, b.title)
        );
      case "name":
      default:
        return compareNames(a.title, b.title);
    }
  });

  return sorted;
}

/**
 * Sort favorite collections without mutating the incoming array. Date is
 * newest first; Type uses each collection's dominant type in canonical order
 * (empty collections last); Name is A–Z.
 */
export function sortFavoriteCollections(
  collections: readonly FavoriteCollectionSummary[],
  sort: FavoriteSort,
): FavoriteCollectionSummary[] {
  const sorted = [...collections];

  sorted.sort((a, b) => {
    switch (sort) {
      case "date":
        return (
          compareDates(a.updatedAt, b.updatedAt) ||
          compareNames(a.name, b.name)
        );
      case "type":
        return (
          compareTypeIds(a.dominantTypeId, b.dominantTypeId) ||
          compareNames(a.name, b.name)
        );
      case "name":
      default:
        return compareNames(a.name, b.name);
    }
  });

  return sorted;
}
