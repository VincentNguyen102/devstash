import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import authConfig from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      // The JWT strategy only exposes a subset of the user by default; surface
      // the user id (JWT `sub`) so it is available on `session.user.id`.
      if (token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
