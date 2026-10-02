"use client";

import { useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { deleteAccount } from "@/actions/profile";
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

/** Destructive action with a confirmation dialog for deleting the account. */
export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await deleteAccount();

      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success("Your account has been deleted.");
      await signOut({ redirectTo: "/sign-in" });
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPending(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!isPending) {
      setOpen(nextOpen);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete account</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This permanently deletes your account along with all of your items,
            collections and tags. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error ? (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
