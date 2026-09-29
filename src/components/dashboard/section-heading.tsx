import type { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  icon?: ReactNode;
}

export function SectionHeading({ title, icon }: SectionHeadingProps) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
      {icon ? (
        <span aria-hidden className="text-muted-foreground">
          {icon}
        </span>
      ) : null}
      {title}
    </h2>
  );
}
