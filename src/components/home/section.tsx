import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  dot = false,
  className,
}: {
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.11em] text-indigo-200 uppercase",
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-indigo-300 shadow-[0_0_0_4px_rgba(129,140,248,0.15)]"
        />
      ) : null}
      {children}
    </span>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  align?: "center" | "left";
}) {
  return (
    <div
      data-reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl"
      >
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
