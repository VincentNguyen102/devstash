"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { copyToClipboard } from "@/lib/clipboard";

/**
 * Copies text to the clipboard with the shared success/error toasts, exposing a
 * short-lived `copied` flag for check-mark feedback. Used by the code/markdown
 * editors, the item copy button and the drawer action bar.
 */
export function useCopyFeedback() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (value: string): Promise<boolean> => {
    const copiedToClipboard = await copyToClipboard(value);

    if (!copiedToClipboard) {
      toast.error("Couldn't copy to clipboard");
      return false;
    }

    setCopied(true);
    toast.success("Copied to clipboard");
    window.setTimeout(() => setCopied(false), 1500);
    return true;
  }, []);

  return { copied, copy };
}
