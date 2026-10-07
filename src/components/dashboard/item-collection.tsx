import type { ComponentType } from "react";

import { FileListItem } from "@/components/dashboard/file-list-item";
import { ImageThumbnailCard } from "@/components/dashboard/image-thumbnail-card";
import { ItemCard } from "@/components/dashboard/item-card";
import type { ItemSummary } from "@/lib/db/items";

interface ItemCollectionProps {
  typeId: string;
  items: ItemSummary[];
}

type ItemLayout = ComponentType<{ items: ItemSummary[] }>;

/** Single-column file list (Google Drive/Dropbox style). */
function FileListView({ items }: { items: ItemSummary[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <FileListItem key={item.id} item={item} />
      ))}
    </div>
  );
}

/** Three-column gallery of image thumbnails. */
function ImageGalleryView({ items }: { items: ItemSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {items.map((item, index) => (
        // The first row is above the fold, so load it eagerly for LCP.
        <ImageThumbnailCard key={item.id} item={item} eager={index < 3} />
      ))}
    </div>
  );
}

/** Default responsive grid of item cards. */
function ItemGridView({ items }: { items: ItemSummary[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

/**
 * Item type id -> layout. Register a new layout here to give a type its own
 * presentation; every type without an entry falls back to `ItemGridView`.
 */
const LAYOUTS: Record<string, ItemLayout> = {
  file: FileListView,
  image: ImageGalleryView,
};

/**
 * Renders the items using the layout registered for their type (file list,
 * image gallery, or the default card grid). Keeping the dispatch here means
 * pages only render `<ItemCollection typeId={type} items={items} />`.
 */
export function ItemCollection({ typeId, items }: ItemCollectionProps) {
  const Layout = LAYOUTS[typeId] ?? ItemGridView;

  return <Layout items={items} />;
}
