import type { ReactNode } from "react";

import {
  SiteHeader,
  type SiteHeaderAction,
} from "@/components/home/site-header";
import { AUTH_NAV_LINKS } from "@/lib/homepage";

interface AuthShellProps {
  /** Auth action(s) shown in the header for the current page. */
  actions: SiteHeaderAction[];
  children: ReactNode;
}

/**
 * Shared frame for the sign-in and register screens: the marketing header
 * (with section links that return to the homepage) above a centred form.
 */
export function AuthShell({ actions, children }: AuthShellProps) {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
      >
        Skip to content
      </a>

      <SiteHeader actions={actions} links={AUTH_NAV_LINKS} variant="solid" />

      <main
        id="main"
        className="grid min-h-svh place-items-center px-6 py-24"
      >
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </main>
    </div>
  );
}
