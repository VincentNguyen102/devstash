"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";

import { CollectionCard } from "@/components/dashboard/collection-card";
import { ItemRow } from "@/components/dashboard/item-row";
import { SectionHeading } from "@/components/dashboard/section-heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FavoriteCollectionSummary } from "@/lib/db/collections";
import type { ItemSummary } from "@/lib/db/items";
import {
  isFavoriteSort,
  sortFavoriteCollections,
  sortFavoriteItems,
  type FavoriteSort,
} from "@/lib/favorites-sort";

const SORT_OPTIONS: { value: FavoriteSort; label: string }[] = [
  { value: "date", label: "Date (newest)" },
  { value: "name", label: "Name (A–Z)" },
  { value: "type", label: "Item type" },
];

interface FavoritesViewProps {
  items: ItemSummary[];
  collections: FavoriteCollectionSummary[];
}

/**
 * Renders the favorites page sections and sorts them in the browser. The
 * server fetches the lists once; changing the sort never hits the network.
 */
export function FavoritesView({ items, collections }: FavoritesViewProps) {
  const [sort, setSort] = useState<FavoriteSort>("date");

  const sortedItems = useMemo(
    () => sortFavoriteItems(items, sort),
    [items, sort],
  );
  const sortedCollections = useMemo(
    () => sortFavoriteCollections(collections, sort),
    [collections, sort],
  );

  const hasFavorites = items.length > 0 || collections.length > 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Favorites</h1>
          <p className="text-muted-foreground">
            All the items and collections you&apos;ve starred
          </p>
        </div>

        {hasFavorites ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by</span>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (isFavoriteSort(value)) setSort(value);
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Sort favorites"
                className="w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </header>

      {hasFavorites ? (
        <>
          <section className="space-y-4">
            <SectionHeading title="Items" icon={<Star className="size-4" />} />
            {sortedItems.length > 0 ? (
              <div className="space-y-3">
                {sortedItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    showFavoriteToggle
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No favorite items yet.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <SectionHeading
              title="Collections"
              icon={<Star className="size-4" />}
            />
            {sortedCollections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sortedCollections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No favorite collections yet.
              </p>
            )}
          </section>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <Star aria-hidden className="size-8 text-muted-foreground" />
          <p className="font-medium">No favorites yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Click the star on any item or collection to save it here.
          </p>
        </div>
      )}
    </div>
  );
}
