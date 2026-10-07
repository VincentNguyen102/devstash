"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { ItemDrawerSheet } from "@/components/dashboard/item-drawer/item-drawer-sheet";
import { ItemDrawerContext } from "@/hooks/use-item-drawer";

/**
 * Owns the selected item id and renders the detail sheet. Mounted once in the
 * dashboard shell so the drawer is available on every page without a
 * navigation.
 */
export function ItemDrawerProvider({ children }: { children: ReactNode }) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ openItem: (itemId: string) => setOpenItemId(itemId) }),
    [],
  );

  const handleClose = useCallback(() => setOpenItemId(null), []);

  return (
    <ItemDrawerContext.Provider value={value}>
      {children}
      <ItemDrawerSheet itemId={openItemId} onClose={handleClose} />
    </ItemDrawerContext.Provider>
  );
}
