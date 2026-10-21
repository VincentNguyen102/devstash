"use client";

import { setItemFavorite } from "@/actions/items";
import { FavoriteButton } from "@/components/dashboard/favorite-button";
import type { ItemSummary } from "@/lib/db/items";

interface ItemFavoriteButtonProps {
  item: Pick<ItemSummary, "id" | "title" | "isFavorite">;
  showLabel?: boolean;
  announceSuccess?: boolean;
  className?: string;
  iconClassName?: string;
}

/** Favorite toggle wired to the signed-in user's items. */
export function ItemFavoriteButton({
  item,
  showLabel,
  announceSuccess,
  className,
  iconClassName,
}: ItemFavoriteButtonProps) {
  return (
    <FavoriteButton
      isFavorite={item.isFavorite}
      subject={item.title}
      showLabel={showLabel}
      announceSuccess={announceSuccess}
      className={className}
      iconClassName={iconClassName}
      onToggle={(next) => setItemFavorite(item.id, next)}
    />
  );
}
