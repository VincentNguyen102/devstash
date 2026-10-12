"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { createCollection } from "@/actions/collections";
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
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CollectionCreateDialogProps {
  /** Custom trigger element; defaults to the top-bar "New Collection" button. */
  trigger?: ReactNode;
}

/**
 * "New Collection" button and modal. The payload is validated by the
 * `createCollection` server action, and a successful create closes the dialog
 * and refreshes the current view so the sidebar, listing and dashboard counts
 * pick up the new collection.
 */
export function CollectionCreateDialog({
  trigger,
}: CollectionCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = name.trim().length > 0;

  function reset() {
    setName("");
    setDescription("");
  }

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return;

    setOpen(next);

    if (!next) reset();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await createCollection({ name, description });

      if (!result.success) {
        toast.error(result.error ?? "Couldn't create collection.");
        return;
      }

      toast.success("Collection created");
      reset();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="lg">
            <FolderPlus aria-hidden />
            New Collection
          </Button>
        )}
      </DialogTrigger>

      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Group related items into a collection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" htmlFor="create-collection-name">
            <Input
              id="create-collection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="React Patterns"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Description" htmlFor="create-collection-description">
            <Textarea
              id="create-collection-description"
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
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
