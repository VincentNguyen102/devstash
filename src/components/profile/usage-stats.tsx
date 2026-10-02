import { FileText, Layers, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileTypeCount } from "@/lib/db/profile";
import { getTypeVisual } from "@/lib/item-type-meta";
import { cn } from "@/lib/utils";

interface UsageStatsProps {
  itemCount: number;
  collectionCount: number;
  typeCounts: ProfileTypeCount[];
}

interface Total {
  label: string;
  value: number;
  Icon: LucideIcon;
}

/** Usage totals and a per-item-type breakdown for the signed-in user. */
export function UsageStats({
  itemCount,
  collectionCount,
  typeCounts,
}: UsageStatsProps) {
  const totals: Total[] = [
    { label: "Items", value: itemCount, Icon: FileText },
    { label: "Collections", value: collectionCount, Icon: Layers },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {totals.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon aria-hidden className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold tabular-nums">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
            Items by type
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {typeCounts.map((type) => {
              const { Icon, textClass, bgClass } = getTypeVisual(
                type.id,
                type.icon,
              );

              return (
                <li
                  key={type.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/40 p-2.5"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      bgClass,
                    )}
                  >
                    <Icon aria-hidden className={cn("size-4", textClass)} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {type.name}
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {type.itemCount}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
