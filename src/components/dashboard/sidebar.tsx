"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, CodeXml, Layers, Settings, Star } from "lucide-react";
import { Collapsible } from "radix-ui";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getTypeVisual } from "@/lib/item-type-meta";
import { collections, currentUser, itemTypes } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

function UserNav() {
  const initials = currentUser.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-sidebar-accent">
        <Avatar className="size-8">
          {currentUser.image ? (
            <AvatarImage src={currentUser.image} alt={currentUser.name} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{currentUser.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {currentUser.email}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <Settings aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const sortedCollections = [...collections].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  const favoriteCollections = sortedCollections.filter(
    (collection) => collection.isFavorite
  );
  const recentCollections = sortedCollections.filter(
    (collection) => !collection.isFavorite
  );

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <CodeXml className="size-4" />
        </div>
        <span className="text-base font-semibold">DevStash</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SidebarSection title="Types">
          {itemTypes.map((type) => {
            const { Icon, textClass } = getTypeVisual(type.id);
            return (
              <NavRow
                key={type.id}
                href={`/items/${type.id}`}
                onNavigate={onNavigate}
                active={pathname === `/items/${type.id}`}
                label={type.name}
                count={type.itemCount}
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
            <NavRow
              key={collection.id}
              href={`/collections/${collection.id}`}
              onNavigate={onNavigate}
              active={pathname === `/collections/${collection.id}`}
              label={collection.name}
              icon={
                <Layers className="size-4 shrink-0 text-muted-foreground" />
              }
              trailing={
                <Star
                  aria-hidden
                  className="size-3.5 fill-yellow-400 text-yellow-400"
                />
              }
            />
          ))}

          <SectionLabel>All Collections</SectionLabel>
          {recentCollections.map((collection) => (
            <NavRow
              key={collection.id}
              href={`/collections/${collection.id}`}
              onNavigate={onNavigate}
              active={pathname === `/collections/${collection.id}`}
              label={collection.name}
              count={collection.itemCount}
              icon={
                <Layers className="size-4 shrink-0 text-muted-foreground" />
              }
            />
          ))}
        </SidebarSection>
      </nav>

      <UserNav />
    </div>
  );
}
