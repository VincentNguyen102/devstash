"use client";

import type { MouseEvent } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { getItemCopyText, type CopyableItem } from "@/lib/item-copy";
import { cn } from "@/lib/utils";

interface ItemCopyButtonProps {
  item: CopyableItem;
  className?: string;
}

/**
 * Small ghost icon button that copies an item's content (or its URL / file
 * link) without opening the detail drawer. Renders nothing when there is
 * nothing to copy, and shows a brief check mark on success.
 */
export function ItemCopyButton({ item, className }: ItemCopyButtonProps) {
  const { copied, copy } = useCopyFeedback();

  // Resolve without an origin: a relative file link counts as copyable.
  if (!getItemCopyText(item)) {
    return null;
  }

  const label = item.content?.trim()
    ? "Copy content"
    : item.url?.trim()
      ? "Copy link"
      : "Copy file link";

  async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
    // The surrounding card opens the drawer on click; don't trigger it here.
    event.stopPropagation();

    const text = getItemCopyText(item, window.location.origin);
    if (!text) return;

    await copy(text);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title="Copy"
      className={cn("shrink-0 text-muted-foreground hover:text-foreground", className)}
      onClick={handleCopy}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {copied ? (
        <Check aria-hidden className="text-green-400" />
      ) : (
        <Copy aria-hidden />
      )}
    </Button>
  );
}
