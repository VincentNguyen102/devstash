"use client";

import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { changePassword } from "@/actions/profile";
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
import { Input } from "@/components/ui/input";

/** Dialog and form for changing the account password. */
export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await changePassword(new FormData(event.currentTarget));

      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success(result.data?.message ?? "Password updated.");
      formRef.current?.reset();
      setOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
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
        <Button variant="outline">Change password</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password, then choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-sm font-medium">
              Current password
            </label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">
              New password
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm new password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
