import type { LucideIcon } from "lucide-react";
import { File, FileCode, FileJson, FileSpreadsheet, FileText } from "lucide-react";

import { extensionOf } from "@/lib/upload";

/**
 * Icon and colour for a stored file, chosen by its extension. Used by the file
 * list rows so each document type is recognisable at a glance.
 */
export interface FileVisual {
  /** Lucide icon component for the file type. */
  Icon: LucideIcon;
  /** Short uppercase label for the extension (e.g. `PDF`, `JSON`, `FILE`). */
  label: string;
  /** Foreground colour class for the icon. */
  textClass: string;
  /** Tinted background class for the icon container. */
  bgClass: string;
}

const EXTENSION_VISUALS: Record<string, Omit<FileVisual, "label">> = {
  pdf: { Icon: FileText, textClass: "text-red-400", bgClass: "bg-red-400/10" },
  txt: {
    Icon: FileText,
    textClass: "text-slate-300",
    bgClass: "bg-slate-400/10",
  },
  md: {
    Icon: FileText,
    textClass: "text-slate-300",
    bgClass: "bg-slate-400/10",
  },
  json: {
    Icon: FileJson,
    textClass: "text-yellow-400",
    bgClass: "bg-yellow-400/10",
  },
  yaml: {
    Icon: FileCode,
    textClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
  },
  yml: {
    Icon: FileCode,
    textClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
  },
  xml: {
    Icon: FileCode,
    textClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
  },
  toml: {
    Icon: FileCode,
    textClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
  },
  ini: {
    Icon: FileCode,
    textClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
  },
  csv: {
    Icon: FileSpreadsheet,
    textClass: "text-green-400",
    bgClass: "bg-green-400/10",
  },
};

const FALLBACK_VISUAL: Omit<FileVisual, "label"> = {
  Icon: File,
  textClass: "text-muted-foreground",
  bgClass: "bg-muted",
};

/** Resolve the icon, colours and extension label for a stored file name. */
export function getFileVisual(fileName: string | null | undefined): FileVisual {
  const extension = extensionOf(fileName ?? "");
  const visual = EXTENSION_VISUALS[extension] ?? FALLBACK_VISUAL;

  return { ...visual, label: extension ? extension.toUpperCase() : "FILE" };
}
