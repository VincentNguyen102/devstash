import { TopBar } from "@/components/dashboard/top-bar";

export default function DashboardPage() {
  return (
    <div className="flex h-svh">
      <aside className="w-64 shrink-0 border-r border-border p-4">
        <h2 className="text-lg font-semibold">Sidebar</h2>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-lg font-semibold">Main</h2>
        </main>
      </div>
    </div>
  );
}
