import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTypeVisual } from "@/lib/item-type-meta";
import type { ProOnlyTypeId } from "@/lib/usage-limits";

const COPY: Record<ProOnlyTypeId, { title: string; description: string }> = {
  file: {
    title: "Files are a Pro feature",
    description:
      "Upload PDFs, documents, archives and other files to your stash, then open or download them from anywhere.",
  },
  image: {
    title: "Images are a Pro feature",
    description:
      "Upload images to your stash and browse them in a gallery with quick previews.",
  },
};

const PRO_BENEFITS = [
  "Unlimited items and collections",
  "File and image uploads",
  "Everything in the Free plan",
];

interface ProUpgradeProps {
  /** The Pro-only item type the visitor tried to open. */
  typeId: ProOnlyTypeId;
}

/**
 * Upgrade screen shown instead of a Pro-only item listing. Rendered inside the
 * dashboard shell, so the sidebar and top bar stay available to Free users.
 */
export function ProUpgrade({ typeId }: ProUpgradeProps) {
  const { Icon, textClass, bgClass } = getTypeVisual(typeId);
  const { title, description } = COPY[typeId];

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div
          className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${bgClass}`}
        >
          <Icon aria-hidden className={`size-7 ${textClass}`} />
        </div>

        <Badge
          variant="outline"
          className="mt-5 border-indigo-400/40 text-indigo-300"
        >
          <Lock aria-hidden />
          PRO
        </Badge>

        <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>

        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-green-400" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/settings#billing">
              Upgrade to Pro
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          You can keep using snippets, prompts, commands, notes and links on the
          Free plan.
        </p>
      </div>
    </div>
  );
}
