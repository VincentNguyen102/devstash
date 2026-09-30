import { Pin } from "lucide-react";

import { CollectionCard } from "@/components/dashboard/collection-card";
import { ItemRow } from "@/components/dashboard/item-row";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { DashboardStats } from "@/components/dashboard/stat-cards";
import {
  getCollectionStats,
  getRecentCollections,
} from "@/lib/db/collections";
import { getItemStats, getPinnedItems, getRecentItems } from "@/lib/db/items";

const RECENT_ITEM_LIMIT = 10;

export default async function DashboardPage() {
  const [
    recentCollections,
    collectionStats,
    itemStats,
    pinnedItems,
    recentItems,
  ] = await Promise.all([
    getRecentCollections(),
    getCollectionStats(),
    getItemStats(),
    getPinnedItems(),
    getRecentItems(RECENT_ITEM_LIMIT),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </header>

      <DashboardStats
        itemCount={itemStats.total}
        collectionCount={collectionStats.total}
        favoriteItemCount={itemStats.favorites}
        favoriteCollectionCount={collectionStats.favorites}
      />

      <section className="space-y-4">
        <SectionHeading title="Collections" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recentCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      {pinnedItems.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading title="Pinned" icon={<Pin className="size-4" />} />
          <div className="space-y-3">
            {pinnedItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeading title="Recent Items" />
        <div className="space-y-3">
          {recentItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
