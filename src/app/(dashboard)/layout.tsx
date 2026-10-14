import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCollections } from "@/lib/db/collections";
import { getItemTypes, getSearchItems } from "@/lib/db/items";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  const [types, collections, searchItems] = await Promise.all([
    getItemTypes(),
    getCollections(session.user.id),
    getSearchItems(session.user.id),
  ]);

  return (
    <DashboardShell
      user={session.user}
      types={types}
      collections={collections}
      searchItems={searchItems}
    >
      {children}
    </DashboardShell>
  );
}
