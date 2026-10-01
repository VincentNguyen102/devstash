import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

// Edge-compatible Auth.js configuration. It intentionally omits the database
// adapter so it can be imported by `proxy.ts`, which must not touch Prisma.
export default {
  // Trust the host header. Auth.js enables this automatically on Vercel, but
  // it is required when running the production server locally or self-hosting.
  trustHost: true,
  // Use the custom sign-in page instead of Auth.js's built-in page.
  pages: { signIn: "/sign-in" },
  providers: [
    GitHub,
    // Edge-safe placeholder. `auth.ts` swaps in the real provider with bcrypt
    // validation, since bcrypt and Prisma cannot run in the proxy runtime.
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;
