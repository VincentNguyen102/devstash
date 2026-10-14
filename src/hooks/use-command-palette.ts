"use client";

import { createContext, useContext } from "react";

export interface CommandPaletteContextValue {
  /** Open the global search palette. */
  open: () => void;
  /** Close the global search palette. */
  close: () => void;
  /** Toggle the global search palette (used by the ⌘K / Ctrl+K hotkey). */
  toggle: () => void;
}

/** Context backing the command palette; provided by `CommandPaletteProvider`. */
export const CommandPaletteContext =
  createContext<CommandPaletteContextValue | null>(null);

/** Open the global search palette from the top bar or any other trigger. */
export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);

  if (!context) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider",
    );
  }

  return context;
}
