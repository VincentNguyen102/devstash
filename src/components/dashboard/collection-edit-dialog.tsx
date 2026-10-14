"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateCollection } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CollectionSummary } from "@/lib/db/collections";

interface CollectionEditDialogProps {
  collection: CollectionSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Controlled modal for editing a collection's metadata (name and description).
 * Radix unmounts the content while closed, so `EditCollectionForm` mounts fresh
 * with the current values every time the dialog opens.
 */
export function CollectionEditDialog({
  collection,
  open,
  onOpenChange,
}: CollectionEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return;

    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <EditCollectionForm
          collection={collection}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditCollectionForm({
  collection,
  isSubmitting,
  setIsSubmitting,
  onClose,
}: {
  collection: CollectionSummary;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description);

  const canSubmit = name.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await updateCollection(collection.id, {
        name,
        description,
      });

      if (!result.success) {
        toast.error(result.error ?? "Couldn't update collection.");
        return;
      }

      toast.success("Collection updated");
      onClose();
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit collection</DialogTitle>
        <DialogDescription>
          Update the name and description of this collection.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" htmlFor="edit-collection-name">
          <Input
            id="edit-collection-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="React Patterns"
            disabled={isSubmitting}
            required
          />
        </FormField>

        <FormField label="Description" htmlFor="edit-collection-description">
          <Textarea
            id="edit-collection-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Reusable React patterns and hooks"
            disabled={isSubmitting}
          />
        </FormField>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
