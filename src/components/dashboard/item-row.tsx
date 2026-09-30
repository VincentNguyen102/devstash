import { Pin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ItemSummary } from "@/lib/db/items";
import { getTypeVisual } from "@/lib/item-type-meta";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function ItemRow({ item }: { item: ItemSummary }) {
  const { Icon, textClass, bgClass, borderClass } = getTypeVisual(item.typeId);

  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-xl bg-card p-3 ring-1 sm:gap-4 sm:p-4",
        borderClass
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          bgClass
        )}
      >
        <Icon aria-hidden className={cn("size-4", textClass)} />
      </span>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-medium">{item.title}</h3>
          {item.isPinned ? (
            <Pin aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
          ) : null}
          {item.isFavorite ? (
            <Star
              aria-hidden
              className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400"
            />
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">{item.description}</p>

        {item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-md">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <time
        dateTime={item.updatedAt.toISOString()}
        className="shrink-0 text-xs text-muted-foreground"
      >
        {dateFormatter.format(item.updatedAt)}
      </time>
    </article>
  );
}
