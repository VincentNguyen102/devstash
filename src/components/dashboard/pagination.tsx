import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getVisiblePages } from "@/lib/pagination";

interface PaginationProps {
  /** 1-based page currently shown. */
  page: number;
  /** Total number of pages; the control renders nothing when there is one or none. */
  pageCount: number;
  /** Listing path the page links point at; the page is appended as `?page=N`. */
  basePath: string;
}

interface PageLinkProps {
  href?: string;
  current?: boolean;
  disabled?: boolean;
  rel?: string;
  "aria-label": string;
  children: ReactNode;
}

/** `pageHref` keeps the first page clean (`/items/snippet`, not `?page=1`). */
function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/** One control: a link when navigable, otherwise a disabled or active button. */
function PageLink({
  href,
  current = false,
  disabled = false,
  rel,
  "aria-label": ariaLabel,
  children,
}: PageLinkProps) {
  const variant = current ? "default" : "outline";
  const ariaCurrent = current ? "page" : undefined;

  if (href && !disabled) {
    return (
      <Button asChild variant={variant} size="sm">
        <Link href={href} aria-label={ariaLabel} aria-current={ariaCurrent} rel={rel}>
          {children}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
    >
      {children}
    </Button>
  );
}

/**
 * Numbered page links with prev/next controls. Prev/next are greyed out
 * (disabled) on the first/last page. Rendered by the listing pages.
 */
export function Pagination({ page, pageCount, basePath }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const items = getVisiblePages(page, pageCount);
  const isFirst = page <= 1;
  const isLast = page >= pageCount;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-1 pt-2"
    >
      <PageLink
        href={isFirst ? undefined : pageHref(basePath, page - 1)}
        disabled={isFirst}
        rel="prev"
        aria-label="Previous page"
      >
        <ChevronLeft aria-hidden />
        <span className="hidden sm:inline">Previous</span>
      </PageLink>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden
            className="px-1 text-sm text-muted-foreground"
          >
            &hellip;
          </span>
        ) : (
          <PageLink
            key={item}
            href={item === page ? undefined : pageHref(basePath, item)}
            current={item === page}
            aria-label={`Page ${item}`}
          >
            {item}
          </PageLink>
        ),
      )}

      <PageLink
        href={isLast ? undefined : pageHref(basePath, page + 1)}
        disabled={isLast}
        rel="next"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight aria-hidden />
      </PageLink>
    </nav>
  );
}
