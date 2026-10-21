import type { ReactNode } from "react";
import { Check, Sparkles } from "lucide-react";

import { Container } from "@/components/home/section";
import { Badge } from "@/components/ui/badge";
import { HOME_AI } from "@/lib/homepage";
import { cn } from "@/lib/utils";

const TOKEN_KEYWORD = "text-purple-400";
const TOKEN_STRING = "text-emerald-300";
const TOKEN_FUNCTION = "text-sky-300";
const TOKEN_NUMBER = "text-amber-300";

function CodeLine({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("block min-h-7", className)}>{children}</span>
  );
}

export function AiSection() {
  return (
    <section
      id="ai"
      aria-labelledby="ai-title"
      className="scroll-mt-24 py-24"
    >
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-reveal className="max-w-xl">
          <Badge
            variant="outline"
            className="rounded-full border-amber-400/30 bg-amber-400/10 text-amber-200"
          >
            <Sparkles aria-hidden className="text-amber-300" />
            {HOME_AI.eyebrow}
          </Badge>

          <h2
            id="ai-title"
            className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl"
          >
            {HOME_AI.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {HOME_AI.description}
          </p>

          <ul className="mt-8 space-y-4">
            {HOME_AI.checklist.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-green-400/25 bg-green-400/10 text-green-400">
                  <Check aria-hidden className="size-3.5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal className="home-ai-visual relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 rounded-full bg-indigo-500/10 blur-3xl"
          />

          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-[#0d0d0d] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 border-b border-border/80 bg-[#151515] px-3 py-2.5">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="min-w-0 flex-1 truncate font-mono text-[0.7rem] text-muted-foreground">
                snippets/useDebounce.ts
              </span>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[0.6rem] text-muted-foreground">
                TypeScript
              </span>
            </div>

            <pre className="overflow-x-auto p-4 font-mono text-[0.72rem] leading-7 text-slate-300">
              <code>
                <CodeLine>
                  <span className={TOKEN_KEYWORD}>import</span>{" "}
                  {"{ useEffect, useState }"}{" "}
                  <span className={TOKEN_KEYWORD}>from</span>{" "}
                  <span className={TOKEN_STRING}>&quot;react&quot;</span>;
                </CodeLine>
                <CodeLine />
                <CodeLine>
                  <span className={TOKEN_KEYWORD}>export function</span>{" "}
                  <span className={TOKEN_FUNCTION}>useDebounce</span>
                  &lt;T&gt;(value: T, delay ={" "}
                  <span className={TOKEN_NUMBER}>300</span>) {"{"}
                </CodeLine>
                <CodeLine className="pl-4">
                  <span className={TOKEN_KEYWORD}>const</span> [debounced,
                  setDebounced] ={" "}
                  <span className={TOKEN_FUNCTION}>useState</span>(value);
                </CodeLine>
                <CodeLine />
                <CodeLine className="pl-4">
                  <span className={TOKEN_FUNCTION}>useEffect</span>(() =&gt;{" "}
                  {"{"}
                </CodeLine>
                <CodeLine className="pl-8">
                  <span className={TOKEN_KEYWORD}>const</span> timer ={" "}
                  <span className={TOKEN_FUNCTION}>setTimeout</span>(() =&gt;{" "}
                  <span className={TOKEN_FUNCTION}>setDebounced</span>(value),
                  delay);
                </CodeLine>
                <CodeLine className="pl-8">
                  <span className={TOKEN_KEYWORD}>return</span> () =&gt;{" "}
                  <span className={TOKEN_FUNCTION}>clearTimeout</span>(timer);
                </CodeLine>
                <CodeLine className="pl-4">
                  {"}, [value, delay]);"}
                </CodeLine>
                <CodeLine />
                <CodeLine className="pl-4">
                  <span className={TOKEN_KEYWORD}>return</span> debounced;
                </CodeLine>
                <CodeLine>{"}"}</CodeLine>
              </code>
            </pre>

            <div className="border-t border-border/80 bg-[linear-gradient(180deg,rgba(99,102,241,0.08),rgba(245,158,11,0.04))] px-4 py-3">
              <div className="flex items-center gap-2 text-[0.7rem] font-semibold text-slate-200">
                <span className="grid size-5 place-items-center rounded-md bg-amber-400/15 text-amber-300">
                  <Sparkles aria-hidden className="size-3" />
                </span>
                AI Generated Tags
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-[0.6rem] font-normal text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                  0.3s
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {HOME_AI.tags.map((tag) => (
                  <span
                    key={tag}
                    className="home-tag rounded-full border border-indigo-400/30 bg-indigo-400/10 px-2 py-0.5 font-mono text-[0.62rem] text-indigo-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
