"use client";

import { useRouter } from "next/navigation";
import { Layers, Star } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useItemDrawer } from "@/hooks/use-item-drawer";
import type { CollectionSummary } from "@/lib/db/collections";
import { getTypeLabel, getTypeVisual } from "@/lib/item-type-meta";
import { paletteFilter, type SearchItem } from "@/lib/search";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fetched item index; filtered client-side by cmdk. */
  items: SearchItem[];
  /** The user's collections, shown with their item counts. */
  collections: CollectionSummary[];
}

/**
 * The global search palette. Filtering, grouping and keyboard navigation are
 * handled by cmdk; selecting an item opens the drawer and selecting a
 * collection navigates to its page.
 */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  collections,
}: CommandPaletteProps) {
  const router = useRouter();
  const { openItem } = useItemDrawer();

  const handleSelectItem = (itemId: string) => {
    onOpenChange(false);
    openItem(itemId);
  };

  const handleSelectCollection = (collectionId: string) => {
    onOpenChange(false);
    router.push(`/collections/${collectionId}`);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search DevStash"
      description="Search your items and collections"
      className="sm:max-w-xl"
      filter={paletteFilter}
    >
      <CommandInput placeholder="Search items and collections…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {items.length > 0 ? (
          <CommandGroup heading="Items">
            {items.map((item) => {
              const { Icon, textClass } = getTypeVisual(item.typeId);
              const typeLabel = getTypeLabel(item.typeId);

              return (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  keywords={[`${item.title} ${typeLabel}`, item.preview]}
                  onSelect={() => handleSelectItem(item.id)}
                >
                  <Icon aria-hidden className={cn("size-4 shrink-0", textClass)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate leading-snug">{item.title}</p>
                    {item.preview ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.preview}
                      </p>
                    ) : null}
                  </div>
                  <CommandShortcut className="tracking-normal">
                    {typeLabel}
                  </CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}

        {collections.length > 0 ? (
          <CommandGroup heading="Collections">
            {collections.map((collection) => (
              <CommandItem
                key={collection.id}
                value={collection.id}
                keywords={[collection.name, collection.description]}
                onSelect={() => handleSelectCollection(collection.id)}
              >
                {collection.isFavorite ? (
                  <Star
                    aria-hidden
                    className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
                  />
                ) : (
                  <Layers
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                )}
                <span className="truncate">{collection.name}</span>
                <CommandShortcut className="tracking-normal">
                  {collection.itemCount}{" "}
                  {collection.itemCount === 1 ? "item" : "items"}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
