"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { SidebarContent } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import type { CollectionSummary } from "@/lib/db/collections";
import type { ItemTypeSummary } from "@/lib/db/items";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
  types: ItemTypeSummary[];
  collections: CollectionSummary[];
}

export function DashboardShell({
  children,
  types,
  collections,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = useCallback(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setSidebarOpen((open) => !open);
    } else {
      setMobileOpen((open) => !open);
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out md:block",
          sidebarOpen ? "md:w-64" : "md:w-0"
        )}
      >
        <div className="h-full w-64">
          <SidebarContent types={types} collections={collections} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar"
        >
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/50"
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border shadow-xl">
            <SidebarContent
              types={types}
              collections={collections}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
