"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, CodeXml, Layers, Star } from "lucide-react";
import { Collapsible } from "radix-ui";

import { UserMenu } from "@/components/dashboard/user-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CollectionSummary } from "@/lib/db/collections";
import type { ItemTypeSummary } from "@/lib/db/items";
import { getTypeVisual } from "@/lib/item-type-meta";
import type { AuthUser } from "@/types/auth";
import { cn } from "@/lib/utils";

/** System item types that require a Pro membership. */
const PRO_TYPE_IDS = new Set(["file", "image"]);

interface NavRowProps {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  count?: number;
  trailing?: ReactNode;
  onNavigate?: () => void;
}

function NavRow({
  href,
  icon,
  label,
  active = false,
  count,
  trailing,
  onNavigate,
}: NavRowProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

/**
 * Renders a collection row for the sidebar. Favorite collections show a star
 * and no count; the rest show the item count and a dot for their dominant type.
 */
function CollectionNavRow({
  collection,
  active,
  favorite = false,
  onNavigate,
}: {
  collection: CollectionSummary;
  active: boolean;
  favorite?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavRow
      href={`/collections/${collection.id}`}
      onNavigate={onNavigate}
      active={active}
      label={collection.name}
      count={favorite ? undefined : collection.itemCount}
      icon={
        favorite || !collection.dominantTypeId ? (
          <Layers className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <span
            aria-hidden
            className={cn(
              "size-2.5 shrink-0 rounded-full bg-current",
              getTypeVisual(collection.dominantTypeId).textClass,
            )}
          />
        )
      }
      trailing={
        favorite ? (
          <Star
            aria-hidden
            className="size-3.5 fill-yellow-400 text-yellow-400"
          />
        ) : undefined
      }
    />
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger className="group flex w-full items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground">
        {title}
        <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
      </Collapsible.Trigger>
      <Collapsible.Content className="overflow-hidden">
        <div className="space-y-0.5 pt-1">{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function UserNav({ user }: { user: AuthUser | null }) {
  return (
    <div className="border-t border-sidebar-border p-3">
      <UserMenu user={user} />
    </div>
  );
}

export function SidebarContent({
  user,
  types,
  collections,
  onNavigate,
}: {
  user: AuthUser | null;
  types: ItemTypeSummary[];
  collections: CollectionSummary[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const favoriteCollections = collections.filter(
    (collection) => collection.isFavorite
  );
  const recentCollections = collections.filter(
    (collection) => !collection.isFavorite
  );

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex h-full w-full items-center gap-2 px-4 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <CodeXml className="size-4" />
          </div>
          <span className="text-base font-semibold">DevStash</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SidebarSection title="Types">
          {types.map((type) => {
            const { Icon, textClass } = getTypeVisual(type.id, type.icon);
            return (
              <NavRow
                key={type.id}
                href={`/items/${type.id}`}
                onNavigate={onNavigate}
                active={pathname === `/items/${type.id}`}
                label={type.name}
                count={type.itemCount}
                trailing={
                  PRO_TYPE_IDS.has(type.id) ? (
                    <Badge
                      variant="outline"
                      className="h-4 rounded-full px-1.5 text-[0.625rem] font-semibold tracking-wide text-muted-foreground"
                    >
                      PRO
                    </Badge>
                  ) : undefined
                }
                icon={
                  <Icon aria-hidden className={cn("size-4 shrink-0", textClass)} />
                }
              />
            );
          })}
        </SidebarSection>

        <Separator className="my-3 bg-sidebar-border" />

        <SidebarSection title="Collections">
          <SectionLabel>Favorites</SectionLabel>
          {favoriteCollections.map((collection) => (
            <CollectionNavRow
              key={collection.id}
              collection={collection}
              onNavigate={onNavigate}
              active={pathname === `/collections/${collection.id}`}
              favorite
            />
          ))}

          <SectionLabel>Recent</SectionLabel>
          {recentCollections.map((collection) => (
            <CollectionNavRow
              key={collection.id}
              collection={collection}
              onNavigate={onNavigate}
              active={pathname === `/collections/${collection.id}`}
            />
          ))}

          <Link
            href="/collections"
            onClick={onNavigate}
            className="flex items-center rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            View all collections
          </Link>
        </SidebarSection>
      </nav>

      <UserNav user={user} />
    </div>
  );
}
