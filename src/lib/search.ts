/** Longest preview length before the text is truncated with an ellipsis. */
export const PREVIEW_MAX_LENGTH = 80;

/** Lightweight item shape for the global command palette's search index. */
export interface SearchItem {
  id: string;
  title: string;
  typeId: string;
  /** Single-line preview: text content, URL, file name or description. */
  preview: string;
}

/**
 * Builds the short, single-line preview shown under an item in the command
 * palette. Uses the first non-empty source (content, URL, file name or
 * description), collapses whitespace and truncates long text with an ellipsis.
 */
export function buildItemPreview(
  ...sources: (string | null | undefined)[]
): string {
  const raw = sources.find((source) => source && source.trim().length > 0) ?? "";
  const singleLine = raw.replace(/\s+/g, " ").trim();

  return singleLine.length > PREVIEW_MAX_LENGTH
    ? `${singleLine.slice(0, PREVIEW_MAX_LENGTH - 1)}…`
    : singleLine;
}

/** The text a search candidate is matched against, split by signal strength. */
export interface MatchTarget {
  /**
   * High-signal text (item titles, collection names, type labels). Matched by
   * substring and, as a last resort, by word-prefix fuzzy matching.
   */
  primary: string;
  /**
   * Low-signal text (descriptions, content previews). Only ever matched by
   * substring — running fuzzy matching over long bodies of text is what makes
   * a query like "test" match almost everything.
   */
  secondary?: string;
}

const WORD_BOUNDARY = /[\s\W_]/;

/** Score for a token found at the start of a word. */
const SCORE_PRIMARY_WORD_START = 4;
/** Score for a token found mid-word in the primary text. */
const SCORE_PRIMARY_SUBSTRING = 3;
/** Score for a token found at the start of a word in the secondary text. */
const SCORE_SECONDARY_WORD_START = 2;
/** Score for a token found mid-word in the secondary text. */
const SCORE_SECONDARY_SUBSTRING = 1;
/** Score for a fuzzy (prefix-style, e.g. "dcr" → "docker") primary match. */
const SCORE_FUZZY = 1;

/** True when `index` sits at the start of `text` or of a word within it. */
function isWordStart(text: string, index: number): boolean {
  return index === 0 || WORD_BOUNDARY.test(text.charAt(index - 1));
}

/** True when every character of `needle` appears in `haystack`, in order. */
function isSubsequence(haystack: string, needle: string): boolean {
  let cursor = 0;

  for (const char of needle) {
    cursor = haystack.indexOf(char, cursor) + 1;
    if (cursor === 0) return false;
  }

  return true;
}

const WORDS = /[\s\W_]+/;

/**
 * True when `token` fuzzy-matches a single word from its first letter, e.g.
 * "dcr" → "docker". Requiring the match to start a word (and stay inside it)
 * keeps fuzzy matching from lighting up on scattered letters in a long title.
 */
function isWordPrefixFuzzy(text: string, token: string): boolean {
  const first = token.charAt(0);

  return text
    .split(WORDS)
    .some(
      (word) => word.charAt(0) === first && isSubsequence(word, token),
    );
}

/** Score a single token against a candidate's primary and secondary text. */
function scoreToken(
  primary: string,
  secondary: string,
  token: string,
): number {
  const inPrimary = primary.indexOf(token);

  if (inPrimary !== -1) {
    return isWordStart(primary, inPrimary)
      ? SCORE_PRIMARY_WORD_START
      : SCORE_PRIMARY_SUBSTRING;
  }

  const inSecondary = secondary.indexOf(token);

  if (inSecondary !== -1) {
    return isWordStart(secondary, inSecondary)
      ? SCORE_SECONDARY_WORD_START
      : SCORE_SECONDARY_SUBSTRING;
  }

  return isWordPrefixFuzzy(primary, token) ? SCORE_FUZZY : 0;
}

/**
 * Scores a search query against a candidate. The query is split into
 * whitespace-separated tokens and every token must match, so extra words narrow
 * the results. Returns 0 when the candidate should be hidden; higher scores rank
 * first.
 */
export function scoreSearchMatch(query: string, target: MatchTarget): number {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return 1;
  }

  const primary = target.primary.toLowerCase();
  const secondary = (target.secondary ?? "").toLowerCase();
  let score = 0;

  for (const token of normalized.split(/\s+/)) {
    const tokenScore = scoreToken(primary, secondary, token);

    if (tokenScore === 0) {
      return 0;
    }

    score += tokenScore;
  }

  return score;
}

/**
 * cmdk filter for the command palette. Each `CommandItem` registers its id as
 * `value` (unused here, but kept unique so selection stays correct) and its
 * searchable text as `keywords` in a fixed order: primary, then secondary.
 * Items only match on their primary text by default; the long content preview
 * is matched by substring so it cannot swallow short queries.
 */
export function paletteFilter(
  value: string,
  search: string,
  keywords: string[] = [],
): number {
  void value;
  const [primary = "", secondary = ""] = keywords;

  return scoreSearchMatch(search, { primary, secondary });
}

