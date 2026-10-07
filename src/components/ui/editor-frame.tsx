"use client";

import type { ReactNode } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { cn } from "@/lib/utils";

interface EditorFrameProps {
  /** Accessible label for the editor region. */
  "aria-label": string;
  /** Optional content between the window dots and the copy controls (e.g. tabs). */
  header?: ReactNode;
  /** Small label shown before the copy button, e.g. the language or "Markdown". */
  label: string;
  /** Value copied by the built-in copy button. */
  copyValue: string;
  /** Accessible label for the copy button. */
  copyLabel: string;
  /** Disables the copy button (used while a form is submitting). */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Shared macOS-style window frame for the code and markdown editors: window
 * dots, an optional header slot, a label and a copy button with check feedback.
 */
export function EditorFrame({
  "aria-label": ariaLabel,
  header,
  label,
  copyValue,
  copyLabel,
  disabled = false,
  className,
  children,
}: EditorFrameProps) {
  const { copied, copy } = useCopyFeedback();

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#151515]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-[#1c1c1c] px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>

        {header}

        <div className="ml-auto flex items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">
            {label}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            aria-label={copyLabel}
            disabled={disabled}
            onClick={() => copy(copyValue)}
          >
            {copied ? (
              <Check aria-hidden className="text-green-400" />
            ) : (
              <Copy aria-hidden />
            )}
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
}
