import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCollections } from "@/lib/db/collections";
import { getItemTypes } from "@/lib/db/items";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [types, collections] = await Promise.all([
    getItemTypes(),
    getCollections(),
  ]);

  return (
    <DashboardShell types={types} collections={collections}>
      {children}
    </DashboardShell>
  );
}
