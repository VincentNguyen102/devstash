"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteItem,
  setItemFavorite,
  toggleItemPin,
} from "@/actions/items";
import { FavoriteButton } from "@/components/dashboard/favorite-button";
import { PinButton } from "@/components/dashboard/pin-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import type { ItemDetail } from "@/lib/db/items";
import { FILE_TYPE_IDS } from "@/lib/item-type-fields";

/** View-mode action row: favourite / pin / download / copy / edit / delete. */
export function ItemActionBar({
  item,
  onEdit,
  onDeleted,
  onItemUpdated,
}: {
  item: ItemDetail;
  onEdit: () => void;
  onDeleted: () => void;
  onItemUpdated: (item: ItemDetail) => void;
}) {
  const { copy } = useCopyFeedback();

  async function handleFavorite(next: boolean) {
    const result = await setItemFavorite(item.id, next);

    if (result.success && result.data) {
      onItemUpdated(result.data);
    }

    return result;
  }

  async function handlePin(next: boolean) {
    const result = await toggleItemPin(item.id, next);

    if (result.success && result.data) {
      onItemUpdated(result.data);
    }

    return result;
  }

  async function handleCopy() {
    const text = item.content ?? item.url ?? "";

    if (!text) {
      toast.error("Nothing to copy");
      return;
    }

    await copy(text);
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <FavoriteButton
        isFavorite={item.isFavorite}
        subject={item.title}
        showLabel
        announceSuccess
        onToggle={handleFavorite}
      />

      <PinButton
        isPinned={item.isPinned}
        subject={item.title}
        onToggle={handlePin}
      />

      {FILE_TYPE_IDS.has(item.typeId) ? (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
        >
          <a href={`/api/items/${item.id}/file?download=1`}>
            <Download aria-hidden className="size-4" />
            Download
          </a>
        </Button>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={handleCopy}
      >
        <Copy aria-hidden className="size-4" />
        Copy
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto gap-1.5 text-muted-foreground"
        onClick={onEdit}
      >
        <Pencil aria-hidden className="size-4" />
        Edit
      </Button>

      <DeleteItemDialog item={item} onDeleted={onDeleted} />
    </div>
  );
}

/** Trash button with a confirmation dialog that deletes the item. */
function DeleteItemDialog({
  item,
  onDeleted,
}: {
  item: ItemDetail;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const result = await deleteItem(item.id);

      if (!result.success) {
        toast.error(result.error ?? "Couldn't delete item.");
        setIsDeleting(false);
        return;
      }

      toast.success("Item deleted");
      setOpen(false);
      onDeleted();
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isDeleting) setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete item"
        >
          <Trash2 aria-hidden className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete item</DialogTitle>
          <DialogDescription>
            This permanently deletes &ldquo;{item.title}&rdquo;. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
