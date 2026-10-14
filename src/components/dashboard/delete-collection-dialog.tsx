"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteCollection } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteCollectionDialogProps {
  collection: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful delete; defaults to refreshing the view. */
  onDeleted?: () => void;
}

/**
 * Confirmation modal for deleting a collection. Only the collection itself is
 * removed — the items it contained are kept. The dialog is controlled so both
 * the detail-page button and the card menu can share it, and it cannot be
 * dismissed while the delete is in flight.
 */
export function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCollectionDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (isDeleting) return;

    onOpenChange(next);
  }

  async function handleDelete() {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const result = await deleteCollection(collection.id);

      if (!result.success) {
        toast.error(result.error ?? "Couldn't delete collection.");
        setIsDeleting(false);
        return;
      }

      toast.success("Collection deleted");
      onOpenChange(false);
      onDeleted?.();

      // Always refresh so the sidebar/listing counts drop the collection even
      // when we are navigating (the client router cache could serve stale data).
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Delete collection</DialogTitle>
          <DialogDescription>
            This deletes the collection &ldquo;{collection.name}&rdquo;. Its
            items are not deleted — they just won&rsquo;t belong to this
            collection anymore. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
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
