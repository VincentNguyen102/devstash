import Link from "next/link";
import { Star } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTypeVisual } from "@/lib/item-type-meta";
import type { Collection } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full transition-shadow hover:ring-foreground/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="truncate">{collection.name}</span>
            {collection.isFavorite ? (
              <>
                <Star
                  aria-hidden
                  className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400"
                />
                <span className="sr-only">Favorite</span>
              </>
            ) : null}
          </CardTitle>
          <CardDescription>{collection.itemCount} items</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {collection.description}
          </p>
          <div className="flex items-center gap-2">
            {collection.typeIds.map((typeId) => {
              const { Icon, textClass } = getTypeVisual(typeId);
              return <Icon key={typeId} aria-hidden className={cn("size-4", textClass)} />;
            })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
