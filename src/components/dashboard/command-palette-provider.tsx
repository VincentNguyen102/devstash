"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { CommandPalette } from "@/components/dashboard/command-palette";
import { CommandPaletteContext } from "@/hooks/use-command-palette";
import type { CollectionSummary } from "@/lib/db/collections";
import type { SearchItem } from "@/lib/search";

interface CommandPaletteProviderProps {
  children: ReactNode;
  /** Pre-fetched item index, resolved on the server at app load. */
  searchItems: SearchItem[];
  collections: CollectionSummary[];
}

/**
 * Owns the palette's open state, installs the global ⌘K / Ctrl+K hotkey and
 * exposes `useCommandPalette` so the top bar can open it. Mounted once in the
 * dashboard shell so search is available on every page.
 */
export function CommandPaletteProvider({
  children,
  searchItems,
  collections,
}: CommandPaletteProviderProps) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((current) => !current),
    }),
    [],
  );

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      setOpen((current) => !current);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={searchItems}
        collections={collections}
      />
    </CommandPaletteContext.Provider>
  );
}
