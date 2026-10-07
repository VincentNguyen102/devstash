"use client";

import { createContext, useContext } from "react";

export interface ItemDrawerContextValue {
  openItem: (itemId: string) => void;
}

/** Context backing the item drawer; provided by `ItemDrawerProvider`. */
export const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(
  null,
);

/** Open the item detail drawer from any item card or row. */
export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);

  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }

  return context;
}
