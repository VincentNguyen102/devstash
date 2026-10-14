"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";

import { CollectionEditDialog } from "@/components/dashboard/collection-edit-dialog";
import { DeleteCollectionDialog } from "@/components/dashboard/delete-collection-dialog";
import { Button } from "@/components/ui/button";
import type { CollectionSummary } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

/**
 * Header actions for the collection detail page: Edit (modal), Delete
 * (confirmation, then back to the listing) and Favorite (icon-only for now — no
 * favouriting logic yet).
 */
export function CollectionActions({
  collection,
}: {
  collection: CollectionSummary;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => setEditOpen(true)}
      >
        <Pencil aria-hidden className="size-4" />
        Edit
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 aria-hidden className="size-4" />
        Delete
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "gap-1.5 text-muted-foreground",
          collection.isFavorite && "text-yellow-400 hover:text-yellow-400",
        )}
      >
        <Star
          aria-hidden
          className={cn("size-4", collection.isFavorite && "fill-yellow-400")}
        />
        Favorite
      </Button>

      <CollectionEditDialog
        collection={collection}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/collections")}
      />
    </div>
  );
}
