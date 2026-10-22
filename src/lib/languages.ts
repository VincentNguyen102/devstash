import { toMonacoLanguage } from "@/lib/monaco-language";

export interface LanguageOption {
  /** Monaco language id stored on the item. */
  value: string;
  label: string;
}

/**
 * Languages offered by the item form dropdown. Every value is a Monaco
 * language id, so picking one turns on highlighting in the code editor right
 * away. Keep the list limited to ids Monaco actually ships a grammar for.
 */
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: "plaintext", label: "Plain text" },
  { value: "c", label: "C" },
  { value: "clojure", label: "Clojure" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS" },
  { value: "dart", label: "Dart" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "elixir", label: "Elixir" },
  { value: "fsharp", label: "F#" },
  { value: "go", label: "Go" },
  { value: "graphql", label: "GraphQL" },
  { value: "hcl", label: "HCL / Terraform" },
  { value: "html", label: "HTML" },
  { value: "ini", label: "INI" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "julia", label: "Julia" },
  { value: "kotlin", label: "Kotlin" },
  { value: "less", label: "Less" },
  { value: "lua", label: "Lua" },
  { value: "markdown", label: "Markdown" },
  { value: "objective-c", label: "Objective-C" },
  { value: "perl", label: "Perl" },
  { value: "php", label: "PHP" },
  { value: "powershell", label: "PowerShell" },
  { value: "protobuf", label: "Protobuf" },
  { value: "python", label: "Python" },
  { value: "r", label: "R" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "scala", label: "Scala" },
  { value: "scss", label: "SCSS" },
  { value: "shell", label: "Shell" },
  { value: "solidity", label: "Solidity" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
];

const LANGUAGE_VALUES = new Set(LANGUAGE_OPTIONS.map((option) => option.value));

/**
 * Normalise a stored language value to a dropdown option value. Returns
 * `undefined` when no language is stored so the select shows its placeholder,
 * and maps legacy aliases (`tsx`, `bash`, …) to their Monaco id.
 */
export function toLanguageValue(language?: string | null): string | undefined {
  const trimmed = language?.trim();

  return trimmed ? toMonacoLanguage(trimmed) : undefined;
}

/** Human-readable label for a stored language value. */
export function getLanguageLabel(language?: string | null): string {
  const value = toLanguageValue(language);

  if (!value) return "Plain text";

  return (
    LANGUAGE_OPTIONS.find((option) => option.value === value)?.label ??
    language?.trim() ??
    value
  );
}

/**
 * Options for the language select. A legacy/custom stored value that is not in
 * the curated list is appended so editing never hides or drops it.
 */
export function languageOptionsFor(
  language?: string | null,
): LanguageOption[] {
  const value = toLanguageValue(language);

  if (!value || LANGUAGE_VALUES.has(value)) return [...LANGUAGE_OPTIONS];

  return [...LANGUAGE_OPTIONS, { value, label: language?.trim() || value }];
}
