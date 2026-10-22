"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CodeXml, Menu, X } from "lucide-react";

import { HomeLink } from "@/components/home/home-link";
import { Container } from "@/components/home/section";
import { Button } from "@/components/ui/button";
import {
  HOME_HREFS,
  HOME_NAV_LINKS,
  PRIMARY_CTA_CLASS,
  type HomeLinkItem,
} from "@/lib/homepage";
import { cn } from "@/lib/utils";

export type SiteHeaderAction = "sign-in" | "get-started";

export interface SiteHeaderProps {
  /** Section links shown in the nav. Defaults to the homepage anchors. */
  links?: HomeLinkItem[];
  /** Auth actions to show on the right. Defaults to both. */
  actions?: SiteHeaderAction[];
  /**
   * `solid` keeps the header opaque over pages with no hero behind it.
   * Defaults to the transparent treatment that solidifies on scroll.
   */
  variant?: "transparent" | "solid";
}

const DEFAULT_ACTIONS: SiteHeaderAction[] = ["sign-in", "get-started"];

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};

const getScrollSnapshot = () => window.scrollY > 8;
const getServerScrollSnapshot = () => false;

export function SiteHeader({
  links = HOME_NAV_LINKS,
  actions = DEFAULT_ACTIONS,
  variant = "transparent",
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const showSignIn = actions.includes("sign-in");
  const showGetStarted = actions.includes("get-started");
  const headerRef = useRef<HTMLElement>(null);
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    getScrollSnapshot,
    getServerScrollSnapshot,
  );

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const handleDesktop = () => {
      if (desktopQuery.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    desktopQuery.addEventListener("change", handleDesktop);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      desktopQuery.removeEventListener("change", handleDesktop);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const solid = variant === "solid" || scrolled;

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        solid
          ? "border-border/80 bg-background/85 backdrop-blur-xl"
          : "border-transparent bg-background/30 backdrop-blur-md",
      )}
    >
      <Container className="flex h-16 items-center gap-6">
        <HomeLink
          href={HOME_HREFS.home}
          aria-label="DevStash home"
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
            <CodeXml aria-hidden className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            DevStash
          </span>
        </HomeLink>

        <nav
          aria-label="Main"
          className="hidden items-center gap-1 md:flex"
        >
          {links.map((link) => (
            <HomeLink
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </HomeLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {showSignIn ? (
            <Button asChild variant="ghost" size="lg">
              <HomeLink href={HOME_HREFS.signIn}>Sign In</HomeLink>
            </Button>
          ) : null}
          {showGetStarted ? (
            <Button
              asChild
              size="lg"
              className={cn(PRIMARY_CTA_CLASS, "px-4")}
            >
              <HomeLink href={HOME_HREFS.register}>Get Started</HomeLink>
            </Button>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="home-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
        </Button>
      </Container>

      {menuOpen ? (
        <div
          id="home-mobile-menu"
          className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
        >
          <Container className="flex flex-col gap-1 py-4">
            {links.map((link) => (
              <HomeLink
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </HomeLink>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
              {showSignIn ? (
                <Button asChild variant="outline" size="lg">
                  <HomeLink href={HOME_HREFS.signIn} onClick={closeMenu}>
                    Sign In
                  </HomeLink>
                </Button>
              ) : null}
              {showGetStarted ? (
                <Button asChild size="lg" className={PRIMARY_CTA_CLASS}>
                  <HomeLink href={HOME_HREFS.register} onClick={closeMenu}>
                    Get Started
                  </HomeLink>
                </Button>
              ) : null}
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
