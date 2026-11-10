"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { generateDescription } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/hooks/use-billing";

interface AiDescriptionButtonProps {
  /** Current title from the form, used as the main context signal. */
  title: string;
  /** Selected item type id. */
  typeId: string;
  /** Current language from the form (empty for types without one). */
  language: string;
  /** Current content from the form (empty for link and upload items). */
  content: string;
  /** Current URL from the form (link items only). */
  url: string;
  /** Name of the uploaded file (file/image items only). */
  fileName?: string;
  /** Current comma-separated tags from the form. */
  tags: string;
  /** Called with the generated description, replacing the current value. */
  onDescriptionChange: (description: string) => void;
  /** Disables the trigger while the surrounding form is submitting. */
  disabled?: boolean;
}

/**
 * Sparkles icon button that writes a concise description from the current
 * unsaved form values. Rendered beside the Description label in the shared
 * item form so both the New Item dialog and the drawer's edit mode use it.
 * Hidden for Free users; the server action enforces the Pro gate as well.
 */
export function AiDescriptionButton({
  title,
  typeId,
  language,
  content,
  url,
  fileName,
  tags,
  onDescriptionChange,
  disabled = false,
}: AiDescriptionButtonProps) {
  const { isPro } = useBilling();
  const [isLoading, setIsLoading] = useState(false);

  if (!isPro) return null;

  const canGenerate = title.trim().length > 0 && !disabled && !isLoading;

  async function handleGenerate() {
    if (!canGenerate) return;

    setIsLoading(true);

    try {
      const result = await generateDescription({
        title,
        typeId,
        language,
        content,
        url,
        fileName: fileName ?? "",
        tags,
      });

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't generate a description.");
        return;
      }

      onDescriptionChange(result.data.description);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={handleGenerate}
      disabled={!canGenerate}
      aria-label={
        isLoading ? "Generating description" : "Generate description with AI"
      }
      title={
        isLoading
          ? "Generating..."
          : canGenerate
            ? "Generate description with AI"
            : "Add a title first"
      }
      className="gap-1 text-muted-foreground"
    >
      {isLoading ? (
        <Loader2 aria-hidden className="animate-spin" />
      ) : (
        <Sparkles aria-hidden />
      )}
      {isLoading ? "Generating…" : "Generate"}
    </Button>
  );
}
