"use client";

import { useOptimistic, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FavoriteToggleResult {
  success: boolean;
  error?: string;
}

interface FavoriteButtonProps {
  isFavorite: boolean;
  /** What is being favorited, used in the accessible label ("item"). */
  subject: string;
  /** Persists the requested state; the caller owns the server call. */
  onToggle: (next: boolean) => Promise<FavoriteToggleResult>;
  /** Show the "Favorite" label next to the star (drawer / detail header). */
  showLabel?: boolean;
  /** Toast on success as well as failure. Off for compact card buttons. */
  announceSuccess?: boolean;
  className?: string;
  iconClassName?: string;
}

/**
 * Star toggle shared by item and collection surfaces. Shows the next state
 * optimistically while the server call runs, prevents the click from opening
 * a surrounding card, and rolls back automatically when the call fails.
 */
export function FavoriteButton({
  isFavorite,
  subject,
  onToggle,
  showLabel = false,
  announceSuccess = false,
  className,
  iconClassName,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);
  const [isPending, startTransition] = useTransition();

  const label = optimisticFavorite
    ? `Remove ${subject} from favorites`
    : `Add ${subject} to favorites`;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Cards and rows open the drawer/navigate on click; keep that from firing.
    event.stopPropagation();

    const next = !optimisticFavorite;

    startTransition(async () => {
      setOptimisticFavorite(next);

      try {
        const result = await onToggle(next);

        if (!result.success) {
          toast.error(result.error ?? "Couldn't update favorite.");
          return;
        }

        if (announceSuccess) {
          toast.success(
            next ? "Added to favorites" : "Removed from favorites",
          );
        }

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
      size={showLabel ? "sm" : "icon-xs"}
      aria-pressed={optimisticFavorite}
      aria-label={label}
      title={label}
      disabled={isPending}
      className={cn(
        "shrink-0 text-muted-foreground hover:text-yellow-400",
        optimisticFavorite && "text-yellow-400 hover:text-yellow-400",
        showLabel && "gap-1.5",
        className,
      )}
      onClick={handleClick}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Star
        aria-hidden
        className={cn(
          "size-3.5",
          optimisticFavorite && "fill-yellow-400",
          iconClassName,
        )}
      />
      {showLabel ? "Favorite" : null}
    </Button>
  );
}
