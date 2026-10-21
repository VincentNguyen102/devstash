import type { Metadata } from "next";

import { AiSection } from "@/components/home/ai-section";
import { CtaSection } from "@/components/home/cta-section";
import { FeaturesSection } from "@/components/home/features-section";
import { Hero } from "@/components/home/hero";
import { PricingSection } from "@/components/home/pricing-section";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";

export const metadata: Metadata = {
  title: "DevStash — Stop Losing Your Developer Knowledge",
  description:
    "DevStash is the developer knowledge hub for code snippets, AI prompts, commands, notes, files, images and links — all in one fast, searchable library.",
};

export default function Home() {
  return (
    <div className="relative flex min-h-svh flex-1 flex-col overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main" className="flex-1">
        <Hero />
        <FeaturesSection />
        <AiSection />
        <PricingSection />
        <CtaSection />
      </main>

      <SiteFooter />
      <ScrollReveal />
    </div>
  );
}
