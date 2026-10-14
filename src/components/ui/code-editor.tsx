"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { BeforeMount, EditorProps, OnMount } from "@monaco-editor/react";

import { EditorFrame } from "@/components/ui/editor-frame";
import { useEditorPreferences } from "@/hooks/use-editor-preferences";
import { EDITOR_MIN_HEIGHT, clampEditorHeight } from "@/lib/editor";
import { toMonacoLanguage } from "@/lib/monaco-language";
import {
  MONACO_THEME_BY_EDITOR_THEME,
  registerEditorThemes,
} from "@/lib/monaco-theme";

/** Monaco is browser-only, so keep it out of the server render and initial bundle. */
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

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
  const { preferences } = useEditorPreferences();

  const isReadOnly = readOnly || disabled;
  const monacoLanguage = toMonacoLanguage(language);
  const languageLabel = language?.trim() || "Plain text";
  const themeName = MONACO_THEME_BY_EDITOR_THEME[preferences.theme];

  useEffect(() => {
    suppressMonacoCancellationNoise();

    return () => contentSizeListener.current?.dispose();
  }, []);

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    registerEditorThemes(monaco);
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
      minimap: { enabled: preferences.minimap },
      fontSize: preferences.fontSize,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      lineNumbersMinChars: 3,
      lineDecorationsWidth: 8,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 2,
      wordWrap: preferences.wordWrap ? "on" : "off",
      tabSize: preferences.tabSize,
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
        horizontal: preferences.wordWrap ? "hidden" : "auto",
        verticalScrollbarSize: 8,
        useShadows: false,
      },
    }),
    [isReadOnly, preferences]
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
          theme={themeName}
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
