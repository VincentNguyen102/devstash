"use client";

import { setCollectionFavorite } from "@/actions/collections";
import { FavoriteButton } from "@/components/dashboard/favorite-button";
import type { CollectionSummary } from "@/lib/db/collections";

interface CollectionFavoriteButtonProps {
  collection: Pick<CollectionSummary, "id" | "name" | "isFavorite">;
  showLabel?: boolean;
  announceSuccess?: boolean;
  className?: string;
  iconClassName?: string;
}

/** Favorite toggle wired to the signed-in user's collections. */
export function CollectionFavoriteButton({
  collection,
  showLabel,
  announceSuccess,
  className,
  iconClassName,
}: CollectionFavoriteButtonProps) {
  return (
    <FavoriteButton
      isFavorite={collection.isFavorite}
      subject={collection.name}
      showLabel={showLabel}
      announceSuccess={announceSuccess}
      className={className}
      iconClassName={iconClassName}
      onToggle={(next) => setCollectionFavorite(collection.id, next)}
    />
  );
}
