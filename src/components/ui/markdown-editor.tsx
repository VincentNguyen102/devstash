"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

/** Minimum editor height in pixels. */
const MIN_HEIGHT = 96;

/** Maximum editor height in pixels; longer content scrolls internally. */
const MAX_HEIGHT = 400;

type EditorMode = "write" | "preview";

function clampHeight(height: number): number {
  if (!Number.isFinite(height)) return MIN_HEIGHT;
  return Math.min(Math.max(Math.round(height), MIN_HEIGHT), MAX_HEIGHT);
}

interface MarkdownEditorProps {
  /** Current markdown source. */
  value: string;
  /** Called with the new source whenever the user edits. */
  onChange?: (value: string) => void;
  /** Render in read-only display mode (Preview tab only). Defaults to `false`. */
  readOnly?: boolean;
  /** Disables interaction (used while a form is submitting). */
  disabled?: boolean;
  /** Accessible label for the editor region. */
  "aria-label"?: string;
  className?: string;
}

/**
 * A Markdown editor with a Write/Preview tab bar, a macOS-style window frame
 * and a copy button. In edit mode the Write tab is shown by default; in
 * read-only mode only the rendered Preview is available. The height grows with
 * the content up to a maximum, after which the body scrolls.
 */
export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  "aria-label": ariaLabel = "Markdown editor",
  className,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>("write");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Read-only views can only preview; ignore any stale tab state.
  const activeMode: EditorMode = readOnly ? "preview" : mode;

  // Grow the textarea with its content, clamped between MIN and MAX height.
  useLayoutEffect(() => {
    if (activeMode !== "write" || readOnly) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${clampHeight(textarea.scrollHeight)}px`;
  }, [value, activeMode, readOnly]);

  const handleCopy = useCallback(async () => {
    const copiedToClipboard = await copyToClipboard(value);

    if (!copiedToClipboard) {
      toast.error("Couldn't copy to clipboard");
      return;
    }

    setCopied(true);
    toast.success("Copied to clipboard");
    window.setTimeout(() => setCopied(false), 1500);
  }, [value]);

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

        {!readOnly ? (
          <div
            role="tablist"
            aria-label="Markdown editor mode"
            className="ml-2 flex items-center gap-0.5"
          >
            {(["write", "preview"] as const).map((tab) => (
              <Button
                key={tab}
                type="button"
                role="tab"
                variant="ghost"
                size="xs"
                aria-selected={activeMode === tab}
                onClick={() => setMode(tab)}
                className={cn(
                  "capitalize text-muted-foreground",
                  activeMode === tab && "bg-muted text-foreground",
                )}
              >
                {tab}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">
            Markdown
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Copy markdown"
            disabled={disabled}
            onClick={handleCopy}
          >
            {copied ? (
              <Check aria-hidden className="text-green-400" />
            ) : (
              <Copy aria-hidden />
            )}
          </Button>
        </div>
      </div>

      {activeMode === "write" ? (
        <textarea
          ref={textareaRef}
          aria-label="Markdown content"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="Write some Markdown…"
          disabled={disabled}
          spellCheck={false}
          style={{ height: MIN_HEIGHT }}
          className="block w-full resize-none overflow-y-auto bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed text-[#c9d1d9] outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
        />
      ) : (
        <div className="max-h-[400px] min-h-24 overflow-y-auto px-3 py-2.5">
          {value.trim() ? (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/60">
              Nothing to preview yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
