"use client";

import { Pin, Star } from "lucide-react";

import { ItemCopyButton } from "@/components/dashboard/item-copy-button";
import { useItemOpenTarget } from "@/hooks/use-item-open-target";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatShortDate } from "@/lib/date";
import type { ItemSummary } from "@/lib/db/items";
import { getTypeVisual } from "@/lib/item-type-meta";
import { cn } from "@/lib/utils";

export function ItemCard({ item }: { item: ItemSummary }) {
  const openTarget = useItemOpenTarget(item.id, item.title);
  const { Icon, textClass, bgClass, accentClass } = getTypeVisual(item.typeId);

  return (
    <Card
      {...openTarget}
      className={cn(
        "h-full cursor-pointer border-l-4 transition-shadow hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/50",
        accentClass
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-start gap-2">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              bgClass
            )}
          >
            <Icon aria-hidden className={cn("size-4", textClass)} />
          </span>
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          {item.isPinned ? (
            <Pin
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
            />
          ) : null}
          {item.isFavorite ? (
            <Star
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 fill-yellow-400 text-yellow-400"
            />
          ) : null}
          <ItemCopyButton item={item} className="-mt-0.5 -mr-1" />
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {item.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-md">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <time
          dateTime={item.updatedAt.toISOString()}
          className="mt-auto text-xs text-muted-foreground"
        >
          {formatShortDate(item.updatedAt)}
        </time>
      </CardContent>
    </Card>
  );
}
