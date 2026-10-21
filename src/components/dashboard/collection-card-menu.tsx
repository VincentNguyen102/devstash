"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { toast } from "sonner";

import { setCollectionFavorite } from "@/actions/collections";
import { CollectionEditDialog } from "@/components/dashboard/collection-edit-dialog";
import { DeleteCollectionDialog } from "@/components/dashboard/delete-collection-dialog";
import type { CollectionSummary } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

const itemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground";

/**
 * 3-dots menu for a collection card with Edit, Favorite and Delete. The menu is
 * a sibling of the card's link overlay, so opening it never navigates to the
 * collection page.
 */
export function CollectionCardMenu({
  collection,
}: {
  collection: CollectionSummary;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isFavoritePending, startFavoriteTransition] = useTransition();

  function handleFavorite() {
    const next = !collection.isFavorite;

    startFavoriteTransition(async () => {
      try {
        const result = await setCollectionFavorite(collection.id, next);

        if (!result.success) {
          toast.error(result.error ?? "Couldn't update favorite.");
          return;
        }

        toast.success(next ? "Added to favorites" : "Removed from favorites");
        router.refresh();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${collection.name}`}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <MoreVertical aria-hidden className="size-4" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-40 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          >
            <DropdownMenu.Item
              className={itemClass}
              onSelect={() => setEditOpen(true)}
            >
              <Pencil aria-hidden className="size-4" />
              Edit
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className={cn(itemClass, "text-destructive")}
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 aria-hidden className="size-4" />
              Delete
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className={itemClass}
              disabled={isFavoritePending}
              onSelect={handleFavorite}
            >
              <Star
                aria-hidden
                className={cn(
                  "size-4",
                  collection.isFavorite && "fill-yellow-400 text-yellow-400",
                )}
              />
              {collection.isFavorite
                ? "Remove from favorites"
                : "Add to favorites"}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <CollectionEditDialog
        collection={collection}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
