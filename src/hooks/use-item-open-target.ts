"use client";

import type { KeyboardEvent } from "react";

import { useItemDrawer } from "@/hooks/use-item-drawer";

/**
 * Spreadable props that make a card or row open the item drawer on click and on
 * Enter/Space, keeping the role, accessible label and key handling in one place.
 */
export function useItemOpenTarget(itemId: string, title: string) {
  const { openItem } = useItemDrawer();

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItem(itemId);
    }
  }

  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `Open ${title}`,
    onClick: () => openItem(itemId),
    onKeyDown: handleKeyDown,
  };
}
