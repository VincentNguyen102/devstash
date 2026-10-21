import {
  DASHBOARD_PREVIEW_CARDS,
  DASHBOARD_PREVIEW_NAV,
  DASHBOARD_PREVIEW_STATS,
} from "@/lib/homepage";
import { getTypeVisual } from "@/lib/item-type-meta";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="flex h-full min-w-0 flex-col rounded-2xl border border-border/80 bg-[linear-gradient(180deg,rgba(59,130,246,0.06),rgba(255,255,255,0.012)_45%),#0f1116] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
        <span className="truncate text-[0.65rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          ...with DevStash
        </span>
        <Badge
          variant="outline"
          className="shrink-0 rounded-full border-green-400/30 bg-green-400/10 text-[0.6rem] text-green-300"
        >
          one home
        </Badge>
      </div>

      <div className="flex flex-1 p-2.5">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0d11]">
          <div className="flex items-center gap-2 border-b border-white/[0.08] bg-[#0f1116] px-3 py-2">
            <div className="flex items-center gap-1" aria-hidden>
              <span className="size-1.5 rounded-full bg-[#ff5f57]" />
              <span className="size-1.5 rounded-full bg-[#febc2e]" />
              <span className="size-1.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="truncate font-mono text-[0.6rem] text-muted-foreground">
              devstash.io/dashboard
            </span>
          </div>

          <div className="flex min-h-0 flex-1">
            <aside className="hidden w-32 shrink-0 flex-col border-r border-white/[0.08] p-2 sm:flex">
              <div className="flex items-center gap-1.5 px-1 pb-2 text-[0.65rem] font-semibold">
                <span className="size-4 rounded bg-gradient-to-br from-blue-500 to-indigo-500" />
                DevStash
              </div>

              <ul className="space-y-0.5">
                {DASHBOARD_PREVIEW_NAV.map((item, index) => {
                  const { textClass } = getTypeVisual(item.typeId);

                  return (
                    <li
                      key={item.typeId}
                      className={cn(
                        "flex items-center gap-1.5 rounded px-1.5 py-1 text-[0.6rem] text-muted-foreground",
                        index === 0 && "bg-white/5 text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full bg-current",
                          textClass,
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      <span className="tabular-nums opacity-60">
                        {item.count}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-auto border-t border-white/[0.08] pt-2">
                <p className="px-1 pb-1 text-[0.5rem] font-medium tracking-wide text-muted-foreground uppercase">
                  Collections
                </p>
                <p className="flex items-center gap-1.5 px-1 py-0.5 text-[0.6rem] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-blue-400" />
                  React Patterns
                </p>
                <p className="flex items-center gap-1.5 px-1 py-0.5 text-[0.6rem] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-violet-400" />
                  AI Workflows
                </p>
              </div>
            </aside>

            <div className="min-w-0 flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[0.5rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    Library
                  </p>
                  <p className="text-xs font-semibold">All items</p>
                </div>
                <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.55rem] font-medium text-muted-foreground">
                  + New
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {DASHBOARD_PREVIEW_STATS.map((stat) => (
                  <span
                    key={stat}
                    className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[0.55rem] text-muted-foreground"
                  >
                    {stat}
                  </span>
                ))}
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {DASHBOARD_PREVIEW_CARDS.map((card) => {
                  const { textClass } = getTypeVisual(card.typeId);

                  return (
                    <div
                      key={card.title}
                      className="relative overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.03] p-2"
                    >
                      <span
                        className={cn(
                          "absolute inset-x-0 top-0 h-0.5 bg-current",
                          textClass,
                        )}
                      />
                      <p className="truncate text-[0.6rem] font-medium">
                        {card.title}
                      </p>
                      <div className="mt-1.5 space-y-1">
                        <span className="block h-0.5 w-4/5 rounded bg-white/[0.08]" />
                        <span className="block h-0.5 w-3/5 rounded bg-white/[0.08]" />
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {card.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-white/5 px-1 py-0.5 font-mono text-[0.5rem] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
