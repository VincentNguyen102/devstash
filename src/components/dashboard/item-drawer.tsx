"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Pencil,
  Pin,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteItem, updateItem } from "@/actions/items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CodeEditor } from "@/components/ui/code-editor";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { copyToClipboard } from "@/lib/clipboard";
import type { ItemDetail } from "@/lib/db/items";
import {
  CODE_TYPE_IDS,
  CONTENT_TYPE_IDS,
  FILE_TYPE_IDS,
  IMAGE_TYPE_IDS,
  LANGUAGE_TYPE_IDS,
  MARKDOWN_TYPE_IDS,
  URL_TYPE_IDS,
} from "@/lib/item-type-fields";
import { getTypeVisual } from "@/lib/item-type-meta";
import { formatFileSize } from "@/lib/upload";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface ItemDrawerContextValue {
  openItem: (itemId: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

/** Open the item detail drawer from any item card or row. */
export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);

  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }

  return context;
}

/**
 * Owns the selected item id and renders the detail sheet. Mounted once in the
 * dashboard shell so the drawer is available on every page without a
 * navigation.
 */
export function ItemDrawerProvider({ children }: { children: ReactNode }) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ openItem: (itemId: string) => setOpenItemId(itemId) }),
    []
  );

  const handleClose = useCallback(() => setOpenItemId(null), []);

  return (
    <ItemDrawerContext.Provider value={value}>
      {children}
      <ItemDrawerSheet itemId={openItemId} onClose={handleClose} />
    </ItemDrawerContext.Provider>
  );
}

/** `ItemDetail` as it arrives over the wire, with dates serialised to strings. */
type SerializedItemDetail = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type DrawerState =
  | { status: "idle" }
  | { status: "loaded"; item: ItemDetail }
  | { status: "error"; itemId: string; error: string };

function ItemDrawerSheet({
  itemId,
  onClose,
}: {
  itemId: string | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<DrawerState>({ status: "idle" });

  useEffect(() => {
    if (itemId === null) return;

    const requestedId: string = itemId;
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/items/${requestedId}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          success: boolean;
          data?: SerializedItemDetail;
          error?: string;
        };

        if (!response.ok || !body.success || !body.data) {
          throw new Error(body.error ?? "Failed to load item.");
        }

        if (cancelled) return;

        setState({
          status: "loaded",
          item: {
            ...body.data,
            createdAt: new Date(body.data.createdAt),
            updatedAt: new Date(body.data.updatedAt),
          },
        });
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;

        setState({
          status: "error",
          itemId: requestedId,
          error:
            error instanceof Error ? error.message : "Failed to load item.",
        });
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [itemId]);

  // Show the loaded item when it matches the current request, keep the last one
  // visible while the sheet slides closed, and fall back to the skeleton while
  // a different item is loading.
  const content =
    state.status === "loaded" && (itemId === null || state.item.id === itemId) ? (
      <ItemDetailView
        key={state.item.id}
        item={state.item}
        onItemUpdated={(item) => setState({ status: "loaded", item })}
        onDeleted={onClose}
      />
    ) : state.status === "error" &&
      (itemId === null || state.itemId === itemId) ? (
      <DrawerError message={state.error} />
    ) : itemId ? (
      <DrawerSkeleton />
    ) : null;

  const title =
    state.status === "loaded" && state.item.id === itemId
      ? state.item.title
      : "Item details";

  return (
    <Sheet
      open={itemId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="w-full gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerError({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-sm font-medium">Couldn&apos;t load this item</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

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

/** Splits the comma-separated tag input into a de-duplicated array. */
function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
  ];
}

function ItemDetailView({
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

  const showsContent = CONTENT_TYPE_IDS.has(item.typeId);
  const showsLanguage = LANGUAGE_TYPE_IDS.has(item.typeId);
  const showsUrl = URL_TYPE_IDS.has(item.typeId);
  const usesCodeEditor = CODE_TYPE_IDS.has(item.typeId);
  const usesMarkdownEditor = MARKDOWN_TYPE_IDS.has(item.typeId);
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
              bgClass
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
          <ActionBar
            item={item}
            onEdit={startEditing}
            onDeleted={onDeleted}
          />
        )}
      </header>

      <div className="space-y-6 p-6">
        {isEditing ? (
          <>
            <EditField label="Description" htmlFor="item-description">
              <Textarea
                id="item-description"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Add a description"
                rows={3}
              />
            </EditField>

            {showsContent ? (
              usesCodeEditor ? (
                <EditField label="Content">
                  <CodeEditor
                    aria-label="Content"
                    value={form.content}
                    language={form.language}
                    onChange={(next) => updateField("content", next)}
                  />
                </EditField>
              ) : usesMarkdownEditor ? (
                <EditField label="Content">
                  <MarkdownEditor
                    aria-label="Content"
                    value={form.content}
                    onChange={(next) => updateField("content", next)}
                  />
                </EditField>
              ) : (
                <EditField label="Content" htmlFor="item-content">
                  <Textarea
                    id="item-content"
                    value={form.content}
                    onChange={(event) =>
                      updateField("content", event.target.value)
                    }
                    placeholder="Add content"
                    rows={8}
                    className="font-mono text-xs leading-relaxed"
                  />
                </EditField>
              )
            ) : null}

            {showsLanguage ? (
              <EditField label="Language" htmlFor="item-language">
                <Input
                  id="item-language"
                  value={form.language}
                  onChange={(event) =>
                    updateField("language", event.target.value)
                  }
                  placeholder="e.g. typescript"
                />
              </EditField>
            ) : null}

            {showsUrl ? (
              <EditField label="URL" htmlFor="item-url">
                <Input
                  id="item-url"
                  type="url"
                  value={form.url}
                  onChange={(event) => updateField("url", event.target.value)}
                  placeholder="https://example.com"
                />
              </EditField>
            ) : null}

            <EditField
              label="Tags"
              htmlFor="item-tags"
              hint="Separate tags with commas."
            >
              <Input
                id="item-tags"
                value={form.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                placeholder="react, hooks, typescript"
              />
            </EditField>
          </>
        ) : (
          <>
            {item.description ? (
              <DetailSection title="Description">
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </DetailSection>
            ) : null}

            {item.content ? (
              <DetailSection title="Content">
                {usesCodeEditor ? (
                  <CodeEditor
                    aria-label="Content"
                    value={item.content}
                    language={item.language}
                    readOnly
                  />
                ) : usesMarkdownEditor ? (
                  <MarkdownEditor
                    aria-label="Content"
                    value={item.content}
                    readOnly
                  />
                ) : (
                  <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                    <code>{item.content}</code>
                  </pre>
                )}
              </DetailSection>
            ) : null}

            {item.url ? (
              <DetailSection title="URL">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                  <span className="break-all">{item.url}</span>
                </a>
              </DetailSection>
            ) : null}

            {item.tags.length > 0 ? (
              <DetailSection
                title="Tags"
                icon={<Tag aria-hidden className="size-3.5" />}
              >
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-md">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </DetailSection>
            ) : null}
          </>
        )}

        {IMAGE_TYPE_IDS.has(item.typeId) && item.fileName ? (
          <DetailSection
            title="Preview"
            icon={<ImageIcon aria-hidden className="size-3.5" />}
          >
            {/* Proxied through the app so the private object key stays server-side. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/items/${item.id}/file`}
              alt={item.title}
              className="max-h-80 w-full rounded-lg border border-border bg-muted/40 object-contain"
            />
          </DetailSection>
        ) : null}

        {item.fileName ? (
          <DetailSection title="File">
            <p className="text-sm text-muted-foreground">
              {item.fileName}
              {typeof item.fileSize === "number"
                ? ` · ${formatFileSize(item.fileSize)}`
                : ""}
            </p>
          </DetailSection>
        ) : null}

        {item.collectionId && item.collectionName ? (
          <DetailSection
            title="Collections"
            icon={<Layers aria-hidden className="size-3.5" />}
          >
            <Badge asChild variant="secondary" className="rounded-md">
              <Link href={`/collections/${item.collectionId}`}>
                {item.collectionName}
              </Link>
            </Badge>
          </DetailSection>
        ) : null}

        <DetailSection
          title="Details"
          icon={<Calendar aria-hidden className="size-3.5" />}
        >
          <dl className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{dateFormatter.format(item.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{dateFormatter.format(item.updatedAt)}</dd>
            </div>
          </dl>
        </DetailSection>
      </div>
    </>
  );
}

function ActionBar({
  item,
  onEdit,
  onDeleted,
}: {
  item: ItemDetail;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCopy() {
    const text = item.content ?? item.url ?? "";

    if (!text) {
      toast.error("Nothing to copy");
      return;
    }

    const copied = await copyToClipboard(text);
    if (copied) {
      toast.success("Copied to clipboard");
    } else {
      toast.error("Couldn't copy to clipboard");
    }
  }

  async function handleDelete() {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const result = await deleteItem(item.id);

      if (!result.success) {
        toast.error(result.error ?? "Couldn't delete item.");
        setIsDeleting(false);
        return;
      }

      toast.success("Item deleted");
      setIsDeleteOpen(false);
      onDeleted();
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "gap-1.5 text-muted-foreground",
          item.isFavorite && "text-yellow-400 hover:text-yellow-400"
        )}
      >
        <Star
          aria-hidden
          className={cn("size-4", item.isFavorite && "fill-yellow-400")}
        />
        Favorite
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "gap-1.5 text-muted-foreground",
          item.isPinned && "text-foreground"
        )}
      >
        <Pin
          aria-hidden
          className={cn("size-4", item.isPinned && "fill-current")}
        />
        Pin
      </Button>

      {FILE_TYPE_IDS.has(item.typeId) ? (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
        >
          <a href={`/api/items/${item.id}/file?download=1`}>
            <Download aria-hidden className="size-4" />
            Download
          </a>
        </Button>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={handleCopy}
      >
        <Copy aria-hidden className="size-4" />
        Copy
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto gap-1.5 text-muted-foreground"
        onClick={onEdit}
      >
        <Pencil aria-hidden className="size-4" />
        Edit
      </Button>

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setIsDeleteOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete item"
          >
            <Trash2 aria-hidden className="size-4" />
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item</DialogTitle>
            <DialogDescription>
              This permanently deletes &ldquo;{item.title}&rdquo;. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
      ) : (
        <span className="text-sm font-medium">{label}</span>
      )}
      {children}
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="Loading item">
      <div className="flex items-center gap-3">
        <div className="size-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-8 w-full animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-28 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}


