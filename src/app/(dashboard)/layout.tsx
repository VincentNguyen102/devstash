import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCollections } from "@/lib/db/collections";
import { getItemTypes, getSearchItems } from "@/lib/db/items";
import { getEditorPreferences } from "@/lib/db/settings";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  const [types, collections, searchItems, editorPreferences] = await Promise.all([
    getItemTypes(),
    getCollections(session.user.id),
    getSearchItems(session.user.id),
    getEditorPreferences(session.user.id),
  ]);

  return (
    <DashboardShell
      user={session.user}
      types={types}
      collections={collections}
      searchItems={searchItems}
      editorPreferences={editorPreferences}
    >
      {children}
    </DashboardShell>
  );
}
