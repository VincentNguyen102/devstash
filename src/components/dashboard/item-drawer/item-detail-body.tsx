import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Tag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { formatLongDate } from "@/lib/date";
import type { ItemDetail } from "@/lib/db/items";
import {
  CODE_TYPE_IDS,
  IMAGE_TYPE_IDS,
  MARKDOWN_TYPE_IDS,
} from "@/lib/item-type-fields";
import { formatFileSize } from "@/lib/upload";

/** Read-only Description / Content / URL / Tags for the drawer. */
export function ItemDetailBody({ item }: { item: ItemDetail }) {
  const usesCodeEditor = CODE_TYPE_IDS.has(item.typeId);
  const usesMarkdownEditor = MARKDOWN_TYPE_IDS.has(item.typeId);

  return (
    <>
      {item.description ? (
        <DetailSection title="Description">
          <p className="text-sm text-muted-foreground">{item.description}</p>
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
            <MarkdownEditor aria-label="Content" value={item.content} readOnly />
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
        <DetailSection title="Tags" icon={<Tag aria-hidden className="size-3.5" />}>
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
  );
}

/** Preview / File / Collections / Details sections, shown in view and edit. */
export function ItemMetaSections({ item }: { item: ItemDetail }) {
  return (
    <>
      {IMAGE_TYPE_IDS.has(item.typeId) && item.fileName ? (
        <DetailSection
          title="Preview"
          icon={<ImageIcon aria-hidden className="size-3.5" />}
        >
          {/*
            Proxied through the app so the private object key stays server-side.
            `unoptimized` is required here: the image optimizer does not forward
            the session cookie, and the proxy route is owner-scoped.
          */}
          <div className="relative h-80 w-full overflow-hidden rounded-lg border border-border bg-muted/40">
            <Image
              src={`/api/items/${item.id}/file`}
              alt={item.title}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
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
            <dd>{formatLongDate(item.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Updated</dt>
            <dd>{formatLongDate(item.updatedAt)}</dd>
          </div>
        </dl>
      </DetailSection>
    </>
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
