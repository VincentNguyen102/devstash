import type { ComponentProps } from "react";
import Link from "next/link";

type HomeLinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: string;
};

/**
 * Renders a Next.js `Link` for app routes and a plain anchor for in-page
 * sections, so marketing CTAs always use the right navigation primitive.
 */
export function HomeLink({ href, ...props }: HomeLinkProps) {
  if (href.startsWith("#")) {
    return <a href={href} {...props} />;
  }

  return <Link href={href} {...props} />;
}
