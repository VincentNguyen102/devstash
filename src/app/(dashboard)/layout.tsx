import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { verifySession } from "@/lib/dal";
import { getBillingEntitlements } from "@/lib/db/billing";
import { getCollections } from "@/lib/db/collections";
import { getItemTypes, getSearchItems } from "@/lib/db/items";
import { getEditorPreferences } from "@/lib/db/settings";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();

  const [types, collections, searchItems, editorPreferences, billing] =
    await Promise.all([
      getItemTypes(),
      getCollections(session.user.id),
      getSearchItems(session.user.id),
      getEditorPreferences(session.user.id),
      getBillingEntitlements(session.user.id),
    ]);

  if (!billing) {
    redirect("/sign-in");
  }

  return (
    <DashboardShell
      user={session.user}
      types={types}
      collections={collections}
      searchItems={searchItems}
      editorPreferences={editorPreferences}
      billing={billing}
    >
      {children}
    </DashboardShell>
  );
}
