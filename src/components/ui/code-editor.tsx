"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { BeforeMount, EditorProps, OnMount } from "@monaco-editor/react";
import { Crown, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { explainCode } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { EditorFrame } from "@/components/ui/editor-frame";
import { useEditorPreferences } from "@/hooks/use-editor-preferences";
import {
  EDITOR_MAX_HEIGHT,
  EDITOR_MIN_HEIGHT,
  clampEditorHeight,
} from "@/lib/editor";
import { getLanguageLabel } from "@/lib/languages";
import { toMonacoLanguage } from "@/lib/monaco-language";
import {
  MONACO_THEME_BY_EDITOR_THEME,
  registerEditorThemes,
} from "@/lib/monaco-theme";
import { cn } from "@/lib/utils";

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
  /** Shows the AI explain control and Code/Explain tabs (drawer read view). */
  explainable?: boolean;
  /** Whether the viewer has the Pro plan; Free users see a locked Crown state. */
  isPro?: boolean;
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
  explainable = false,
  isPro = false,
  "aria-label": ariaLabel = "Code editor",
  className,
}: CodeEditorProps) {
  const [height, setHeight] = useState(EDITOR_MIN_HEIGHT);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [view, setView] = useState<"code" | "explain">("code");
  const [isExplaining, setIsExplaining] = useState(false);
  const contentSizeListener = useRef<{ dispose: () => void } | null>(null);
  const { preferences } = useEditorPreferences();

  const isReadOnly = readOnly || disabled;
  const monacoLanguage = toMonacoLanguage(language);
  const languageLabel = getLanguageLabel(language);
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

  async function handleExplain() {
    if (!explainable || isExplaining) return;

    if (!isPro) {
      toast.error("AI features require Pro subscription.");
      return;
    }

    if (!value.trim()) {
      toast.error("There is no code to explain.");
      return;
    }

    setIsExplaining(true);

    try {
      const result = await explainCode({
        content: value,
        language: language ?? "",
      });

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't explain the code.");
        return;
      }

      setExplanation(result.data.explanation);
      setView("explain");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsExplaining(false);
    }
  }

  return (
    <EditorFrame
      aria-label={ariaLabel}
      className={className}
      label={languageLabel}
      copyValue={value}
      copyLabel="Copy code"
      disabled={disabled}
      header={
        explainable && explanation ? (
          <div
            role="tablist"
            aria-label="Code editor view"
            className="ml-2 flex items-center gap-0.5"
          >
            {(["code", "explain"] as const).map((tab) => (
              <Button
                key={tab}
                type="button"
                role="tab"
                variant="ghost"
                size="xs"
                aria-selected={view === tab}
                onClick={() => setView(tab)}
                className={cn(
                  "text-muted-foreground",
                  view === tab && "bg-muted text-foreground",
                )}
              >
                {tab === "code" ? "Code" : "Explain"}
              </Button>
            ))}
          </div>
        ) : null
      }
      controls={
        explainable ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className={cn(
              "gap-1 text-muted-foreground hover:text-foreground",
              !isPro && "text-amber-400/80 hover:text-amber-300",
            )}
            aria-label={
              isExplaining
                ? "Explaining code"
                : isPro
                  ? "Explain code with AI"
                  : "Explain code (Pro)"
            }
            title={
              isPro
                ? "Explain code with AI"
                : "AI features require Pro subscription"
            }
            disabled={isExplaining || (isPro && !value.trim())}
            onClick={handleExplain}
          >
            {isExplaining ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : isPro ? (
              <Sparkles aria-hidden />
            ) : (
              <Crown aria-hidden />
            )}
            {isExplaining ? "Explaining…" : "Explain"}
          </Button>
        ) : null
      }
    >
      {view === "explain" && explanation ? (
        <div
          className="overflow-y-auto px-3 py-2.5"
          style={{
            minHeight: EDITOR_MIN_HEIGHT,
            maxHeight: EDITOR_MAX_HEIGHT,
          }}
        >
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {explanation}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
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
      )}
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
