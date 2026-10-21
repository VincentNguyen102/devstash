import { ArrowRight } from "lucide-react";

import { ChaosStage } from "@/components/home/chaos-stage";
import { DashboardPreview } from "@/components/home/dashboard-preview";
import { HomeLink } from "@/components/home/home-link";
import { Container, Eyebrow } from "@/components/home/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HOME_HERO,
  HOME_HREFS,
  PRIMARY_CTA_CLASS,
} from "@/lib/homepage";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-32 pb-20 sm:pt-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_-12%,rgba(59,130,246,0.2),transparent_68%),radial-gradient(720px_460px_at_92%_8%,rgba(236,72,153,0.1),transparent_70%),radial-gradient(640px_420px_at_4%_22%,rgba(99,102,241,0.12),transparent_72%)]"
      />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow dot>{HOME_HERO.eyebrow}</Eyebrow>

          <h1
            id="hero-title"
            className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl"
          >
            {HOME_HERO.titleLead}{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              {HOME_HERO.titleAccent}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {HOME_HERO.description}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className={cn(
                PRIMARY_CTA_CLASS,
                "h-11 w-full px-6 shadow-blue-500/25 transition-transform hover:-translate-y-0.5 sm:w-auto",
              )}
            >
              <HomeLink href={HOME_HREFS.register}>
                {HOME_HERO.primaryCta}
                <ArrowRight aria-hidden />
              </HomeLink>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 w-full bg-background/50 px-6 sm:w-auto"
            >
              <HomeLink href="#features">{HOME_HERO.secondaryCta}</HomeLink>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {HOME_HERO.meta}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[0.94fr_68px_1.16fr]">
          <div className="flex min-w-0 flex-col rounded-2xl border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015)),#0f1116] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
              <span className="truncate text-[0.65rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Your knowledge today...
              </span>
              <Badge
                variant="outline"
                className="shrink-0 rounded-full border-border/80 bg-white/[0.04] text-[0.6rem] text-muted-foreground"
              >
                scattered
              </Badge>
            </div>
            <ChaosStage />
          </div>

          <div className="flex items-center justify-center py-1 lg:py-0">
            <div className="rotate-90 lg:rotate-0">
              <div className="relative grid size-14 place-items-center rounded-full border border-indigo-400/45 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.35),rgba(15,17,22,0.9))] text-indigo-200 shadow-[0_0_0_1px_rgba(99,102,241,0.12),0_0_34px_rgba(99,102,241,0.28)] animate-arrow-pulse motion-reduce:animate-none">
                <ArrowRight aria-hidden className="size-6" />
                <span className="absolute inset-[-6px] rounded-full border border-indigo-400/30 animate-arrow-halo motion-reduce:animate-none" />
                <span className="absolute inset-[-6px] rounded-full border border-indigo-400/30 animate-arrow-halo [animation-delay:1.3s] motion-reduce:animate-none" />
              </div>
            </div>
          </div>

          <DashboardPreview />
        </div>
      </Container>
    </section>
  );
}
