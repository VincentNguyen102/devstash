import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";

import authConfig from "@/auth.config";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { requiredPasswordField } from "@/lib/validations/password";

// Only the email/password pair is read from the credentials sign-in form.
const credentialsSchema = z.object({
  email: z.email(),
  password: requiredPasswordField,
});

// Thrown when the credentials are valid but the email has not been verified
// yet. The `code` is surfaced to the sign-in action so it can show a specific
// message instead of the generic "invalid credentials" error.
class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GitHub,
    // Real, Node-only implementation that replaces the edge-safe placeholder
    // in `auth.config.ts`.
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user?.password) {
          return null;
        }

        const passwordMatches = await compare(
          parsed.data.password,
          user.password,
        );

        if (!passwordMatches) {
          return null;
        }

        // Only block unverified accounts while the verification system is on.
        if (isEmailVerificationEnabled() && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
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
