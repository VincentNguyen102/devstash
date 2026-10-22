"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Plus } from "lucide-react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { CollectionSelect } from "@/components/dashboard/collection-select";
import { FileUpload } from "@/components/dashboard/file-upload";
import { ItemFormFields } from "@/components/dashboard/item-form-fields";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/hooks/use-billing";
import { FREE_ITEM_LIMIT, isProOnlyTypeId } from "@/lib/usage-limits";
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
import {
  CONTENT_TYPE_IDS,
  LANGUAGE_TYPE_IDS,
  uploadKindForTypeId,
} from "@/lib/item-type-fields";
import { CREATE_TYPE_LABELS, getTypeVisual } from "@/lib/item-type-meta";
import { parseTags } from "@/lib/tags";
import type { UploadedFile } from "@/lib/upload-client";
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
  collectionIds: string[];
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
    collectionIds: [],
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
  const { isPro, itemCount } = useBilling();

  const uploadKind = uploadKindForTypeId(form.typeId);
  // Only send fields the selected type actually exposes, so switching types
  // can't leak a stale value into the payload.
  const showContent = CONTENT_TYPE_IDS.has(form.typeId);
  const showLanguage = LANGUAGE_TYPE_IDS.has(form.typeId);
  const showUrl = form.typeId === "url";
  const atItemLimit = !isPro && itemCount >= FREE_ITEM_LIMIT;
  const canSubmit =
    form.title.trim().length > 0 &&
    (form.typeId !== "url" || form.url.trim().length > 0) &&
    (uploadKind === null || form.uploadedFile !== null) &&
    !atItemLimit &&
    (isPro || !isProOnlyTypeId(form.typeId));

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
        collectionIds: form.collectionIds,
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
          {!isPro ? (
            <p className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3 text-sm">
              {atItemLimit
                ? `You've reached the Free plan limit of ${FREE_ITEM_LIMIT} items.`
                : "File and image items require Pro."}{" "}
              <Link
                href="/settings#billing"
                className="font-medium underline underline-offset-2"
              >
                Upgrade to Pro
              </Link>
            </p>
          ) : null}

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
                const isLocked = !isPro && isProOnlyTypeId(id);

                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={isActive}
                    aria-disabled={isLocked}
                    disabled={isSubmitting || isLocked}
                    title={isLocked ? "Available on Pro" : undefined}
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
                    <span className="flex items-center gap-1">
                      {label}
                      {isLocked ? <Lock aria-hidden className="size-3" /> : null}
                    </span>
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

          <ItemFormFields
            typeId={form.typeId}
            values={form}
            onChange={(field, value) => updateField(field, value)}
            idPrefix="create-item"
            disabled={isSubmitting}
            afterDescription={
              uploadKind ? (
                <FormField label={uploadKind === "image" ? "Image" : "File"}>
                  <FileUpload
                    key={uploadKind}
                    kind={uploadKind}
                    value={form.uploadedFile}
                    onChange={(file) => updateField("uploadedFile", file)}
                    disabled={isSubmitting}
                  />
                </FormField>
              ) : null
            }
          />

          <CollectionSelect
            value={form.collectionIds}
            onChange={(ids) => updateField("collectionIds", ids)}
            disabled={isSubmitting}
          />

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

