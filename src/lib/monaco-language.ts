/**
 * Maps the free-text `language` stored on an item to a language id Monaco
 * understands. Known aliases (`bash`, `ts`, `yml`, …) are normalised to their
 * canonical id; unknown values pass through unchanged so Monaco still receives
 * the user's intent (and simply falls back to plain text when unsupported).
 */
const MONACO_LANGUAGE_ALIASES: Record<string, string> = {
  bash: "shell",
  sh: "shell",
  zsh: "shell",
  console: "shell",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  node: "javascript",
  py: "python",
  rb: "ruby",
  yml: "yaml",
  md: "markdown",
  docker: "dockerfile",
  ps1: "powershell",
  cs: "csharp",
  "c++": "cpp",
  golang: "go",
  rs: "rust",
  text: "plaintext",
  txt: "plaintext",
};

/** Resolve a stored language value to a Monaco language id. */
export function toMonacoLanguage(language?: string | null): string {
  const value = (language ?? "").trim().toLowerCase();

  if (value === "") return "plaintext";

  return MONACO_LANGUAGE_ALIASES[value] ?? value;
}
