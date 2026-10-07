"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { BeforeMount, EditorProps, OnMount } from "@monaco-editor/react";

import { EditorFrame } from "@/components/ui/editor-frame";
import { EDITOR_MIN_HEIGHT, clampEditorHeight } from "@/lib/editor";
import { toMonacoLanguage } from "@/lib/monaco-language";

/** Monaco is browser-only, so keep it out of the server render and initial bundle. */
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

/** Monaco theme name registered before the first editor mounts. */
const THEME_NAME = "devstash-dark";

let cancellationHandlerRegistered = false;

/**
 * Monaco rejects an internal promise with `Canceled` while an editor is
 * disposed, which surfaces as an unhandled rejection in the console. The error
 * is harmless (microsoft/monaco-editor#4702), so swallow the ones originating
 * from Monaco and leave every other rejection untouched.
 */
function suppressMonacoCancellationNoise(): void {
  if (typeof window === "undefined" || cancellationHandlerRegistered) return;

  cancellationHandlerRegistered = true;
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { stack?: string } | undefined;

    if (
      typeof reason?.stack === "string" &&
      reason.stack.includes("monaco-editor")
    ) {
      event.preventDefault();
    }
  });
}

interface CodeEditorProps {
  /** Current source value. */
  value: string;
  /** Called with the new source whenever the user edits the code. */
  onChange?: (value: string) => void;
  /** Language id or alias shown in the header and used for highlighting. */
  language?: string | null;
  /** Render the editor in read-only display mode. Defaults to `false`. */
  readOnly?: boolean;
  /** Disables interaction (used while a form is submitting). */
  disabled?: boolean;
  /** Accessible label for the editor region. */
  "aria-label"?: string;
  className?: string;
}

/**
 * A Monaco-backed code editor with a macOS-style window frame, a language
 * label and a copy button. Supports editable and read-only modes; the height
 * grows with the content up to a maximum, after which the editor scrolls.
 */
export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  disabled = false,
  "aria-label": ariaLabel = "Code editor",
  className,
}: CodeEditorProps) {
  const [height, setHeight] = useState(EDITOR_MIN_HEIGHT);
  const contentSizeListener = useRef<{ dispose: () => void } | null>(null);

  const isReadOnly = readOnly || disabled;
  const monacoLanguage = toMonacoLanguage(language);
  const languageLabel = language?.trim() || "Plain text";

  useEffect(() => {
    suppressMonacoCancellationNoise();

    return () => contentSizeListener.current?.dispose();
  }, []);

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    monaco.editor.defineTheme(THEME_NAME, {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "7d8590", fontStyle: "italic" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "string", foreground: "a5d6ff" },
        { token: "number", foreground: "79c0ff" },
        { token: "regexp", foreground: "a5d6ff" },
        { token: "type", foreground: "ffa657" },
        { token: "type.identifier", foreground: "ffa657" },
        { token: "identifier", foreground: "d2a8ff" },
        { token: "function", foreground: "d2a8ff" },
        { token: "constant", foreground: "79c0ff" },
        { token: "variable", foreground: "ffa657" },
        { token: "tag", foreground: "7ee787" },
        { token: "attribute.name", foreground: "79c0ff" },
        { token: "delimiter", foreground: "c9d1d9" },
        { token: "operator", foreground: "ff7b72" },
      ],
      colors: {
        "editor.background": "#151515",
        "editor.foreground": "#c9d1d9",
        "editorLineNumber.foreground": "#4b5563",
        "editorLineNumber.activeForeground": "#9ca3af",
        "editor.lineHighlightBackground": "#ffffff0a",
        "editor.selectionBackground": "#3b82f655",
        "editor.inactiveSelectionBackground": "#3b82f633",
        "editorCursor.foreground": "#e5e7eb",
        "editorIndentGuide.background1": "#ffffff12",
        "editorIndentGuide.activeBackground1": "#ffffff26",
        "editorWhitespace.foreground": "#ffffff1a",
        "scrollbarSlider.background": "#ffffff1a",
        "scrollbarSlider.hoverBackground": "#ffffff2e",
        "scrollbarSlider.activeBackground": "#ffffff42",
        "editorWidget.background": "#1c1c1c",
        "editorWidget.border": "#ffffff1a",
        "editorSuggestWidget.background": "#1c1c1c",
        "editorSuggestWidget.border": "#ffffff1a",
        "editorSuggestWidget.selectedBackground": "#ffffff14",
      },
    });
  }, []);

  const handleMount = useCallback<OnMount>((editor) => {
    const updateHeight = () =>
      setHeight(clampEditorHeight(editor.getContentHeight()));

    updateHeight();
    contentSizeListener.current?.dispose();
    contentSizeListener.current = editor.onDidContentSizeChange(updateHeight);
  }, []);

  const options = useMemo<EditorProps["options"]>(
    () => ({
      readOnly: isReadOnly,
      domReadOnly: isReadOnly,
      minimap: { enabled: false },
      fontSize: 12,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      lineNumbersMinChars: 3,
      lineDecorationsWidth: 8,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 2,
      wordWrap: "on",
      tabSize: 2,
      insertSpaces: true,
      automaticLayout: true,
      padding: { top: 12, bottom: 12 },
      renderLineHighlight: isReadOnly ? "none" : "line",
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      glyphMargin: false,
      folding: false,
      contextmenu: false,
      fixedOverflowWidgets: true,
      scrollbar: {
        vertical: "auto",
        horizontal: "hidden",
        verticalScrollbarSize: 8,
        useShadows: false,
      },
    }),
    [isReadOnly]
  );

  return (
    <EditorFrame
      aria-label={ariaLabel}
      className={className}
      label={languageLabel}
      copyValue={value}
      copyLabel="Copy code"
      disabled={disabled}
    >
      <div style={{ height }}>
        <MonacoEditor
          height="100%"
          language={monacoLanguage}
          theme={THEME_NAME}
          value={value}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={(next) => onChange?.(next ?? "")}
          options={options}
          loading={<EditorSkeleton />}
        />
      </div>
    </EditorFrame>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#151515]">
      <span className="font-mono text-xs text-muted-foreground">
        Loading editor…
      </span>
    </div>
  );
}
