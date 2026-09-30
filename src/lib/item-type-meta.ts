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

import { itemTypes, type ItemType } from "@/lib/mock-data";

export interface TypeVisual {
  /** Icon component for the item type. */
  Icon: LucideIcon;
  /** Foreground colour class for the icon. */
  textClass: string;
  /** Tinted background class for icon containers. */
  bgClass: string;
  /** Border (ring) colour class, e.g. for a card tied to this type. */
  borderClass: string;
}

const ICONS: Record<string, LucideIcon> = {
  CodeXml,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

const VISUALS_BY_TYPE_ID: Record<string, Omit<TypeVisual, "Icon">> = {
  snippet: {
    textClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
    borderClass: "ring-blue-400/40",
  },
  prompt: {
    textClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
    borderClass: "ring-violet-400/40",
  },
  command: {
    textClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
    borderClass: "ring-orange-400/40",
  },
  note: {
    textClass: "text-yellow-400",
    bgClass: "bg-yellow-400/10",
    borderClass: "ring-yellow-400/40",
  },
  file: {
    textClass: "text-slate-400",
    bgClass: "bg-slate-400/10",
    borderClass: "ring-slate-400/40",
  },
  image: {
    textClass: "text-pink-400",
    bgClass: "bg-pink-400/10",
    borderClass: "ring-pink-400/40",
  },
  url: {
    textClass: "text-green-400",
    bgClass: "bg-green-400/10",
    borderClass: "ring-green-400/40",
  },
};

const FALLBACK_VISUAL: Omit<TypeVisual, "Icon"> = {
  textClass: "text-muted-foreground",
  bgClass: "bg-muted",
  borderClass: "ring-foreground/10",
};

/** Look up an item type by id. */
export function getType(typeId: string): ItemType | undefined {
  return itemTypes.find((type) => type.id === typeId);
}

/** Resolve the icon and colour classes for an item type. */
export function getTypeVisual(typeId: string): TypeVisual {
  const type = getType(typeId);

  return {
    Icon: (type ? ICONS[type.icon] : undefined) ?? File,
    ...(VISUALS_BY_TYPE_ID[typeId] ?? FALLBACK_VISUAL),
  };
}
