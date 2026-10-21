"use client";

import { useRef } from "react";
import { AppWindow, Bookmark, FileText, Terminal } from "lucide-react";

import { useChaosStage } from "@/hooks/use-chaos-stage";
import { CHAOS_SOURCES, CHAOS_TILE_CLASSES } from "@/lib/homepage";
import type { ChaosSourceId } from "@/lib/homepage";
import { cn } from "@/lib/utils";

function BrandIcon({ source }: { source: ChaosSourceId }) {
  switch (source) {
    case "notion":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="size-7">
          <path
            fill="#111318"
            d="M6 4.6c0-.9.6-1.4 1.5-1.5l2.8-.2c.7 0 1 .2 1.4.6l7.2 5.2c.5.4.7.8.7 1.5v9.2c0 1-.6 1.6-1.6 1.6H7.5c-1 0-1.5-.6-1.5-1.6V4.6Zm2.2 1.1v11.9h8.6V10h-2.9c-.6 0-1-.4-1-1V5.7H8.2Zm.9-.8v2.4h1.7c.4 0 .6-.2.6-.6V4.9h-2.3Z"
          />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="size-7">
          <path
            fill="currentColor"
            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
          />
        </svg>
      );
    case "slack":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="size-7">
          <path
            d="M9.5 3.5v6"
            stroke="#36c5f0"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M14.5 14.5v6"
            stroke="#2eb67d"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M3.5 14.5h6"
            stroke="#ecb22e"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M14.5 9.5h6"
            stroke="#e01e5a"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "vscode":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="size-7">
          <path fill="#2f9bf4" d="M17.8 3.6 8.9 12l8.9 8.4V3.6Z" />
          <path
            fill="#2f9bf4"
            opacity=".75"
            d="M8.9 12 4.4 8.4 2.2 9.6v4.8l2.2 1.2L8.9 12Z"
          />
          <path fill="#0b1220" d="m11.5 12 3.2-2.7v5.4L11.5 12Z" />
        </svg>
      );
    case "browser":
      return <AppWindow aria-hidden className="size-7" />;
    case "terminal":
      return <Terminal aria-hidden className="size-7" />;
    case "text":
      return <FileText aria-hidden className="size-7" />;
    case "bookmark":
      return <Bookmark aria-hidden className="size-7" />;
  }
}

/**
 * The "chaos" hero panel: knowledge-source tiles that drift, bounce, rotate,
 * pulse and flee the pointer. The physics live in `useChaosStage`.
 */
export function ChaosStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  useChaosStage(stageRef);

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label="Icons of tools where developer knowledge is scattered"
      className="relative m-2.5 min-h-[340px] flex-1 touch-pan-y overflow-hidden rounded-xl border border-dashed border-white/10 bg-[radial-gradient(rgba(255,255,255,0.075)_1px,transparent_1px)] bg-[size:22px_22px]"
    >
      {CHAOS_SOURCES.map((source) => (
        <div
          key={source.id}
          data-chaos-tile
          data-source={source.id}
          title={source.label}
          className="absolute top-0 left-0 size-14 will-change-transform"
        >
          <span
            className={cn(
              "grid size-full place-items-center rounded-2xl border shadow-[0_14px_28px_-14px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.12)]",
              CHAOS_TILE_CLASSES[source.id],
            )}
          >
            <BrandIcon source={source.id} />
          </span>
        </div>
      ))}
    </div>
  );
}
