"use client";

import Image from "next/image";
import { Pin, Star } from "lucide-react";

import { ItemCard } from "@/components/dashboard/item-card";
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

/**
 * Gallery card for `image` items: a 16:9 thumbnail that zooms slightly on
 * hover, with the usual title/description/tags/date metadata below. Images
 * without a stored object fall back to the regular `ItemCard`.
 *
 * `eager` marks the first thumbnail (the likely LCP image) so it loads
 * immediately; the rest stay lazy.
 */
export function ImageThumbnailCard({
  item,
  eager = false,
}: {
  item: ItemSummary;
  eager?: boolean;
}) {
  const openTarget = useItemOpenTarget(item.id, item.title);

  // No backing object means there is nothing to show; avoid a broken image.
  if (!item.fileName) {
    return <ItemCard item={item} />;
  }

  return (
    <Card
      {...openTarget}
      className="group h-full cursor-pointer gap-4 pt-0 transition-shadow hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {/*
          Proxied through the app so the private object key stays server-side.
          `unoptimized` is required here: the image optimizer does not forward
          the session cookie, and the proxy route is owner-scoped.
        */}
        <Image
          src={`/api/items/${item.id}/file`}
          alt={item.title}
          fill
          unoptimized
          loading={eager ? "eager" : "lazy"}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {item.isPinned || item.isFavorite ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-1 backdrop-blur-sm">
            {item.isPinned ? (
              <Pin aria-hidden className="size-3.5 text-muted-foreground" />
            ) : null}
            {item.isFavorite ? (
              <Star
                aria-hidden
                className="size-3.5 fill-yellow-400 text-yellow-400"
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <CardHeader>
        <CardTitle className="flex items-start gap-2">
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
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
