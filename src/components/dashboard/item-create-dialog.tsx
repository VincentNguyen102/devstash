"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import {
  FileUpload,
  type UploadedFile,
} from "@/components/dashboard/file-upload";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Textarea } from "@/components/ui/textarea";
import {
  CODE_TYPE_IDS,
  CONTENT_TYPE_IDS,
  LANGUAGE_TYPE_IDS,
  MARKDOWN_TYPE_IDS,
  uploadKindForTypeId,
} from "@/lib/item-type-fields";
import { CREATE_TYPE_LABELS, getTypeVisual } from "@/lib/item-type-meta";
import { parseTags } from "@/lib/tags";
import {
  CREATE_ITEM_TYPE_IDS,
  type CreateItemTypeId,
} from "@/lib/validations/item";
import { cn } from "@/lib/utils";

/** Selector options, in canonical order. `url` is presented as "Link". */
const CREATE_TYPES = CREATE_ITEM_TYPE_IDS.map((id) => ({
  id,
  label: CREATE_TYPE_LABELS[id],
}));

interface CreateFormState {
  typeId: CreateItemTypeId;
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string;
  /** Set once a `file`/`image` upload completes. */
  uploadedFile: UploadedFile | null;
}

/** A blank create form for the given item type. */
function createInitialForm(typeId: CreateItemTypeId): CreateFormState {
  return {
    typeId,
    title: "",
    description: "",
    content: "",
    language: "",
    url: "",
    tags: "",
    uploadedFile: null,
  };
}

interface ItemCreateDialogProps {
  /** Type selected when the dialog opens. Defaults to the first creatable type. */
  defaultTypeId?: CreateItemTypeId;
  /** Custom trigger element; defaults to the top-bar "New Item" button. */
  trigger?: ReactNode;
}

/**
 * "New Item" button and modal. Type-specific fields are shown as the type
 * changes, the payload is validated by the `createItem` server action, and a
 * successful create closes the dialog and refreshes the current view.
 *
 * Pass `defaultTypeId` to preselect a type (e.g. from an item type page) and
 * `trigger` to replace the default "New Item" button.
 */
export function ItemCreateDialog({
  defaultTypeId = CREATE_ITEM_TYPE_IDS[0],
  trigger,
}: ItemCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialForm = useMemo(
    () => createInitialForm(defaultTypeId),
    [defaultTypeId],
  );
  const [form, setForm] = useState<CreateFormState>(initialForm);

  const uploadKind = uploadKindForTypeId(form.typeId);
  const showContent = CONTENT_TYPE_IDS.has(form.typeId);
  const showLanguage = LANGUAGE_TYPE_IDS.has(form.typeId);
  const showCodeEditor = CODE_TYPE_IDS.has(form.typeId);
  const showMarkdownEditor = MARKDOWN_TYPE_IDS.has(form.typeId);
  const showUrl = form.typeId === "url";
  const canSubmit =
    form.title.trim().length > 0 &&
    (form.typeId !== "url" || form.url.trim().length > 0) &&
    (uploadKind === null || form.uploadedFile !== null);

  function updateField<K extends keyof CreateFormState>(
    field: K,
    value: CreateFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  /** Switching types drops any upload so a stale object can't be submitted. */
  function handleTypeChange(typeId: CreateItemTypeId) {
    setForm((current) => ({ ...current, typeId, uploadedFile: null }));
  }

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return;

    setOpen(next);

    if (!next) setForm(initialForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await createItem({
        typeId: form.typeId,
        title: form.title,
        description: form.description,
        content: showContent ? form.content : "",
        language: showLanguage ? form.language : "",
        url: showUrl ? form.url : "",
        tags: parseTags(form.tags),
        fileKey: form.uploadedFile?.key ?? null,
        fileName: form.uploadedFile?.fileName ?? null,
        fileSize: form.uploadedFile?.fileSize ?? null,
      });

      if (!result.success) {
        toast.error(result.error ?? "Couldn't create item.");
        return;
      }

      toast.success("Item created");
      setForm(initialForm);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg">
            <Plus aria-hidden />
            New Item
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        showCloseButton={!isSubmitting}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Add a snippet, prompt, command, note, file, image or link to your
            stash.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">Type</span>
            <div
              role="group"
              aria-label="Item type"
              className="grid grid-cols-4 gap-1.5"
            >
              {CREATE_TYPES.map(({ id, label }) => {
                const { Icon, textClass } = getTypeVisual(id);
                const isActive = form.typeId === id;

                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={isActive}
                    disabled={isSubmitting}
                    onClick={() => handleTypeChange(id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border border-border p-2 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
                      isActive && "border-foreground/30 bg-muted text-foreground"
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={cn("size-4", isActive && textClass)}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <FormField label="Title" htmlFor="create-item-title">
            <Input
              id="create-item-title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="My snippet"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Description" htmlFor="create-item-description">
            <Textarea
              id="create-item-description"
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Add a description"
              rows={3}
              disabled={isSubmitting}
            />
          </FormField>

          {uploadKind ? (
            <FormField label={uploadKind === "image" ? "Image" : "File"}>
              <FileUpload
                key={uploadKind}
                kind={uploadKind}
                value={form.uploadedFile}
                onChange={(file) => updateField("uploadedFile", file)}
                disabled={isSubmitting}
              />
            </FormField>
          ) : null}

          {showContent ? (
            showCodeEditor ? (
              <FormField label="Content">
                <CodeEditor
                  aria-label="Content"
                  value={form.content}
                  language={form.language}
                  disabled={isSubmitting}
                  onChange={(next) => updateField("content", next)}
                />
              </FormField>
            ) : showMarkdownEditor ? (
              <FormField label="Content">
                <MarkdownEditor
                  aria-label="Content"
                  value={form.content}
                  disabled={isSubmitting}
                  onChange={(next) => updateField("content", next)}
                />
              </FormField>
            ) : (
              <FormField label="Content" htmlFor="create-item-content">
                <Textarea
                  id="create-item-content"
                  value={form.content}
                  onChange={(event) =>
                    updateField("content", event.target.value)
                  }
                  placeholder="Add content"
                  rows={6}
                  disabled={isSubmitting}
                  className="font-mono text-xs leading-relaxed"
                />
              </FormField>
            )
          ) : null}

          {showLanguage ? (
            <FormField label="Language" htmlFor="create-item-language">
              <Input
                id="create-item-language"
                value={form.language}
                onChange={(event) => updateField("language", event.target.value)}
                placeholder="e.g. typescript"
                disabled={isSubmitting}
              />
            </FormField>
          ) : null}

          {showUrl ? (
            <FormField label="URL" htmlFor="create-item-url">
              <Input
                id="create-item-url"
                type="url"
                value={form.url}
                onChange={(event) => updateField("url", event.target.value)}
                placeholder="https://example.com"
                disabled={isSubmitting}
                required
              />
            </FormField>
          ) : null}

          <FormField
            label="Tags"
            htmlFor="create-item-tags"
            hint="Separate tags with commas."
          >
            <Input
              id="create-item-tags"
              value={form.tags}
              onChange={(event) => updateField("tags", event.target.value)}
              placeholder="react, hooks, typescript"
              disabled={isSubmitting}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

