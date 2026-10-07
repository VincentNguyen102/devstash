"use client";

import { useEffect, useState } from "react";

import { ItemDetailView } from "@/components/dashboard/item-drawer/item-detail-view";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ItemDetail } from "@/lib/db/items";

/** `ItemDetail` as it arrives over the wire, with dates serialised to strings. */
type SerializedItemDetail = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type DrawerState =
  | { status: "idle" }
  | { status: "loaded"; item: ItemDetail }
  | { status: "error"; itemId: string; error: string };

/**
 * The sheet itself: loads the requested item, keeps the last item visible while
 * the sheet slides closed, and renders the detail view / error / skeleton.
 */
export function ItemDrawerSheet({
  itemId,
  onClose,
}: {
  itemId: string | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<DrawerState>({ status: "idle" });

  useEffect(() => {
    if (itemId === null) return;

    const requestedId: string = itemId;
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/items/${requestedId}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          success: boolean;
          data?: SerializedItemDetail;
          error?: string;
        };

        if (!response.ok || !body.success || !body.data) {
          throw new Error(body.error ?? "Failed to load item.");
        }

        if (cancelled) return;

        setState({
          status: "loaded",
          item: {
            ...body.data,
            createdAt: new Date(body.data.createdAt),
            updatedAt: new Date(body.data.updatedAt),
          },
        });
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;

        setState({
          status: "error",
          itemId: requestedId,
          error:
            error instanceof Error ? error.message : "Failed to load item.",
        });
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [itemId]);

  // Show the loaded item when it matches the current request, keep the last one
  // visible while the sheet slides closed, and fall back to the skeleton while
  // a different item is loading.
  const content =
    state.status === "loaded" && (itemId === null || state.item.id === itemId) ? (
      <ItemDetailView
        key={state.item.id}
        item={state.item}
        onItemUpdated={(item) => setState({ status: "loaded", item })}
        onDeleted={onClose}
      />
    ) : state.status === "error" &&
      (itemId === null || state.itemId === itemId) ? (
      <DrawerError message={state.error} />
    ) : itemId ? (
      <DrawerSkeleton />
    ) : null;

  const title =
    state.status === "loaded" && state.item.id === itemId
      ? state.item.title
      : "Item details";

  return (
    <Sheet
      open={itemId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="w-full gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerError({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-sm font-medium">Couldn&apos;t load this item</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="Loading item">
      <div className="flex items-center gap-3">
        <div className="size-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-8 w-full animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-28 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
