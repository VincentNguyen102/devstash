import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

// Edge-compatible Auth.js configuration. It intentionally omits the database
// adapter so it can be imported by `proxy.ts`, which must not touch Prisma.
export default {
  // Trust the host header. Auth.js enables this automatically on Vercel, but
  // it is required when running the production server locally or self-hosting.
  trustHost: true,
  providers: [GitHub],
} satisfies NextAuthConfig;
