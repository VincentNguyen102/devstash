import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCollections } from "@/lib/db/collections";
import { getItemTypes } from "@/lib/db/items";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  const [types, collections] = await Promise.all([
    getItemTypes(),
    getCollections(),
  ]);

  return (
    <DashboardShell user={session.user} types={types} collections={collections}>
      {children}
    </DashboardShell>
  );
}
