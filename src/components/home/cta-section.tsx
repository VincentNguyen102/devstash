import { ArrowRight } from "lucide-react";

import { HomeLink } from "@/components/home/home-link";
import { Container, Eyebrow } from "@/components/home/section";
import { Button } from "@/components/ui/button";
import {
  HOME_CTA,
  HOME_HREFS,
  PRIMARY_CTA_CLASS,
} from "@/lib/homepage";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section
      id="cta"
      aria-labelledby="cta-title"
      className="scroll-mt-24 py-24"
    >
      <Container>
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012)),#0f1116] px-6 py-14 text-center shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)] sm:px-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_0%,rgba(99,102,241,0.22),transparent_70%)]"
          />

          <div className="relative mx-auto max-w-2xl">
            <Eyebrow>{HOME_CTA.eyebrow}</Eyebrow>
            <h2
              id="cta-title"
              className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl"
            >
              {HOME_CTA.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {HOME_CTA.description}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className={cn(
                  PRIMARY_CTA_CLASS,
                  "h-11 w-full px-6 shadow-blue-500/25 sm:w-auto",
                )}
              >
                <HomeLink href={HOME_HREFS.register}>
                  {HOME_CTA.primaryCta}
                  <ArrowRight aria-hidden />
                </HomeLink>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-11 w-full px-6 sm:w-auto"
              >
                <HomeLink href="#features">{HOME_CTA.secondaryCta}</HomeLink>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {HOME_CTA.meta}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
