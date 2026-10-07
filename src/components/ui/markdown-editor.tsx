"use client";

import { useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { EditorFrame } from "@/components/ui/editor-frame";
import {
  EDITOR_MAX_HEIGHT,
  EDITOR_MIN_HEIGHT,
  clampEditorHeight,
} from "@/lib/editor";
import { cn } from "@/lib/utils";

type EditorMode = "write" | "preview";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Read-only views can only preview; ignore any stale tab state.
  const activeMode: EditorMode = readOnly ? "preview" : mode;

  // Grow the textarea with its content, clamped between MIN and MAX height.
  useLayoutEffect(() => {
    if (activeMode !== "write" || readOnly) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${clampEditorHeight(textarea.scrollHeight)}px`;
  }, [value, activeMode, readOnly]);

  return (
    <EditorFrame
      aria-label={ariaLabel}
      className={className}
      label="Markdown"
      copyValue={value}
      copyLabel="Copy markdown"
      disabled={disabled}
      header={
        !readOnly ? (
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
        ) : null
      }
    >
      {activeMode === "write" ? (
        <textarea
          ref={textareaRef}
          aria-label="Markdown content"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="Write some Markdown…"
          disabled={disabled}
          spellCheck={false}
          style={{ height: EDITOR_MIN_HEIGHT }}
          className="block w-full resize-none overflow-y-auto bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed text-[#c9d1d9] outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
        />
      ) : (
        <div
          className="overflow-y-auto px-3 py-2.5"
          style={{ maxHeight: EDITOR_MAX_HEIGHT, minHeight: EDITOR_MIN_HEIGHT }}
        >
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
    </EditorFrame>
  );
}
