"use client";

import { useOptimistic, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PinToggleResult {
  success: boolean;
  error?: string;
}

interface PinButtonProps {
  isPinned: boolean;
  /** What is being pinned, used in the accessible label ("Pin <title>"). */
  subject: string;
  /** Persists the requested state; the caller owns the server call. */
  onToggle: (next: boolean) => Promise<PinToggleResult>;
  className?: string;
}

/**
 * Pin toggle for the item drawer. Shows the next state optimistically while the
 * server call runs and rolls back automatically when it fails, matching the
 * favorite button's behaviour.
 */
export function PinButton({
  isPinned,
  subject,
  onToggle,
  className,
}: PinButtonProps) {
  const router = useRouter();
  const [optimisticPinned, setOptimisticPinned] = useOptimistic(isPinned);
  const [isPending, startTransition] = useTransition();

  const label = optimisticPinned ? `Unpin ${subject}` : `Pin ${subject}`;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // The button sits inside a drawer, but keep a surrounding click from firing
    // just in case it is reused on a card later.
    event.stopPropagation();

    const next = !optimisticPinned;

    startTransition(async () => {
      setOptimisticPinned(next);

      try {
        const result = await onToggle(next);

        if (!result.success) {
          toast.error(result.error ?? "Couldn't update pin.");
          return;
        }

        toast.success(next ? "Item pinned" : "Item unpinned");
        router.refresh();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={optimisticPinned}
      aria-label={label}
      title={label}
      disabled={isPending}
      className={cn(
        "gap-1.5 text-muted-foreground hover:text-rose-400",
        optimisticPinned && "text-rose-400 hover:text-rose-400",
        className,
      )}
      onClick={handleClick}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Pin
        aria-hidden
        className={cn("size-4", optimisticPinned && "fill-current")}
      />
      Pin
    </Button>
  );
}
