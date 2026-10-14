"use client";

import { FolderPlus, PanelLeft, Search } from "lucide-react";

import { CollectionCreateDialog } from "@/components/dashboard/collection-create-dialog";
import { ItemCreateDialog } from "@/components/dashboard/item-create-dialog";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/hooks/use-command-palette";

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { open: openCommandPalette } = useCommandPalette();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <div className="flex flex-1 items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          <PanelLeft aria-hidden />
        </Button>
      </div>

      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Search items and collections"
        className="group relative flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-input/30 pr-2 pl-8 text-left text-sm text-muted-foreground transition-colors outline-none hover:border-ring/60 hover:bg-input/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <span className="truncate">Search items…</span>
        <kbd className="ml-auto shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground transition-colors group-hover:text-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="flex flex-1 items-center justify-end gap-2">
        <CollectionCreateDialog
          trigger={
            <Button variant="outline" size="lg" className="hidden sm:inline-flex">
              <FolderPlus aria-hidden />
              New Collection
            </Button>
          }
        />
        <ItemCreateDialog />
      </div>
    </header>
  );
}
