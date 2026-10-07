"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { ItemActionBar } from "@/components/dashboard/item-drawer/item-action-bar";
import {
  ItemDetailBody,
  ItemMetaSections,
} from "@/components/dashboard/item-drawer/item-detail-body";
import { ItemFormFields } from "@/components/dashboard/item-form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ItemDetail } from "@/lib/db/items";
import { getTypeVisual } from "@/lib/item-type-meta";
import { parseTags } from "@/lib/tags";
import { cn } from "@/lib/utils";

/** Local, controlled state for the inline edit form. */
interface EditFormState {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
}

function toEditForm(item: ItemDetail): EditFormState {
  return {
    title: item.title,
    description: item.description,
    content: item.content ?? "",
    url: item.url ?? "",
    language: item.language ?? "",
    tags: item.tags.join(", "),
  };
}

/**
 * The drawer body: type header, inline edit/save handling, and the read-only
 * detail sections. Switches between `ItemFormFields` (edit) and
 * `ItemDetailBody` (view) while `ItemMetaSections` stays visible in both.
 */
export function ItemDetailView({
  item,
  onItemUpdated,
  onDeleted,
}: {
  item: ItemDetail;
  onItemUpdated: (item: ItemDetail) => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const { Icon, textClass, bgClass } = getTypeVisual(item.typeId, item.typeIcon);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<EditFormState>(() => toEditForm(item));

  const canSave = form.title.trim().length > 0;

  function updateField<K extends keyof EditFormState>(
    field: K,
    value: EditFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEditing() {
    setForm(toEditForm(item));
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  async function handleSave() {
    if (!canSave || isSaving) return;

    setIsSaving(true);

    try {
      const result = await updateItem(item.id, {
        title: form.title,
        description: form.description,
        content: form.content,
        url: form.url,
        language: form.language,
        tags: parseTags(form.tags),
      });

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Couldn't save changes.");
        return;
      }

      onItemUpdated(result.data);
      setIsEditing(false);
      toast.success("Item updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <header className="space-y-4 border-b border-border p-6 pr-14">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              bgClass,
            )}
          >
            <Icon aria-hidden className={cn("size-5", textClass)} />
          </span>

          <div className="min-w-0 flex-1 space-y-2">
            {isEditing ? (
              <Input
                aria-label="Title"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Title"
              />
            ) : (
              <h2 className="text-lg font-semibold break-words">{item.title}</h2>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="rounded-md">
                {item.typeName}
              </Badge>
              {!isEditing && item.language ? (
                <Badge variant="secondary" className="rounded-md">
                  {item.language}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelEditing}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!canSave || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <ItemActionBar
            item={item}
            onEdit={startEditing}
            onDeleted={onDeleted}
          />
        )}
      </header>

      <div className="space-y-6 p-6">
        {isEditing ? (
          <ItemFormFields
            typeId={item.typeId}
            values={form}
            onChange={(field, value) => updateField(field, value)}
            idPrefix="item"
          />
        ) : (
          <ItemDetailBody item={item} />
        )}

        <ItemMetaSections item={item} />
      </div>
    </>
  );
}
