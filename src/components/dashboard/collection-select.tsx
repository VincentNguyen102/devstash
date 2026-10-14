"use client";

import { FormField } from "@/components/ui/form-field";
import { useCollections } from "@/hooks/use-collections";
import { cn } from "@/lib/utils";

interface CollectionSelectProps {
  /** Currently selected collection ids. */
  value: string[];
  onChange: (collectionIds: string[]) => void;
  disabled?: boolean;
}

/**
 * Togglable collection chips shared by the New Item dialog and the drawer's
 * inline edit form. The available collections are fetched client-side from the
 * user-scoped `GET /api/collections` route.
 */
export function CollectionSelect({
  value,
  onChange,
  disabled = false,
}: CollectionSelectProps) {
  const { collections, loading, error } = useCollections();
  const selected = new Set(value);

  function toggle(id: string) {
    const next = new Set(selected);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    onChange([...next]);
  }

  return (
    <FormField
      label="Collections"
      hint="Add this item to one or more collections."
    >
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading collections…</p>
      ) : error ? (
        <p className="text-xs text-muted-foreground">
          Failed to load collections.
        </p>
      ) : collections.length === 0 ? (
        <p className="text-xs text-muted-foreground">No collections yet.</p>
      ) : (
        <div
          role="group"
          aria-label="Collections"
          className="flex flex-wrap gap-1.5"
        >
          {collections.map((collection) => {
            const isSelected = selected.has(collection.id);

            return (
              <button
                key={collection.id}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => toggle(collection.id)}
                className={cn(
                  "rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
                  isSelected && "border-foreground/30 bg-muted text-foreground",
                )}
              >
                {collection.name}
              </button>
            );
          })}
        </div>
      )}
    </FormField>
  );
}
