import { FileText, Layers, Star, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatsProps {
  itemCount: number;
  collectionCount: number;
  favoriteItemCount: number;
  favoriteCollectionCount: number;
}

interface Stat {
  label: string;
  value: number;
  Icon: LucideIcon;
}

export function DashboardStats({
  itemCount,
  collectionCount,
  favoriteItemCount,
  favoriteCollectionCount,
}: DashboardStatsProps) {
  const stats: Stat[] = [
    { label: "Items", value: itemCount, Icon: FileText },
    { label: "Collections", value: collectionCount, Icon: Layers },
    { label: "Favorite Items", value: favoriteItemCount, Icon: Star },
    { label: "Favorite Collections", value: favoriteCollectionCount, Icon: Star },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, Icon }) => (
        <Card key={label} size="sm">
          <CardContent className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon aria-hidden className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold tabular-nums">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
