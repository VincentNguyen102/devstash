import { CodeXml } from "lucide-react";

import { HomeLink } from "@/components/home/home-link";
import { Container } from "@/components/home/section";
import {
  HOME_FOOTER,
  HOME_FOOTER_GROUPS,
  HOME_HREFS,
} from "@/lib/homepage";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/80 py-14">
      <Container className="grid grid-cols-2 gap-10 md:grid-cols-4">
        <div className="col-span-2">
          <HomeLink
            href={HOME_HREFS.home}
            aria-label="DevStash home"
            className="inline-flex items-center gap-2.5"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
              <CodeXml aria-hidden className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              DevStash
            </span>
          </HomeLink>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {HOME_FOOTER.tagline}
          </p>
        </div>

        {HOME_FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h3 className="text-sm font-medium">{group.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <HomeLink
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </HomeLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <Container className="mt-10 flex flex-col gap-2 border-t border-border/80 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {year} {HOME_FOOTER.copyright}
        </p>
        <p>{HOME_FOOTER.note}</p>
      </Container>
    </footer>
  );
}
