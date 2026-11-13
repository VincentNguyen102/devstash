import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

/**
 * Single source of truth for the authenticated-session check.
 *
 * Explicit per-page checks stay (Proxy only does an optimistic cookie check),
 * but `cache()` dedupes the `auth()` call so the layout and the page below it
 * share one session lookup per render pass. Redirects to the custom sign-in
 * page when there is no usable session.
 */
export const verifySession = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return session;
});
