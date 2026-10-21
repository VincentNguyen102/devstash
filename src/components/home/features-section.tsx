import type { LucideIcon } from "lucide-react";
import { Layers, Search } from "lucide-react";

import { Container, SectionHeading } from "@/components/home/section";
import { Card } from "@/components/ui/card";
import { HOME_FEATURES, HOME_FEATURES_HEADING } from "@/lib/homepage";
import type { HomeFeature, HomeTypeId } from "@/lib/homepage";
import { getTypeVisual } from "@/lib/item-type-meta";
import { cn } from "@/lib/utils";

/** Conceptual features use their own icon while keeping their type accent. */
const FEATURE_ICON_OVERRIDES: Partial<Record<HomeTypeId, LucideIcon>> = {
  url: Search,
  note: Layers,
};

function FeatureCard({ feature }: { feature: HomeFeature }) {
  const { Icon: TypeIcon, textClass, bgClass } = getTypeVisual(feature.typeId);
  const Icon = FEATURE_ICON_OVERRIDES[feature.typeId] ?? TypeIcon;

  return (
    <Card
      data-reveal
      className="group relative h-full gap-0 overflow-hidden rounded-2xl border border-border/70 bg-white/[0.02] p-6 ring-0 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04] [--card-spacing:0px]"
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-current opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          textClass,
        )}
      />
      <span
        className={cn(
          "grid size-11 place-items-center rounded-xl border border-white/10",
          bgClass,
          textClass,
        )}
      >
        <Icon aria-hidden className="size-5" />
      </span>
      <h3 className="mt-5 text-base font-semibold tracking-tight">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {feature.description}
      </p>
    </Card>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-24 py-24"
    >
      <Container>
        <SectionHeading
          id="features-title"
          eyebrow={HOME_FEATURES_HEADING.eyebrow}
          title={HOME_FEATURES_HEADING.title}
          description={HOME_FEATURES_HEADING.description}
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </Container>
    </section>
  );
}
