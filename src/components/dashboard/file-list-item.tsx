"use client";

import { Download } from "lucide-react";

import { useItemDrawer } from "@/hooks/use-item-drawer";
import { Button } from "@/components/ui/button";
import { formatMediumDate } from "@/lib/date";
import type { ItemSummary } from "@/lib/db/items";
import { getFileVisual } from "@/lib/file-type-meta";
import { formatFileSize } from "@/lib/upload";
import { cn } from "@/lib/utils";

/**
 * A single row in the file list view: extension icon, name, size, upload date
 * and a direct download button. Clicking the row opens the item drawer; the
 * download link sits outside the click target so it never triggers the drawer.
 */
export function FileListItem({ item }: { item: ItemSummary }) {
  const { openItem } = useItemDrawer();
  const { Icon, label, textClass, bgClass } = getFileVisual(item.fileName);
  const name = item.fileName ?? item.title;
  const size =
    typeof item.fileSize === "number" ? formatFileSize(item.fileSize) : "—";

  return (
    <article className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/40">
      <button
        type="button"
        onClick={() => openItem(item.id)}
        aria-label={`Open ${item.title}`}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:gap-4"
      >
        <span className="flex min-w-0 items-center gap-3 sm:flex-1">
          <span
            title={label}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              bgClass,
            )}
          >
            <Icon aria-hidden className={cn("size-5", textClass)} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {name}
          </span>
        </span>

        <span className="flex flex-col text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
          <span className="tabular-nums">{size}</span>
          <time
            dateTime={item.updatedAt.toISOString()}
            className="tabular-nums"
          >
            {formatMediumDate(item.updatedAt)}
          </time>
        </span>
      </button>

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="shrink-0 gap-1.5 text-muted-foreground"
      >
        <a
          href={`/api/items/${item.id}/file?download=1`}
          aria-label={`Download ${name}`}
        >
          <Download aria-hidden className="size-4" />
          <span className="hidden sm:inline">Download</span>
        </a>
      </Button>
    </article>
  );
}
