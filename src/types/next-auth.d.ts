import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

// Auth.js v5 re-exports the JWT type from @auth/core/jwt; augmenting the
// source module is what actually merges with the callback's `token` type.
declare module "@auth/core/jwt" {
  interface JWT {
    isPro?: boolean;
  }
}
