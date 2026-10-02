import type { LucideIcon } from "lucide-react";
import {
  CodeXml,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  StickyNote,
  Terminal,
} from "lucide-react";

export interface TypeVisual {
  /** Icon component for the item type. */
  Icon: LucideIcon;
  /** Foreground colour class for the icon. */
  textClass: string;
  /** Tinted background class for icon containers. */
  bgClass: string;
  /** Accent colour classes for the thick left border of a card/row. */
  accentClass: string;
}

/** Lucide icons keyed by the icon name stored on an `ItemType` row. */
const ICONS: Record<string, LucideIcon> = {
  CodeXml,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

/** Canonical icon for each system item type id. */
const ICON_BY_TYPE_ID: Record<string, LucideIcon> = {
  snippet: CodeXml,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: ImageIcon,
  url: LinkIcon,
};

/**
 * Canonical display order for the built-in item types. Ids are stable slugs, so
 * this keeps ordering deterministic without an explicit column in the database.
 * Custom/unknown types sort last.
 */
export const SYSTEM_TYPE_ORDER: string[] = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "url",
];

/** Sort index for an item type id; unknown types sort after all system types. */
export function systemTypeOrder(typeId: string): number {
  const index = SYSTEM_TYPE_ORDER.indexOf(typeId);
  return index === -1 ? SYSTEM_TYPE_ORDER.length : index;
}

const VISUALS_BY_TYPE_ID: Record<string, Omit<TypeVisual, "Icon">> = {
  snippet: {
    textClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
    accentClass: "border-blue-400/60 hover:border-blue-400",
  },
  prompt: {
    textClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
    accentClass: "border-violet-400/60 hover:border-violet-400",
  },
  command: {
    textClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
    accentClass: "border-orange-400/60 hover:border-orange-400",
  },
  note: {
    textClass: "text-yellow-400",
    bgClass: "bg-yellow-400/10",
    accentClass: "border-yellow-400/60 hover:border-yellow-400",
  },
  file: {
    textClass: "text-slate-400",
    bgClass: "bg-slate-400/10",
    accentClass: "border-slate-400/60 hover:border-slate-400",
  },
  image: {
    textClass: "text-pink-400",
    bgClass: "bg-pink-400/10",
    accentClass: "border-pink-400/60 hover:border-pink-400",
  },
  url: {
    textClass: "text-green-400",
    bgClass: "bg-green-400/10",
    accentClass: "border-green-400/60 hover:border-green-400",
  },
};

const FALLBACK_VISUAL: Omit<TypeVisual, "Icon"> = {
  textClass: "text-muted-foreground",
  bgClass: "bg-muted",
  accentClass: "border-foreground/15 hover:border-foreground/30",
};

/**
 * Resolve the icon and colour classes for an item type.
 *
 * `iconName` is the lucide icon name stored on the `ItemType` row and takes
 * precedence, so database-backed types render their own icon. Custom types with
 * an unknown name fall back to the canonical system icon and, failing that, a
 * generic file icon.
 */
export function getTypeVisual(
  typeId: string,
  iconName?: string | null
): TypeVisual {
  const Icon =
    (iconName ? ICONS[iconName] : undefined) ?? ICON_BY_TYPE_ID[typeId] ?? File;

  return {
    Icon,
    ...(VISUALS_BY_TYPE_ID[typeId] ?? FALLBACK_VISUAL),
  };
}
