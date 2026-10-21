import Link from "next/link";

import { CollectionCardMenu } from "@/components/dashboard/collection-card-menu";
import { CollectionFavoriteButton } from "@/components/dashboard/collection-favorite-button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CollectionSummary } from "@/lib/db/collections";
import { getTypeVisual } from "@/lib/item-type-meta";
import { cn } from "@/lib/utils";

export function CollectionCard({
  collection,
}: {
  collection: CollectionSummary;
}) {
  const accentClass = collection.dominantTypeId
    ? getTypeVisual(collection.dominantTypeId).accentClass
    : undefined;

  return (
    <Card
      className={cn(
        "relative h-full border-l-4 transition-shadow hover:ring-foreground/25",
        accentClass
      )}
    >
      {/* Covers the card so clicking anywhere opens the collection; the menu
          below sits above it to stay clickable. */}
      <Link
        href={`/collections/${collection.id}`}
        aria-label={`Open ${collection.name}`}
        className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />

      <CardHeader className="pointer-events-none">
        <CardTitle className="flex items-center gap-2">
          <span className="truncate">{collection.name}</span>
        </CardTitle>
        <CardDescription>{collection.itemCount} items</CardDescription>
        <CardAction className="pointer-events-auto relative z-10 flex items-center gap-1">
          <CollectionFavoriteButton collection={collection} />
          <CollectionCardMenu collection={collection} />
        </CardAction>
      </CardHeader>

      <CardContent className="pointer-events-none flex flex-1 flex-col justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {collection.description}
        </p>
        <div className="flex items-center gap-2">
          {collection.typeIds.map((typeId) => {
            const { Icon, textClass } = getTypeVisual(typeId);
            return (
              <Icon
                key={typeId}
                aria-hidden
                className={cn("size-4", textClass)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
