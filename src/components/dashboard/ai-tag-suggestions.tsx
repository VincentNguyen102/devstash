"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { generateAutoTags } from "@/actions/ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/hooks/use-billing";
import { parseTags } from "@/lib/tags";

interface AiTagSuggestionsProps {
  /** Current title from the form, used as the main tagging signal. */
  title: string;
  /** Current content (or description) from the form. */
  content: string;
  /** Current comma-separated tags input value. */
  tags: string;
  /** Called with the new comma-separated tag value after accepting a tag. */
  onTagsChange: (tags: string) => void;
  /** Disables the trigger while the surrounding form is submitting. */
  disabled?: boolean;
}

/**
 * "Suggest tags" trigger and the per-tag accept/dismiss chips. Rendered inside
 * the shared item form so both the New Item dialog and the drawer's edit mode
 * get the same control. Hidden entirely for Free users; the server action
 * enforces the Pro gate as well.
 */
export function AiTagSuggestions({
  title,
  content,
  tags,
  onTagsChange,
  disabled = false,
}: AiTagSuggestionsProps) {
  const { isPro } = useBilling();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isPro) return null;

  const canSuggest = title.trim().length > 0 && !disabled && !isLoading;

  async function handleSuggest() {
    if (!canSuggest) return;

    setIsLoading(true);

    try {
      const result = await generateAutoTags({ title, content });

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't suggest tags.");
        return;
      }

      const existing = new Set(
        parseTags(tags).map((tag) => tag.toLowerCase()),
      );
      const next = result.data.tags.filter(
        (tag) => !existing.has(tag.toLowerCase()),
      );

      if (next.length === 0) {
        toast.info("No new tags suggested. Try adding more detail.");
        return;
      }

      setSuggestions(next);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function dismissTag(tag: string) {
    setSuggestions((current) => current.filter((item) => item !== tag));
  }

  function acceptTag(tag: string) {
    const existing = parseTags(tags);
    const alreadyAdded = existing.some(
      (item) => item.toLowerCase() === tag.toLowerCase(),
    );

    if (!alreadyAdded) {
      onTagsChange([...existing, tag].join(", "));
    }

    dismissTag(tag);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSuggest}
        disabled={!canSuggest}
        className="text-muted-foreground"
      >
        {isLoading ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <Sparkles aria-hidden />
        )}
        {isLoading ? "Suggesting..." : "Suggest tags"}
      </Button>

      {suggestions.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-1.5"
          aria-live="polite"
        >
          {suggestions.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-6 gap-1 rounded-md pr-0.5"
            >
              <span>{tag}</span>
              <button
                type="button"
                aria-label={`Add tag ${tag}`}
                title="Add tag"
                onClick={() => acceptTag(tag)}
                className="rounded p-0.5 text-emerald-400 hover:bg-background/60"
              >
                <Check aria-hidden className="size-3" />
              </button>
              <button
                type="button"
                aria-label={`Dismiss tag ${tag}`}
                title="Dismiss"
                onClick={() => dismissTag(tag)}
                className="rounded p-0.5 text-muted-foreground hover:bg-background/60 hover:text-foreground"
              >
                <X aria-hidden className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
