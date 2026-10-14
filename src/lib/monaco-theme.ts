import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

import type { EditorThemeId } from "@/lib/editor-preferences";

/**
 * Monaco theme registrations and the mapping from a stored editor-theme id to
 * the registered Monaco theme name.
 *
 * `vs-dark` maps to `devstash-dark` — the app's custom dark theme (based on
 * `vs-dark`) that matches the editor frame chrome — so the default preference
 * keeps the editor looking exactly as it did before preferences existed.
 * `monokai` and `github-dark` are not shipped by Monaco and are defined here.
 */
export const MONACO_THEME_BY_EDITOR_THEME: Record<EditorThemeId, string> = {
  "vs-dark": "devstash-dark",
  monokai: "devstash-monokai",
  "github-dark": "devstash-github-dark",
};

const devstashDark: editor.IStandaloneThemeData = {
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
};

const monokai: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "75715e", fontStyle: "italic" },
    { token: "keyword", foreground: "f92672" },
    { token: "string", foreground: "e6db74" },
    { token: "number", foreground: "ae81ff" },
    { token: "regexp", foreground: "e6db74" },
    { token: "type", foreground: "66d9ef" },
    { token: "type.identifier", foreground: "a6e22e" },
    { token: "identifier", foreground: "f8f8f2" },
    { token: "function", foreground: "a6e22e" },
    { token: "constant", foreground: "ae81ff" },
    { token: "variable", foreground: "f8f8f2" },
    { token: "tag", foreground: "f92672" },
    { token: "attribute.name", foreground: "a6e22e" },
    { token: "delimiter", foreground: "f8f8f2" },
    { token: "operator", foreground: "f92672" },
  ],
  colors: {
    "editor.background": "#272822",
    "editor.foreground": "#f8f8f2",
    "editorLineNumber.foreground": "#75715e",
    "editorLineNumber.activeForeground": "#c2c2bf",
    "editor.lineHighlightBackground": "#ffffff0a",
    "editor.selectionBackground": "#49483e",
    "editor.inactiveSelectionBackground": "#49483e80",
    "editorCursor.foreground": "#f8f8f0",
    "editorIndentGuide.background1": "#ffffff12",
    "editorIndentGuide.activeBackground1": "#ffffff26",
    "editorWhitespace.foreground": "#ffffff1a",
    "scrollbarSlider.background": "#ffffff1a",
    "scrollbarSlider.hoverBackground": "#ffffff2e",
    "scrollbarSlider.activeBackground": "#ffffff42",
    "editorWidget.background": "#1e1f1c",
    "editorWidget.border": "#ffffff1a",
    "editorSuggestWidget.background": "#1e1f1c",
    "editorSuggestWidget.border": "#ffffff1a",
    "editorSuggestWidget.selectedBackground": "#49483e",
  },
};

const githubDark: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "8b949e", fontStyle: "italic" },
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
    "editor.background": "#0d1117",
    "editor.foreground": "#c9d1d9",
    "editorLineNumber.foreground": "#484f58",
    "editorLineNumber.activeForeground": "#8b949e",
    "editor.lineHighlightBackground": "#161b22",
    "editor.selectionBackground": "#264f78",
    "editor.inactiveSelectionBackground": "#264f7880",
    "editorCursor.foreground": "#58a6ff",
    "editorIndentGuide.background1": "#21262d",
    "editorIndentGuide.activeBackground1": "#484f58",
    "editorWhitespace.foreground": "#ffffff1a",
    "scrollbarSlider.background": "#484f5880",
    "scrollbarSlider.hoverBackground": "#8b949e80",
    "scrollbarSlider.activeBackground": "#8b949e",
    "editorWidget.background": "#161b22",
    "editorWidget.border": "#30363d",
    "editorSuggestWidget.background": "#161b22",
    "editorSuggestWidget.border": "#30363d",
    "editorSuggestWidget.selectedBackground": "#21262d",
  },
};

const THEME_DEFINITIONS: Record<string, editor.IStandaloneThemeData> = {
  "devstash-dark": devstashDark,
  "devstash-monokai": monokai,
  "devstash-github-dark": githubDark,
};

/** Registers every editor theme on the Monaco instance before the first mount. */
export function registerEditorThemes(monaco: Monaco): void {
  for (const [name, definition] of Object.entries(THEME_DEFINITIONS)) {
    monaco.editor.defineTheme(name, definition);
  }
}
