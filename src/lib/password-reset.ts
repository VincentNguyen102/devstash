import { hash } from "bcryptjs";

import { getAppUrl } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import {
  generateToken,
  hashToken,
  PASSWORD_RESET_IDENTIFIER_PREFIX,
} from "@/lib/tokens";

// Reset links are valid for one hour.
const TOKEN_TTL_MS = 1000 * 60 * 60;
const BCRYPT_ROUNDS = 12;

export type PasswordResetStatus = "success" | "expired" | "invalid";

function identifierFor(email: string): string {
  return `${PASSWORD_RESET_IDENTIFIER_PREFIX}${email.trim().toLowerCase()}`;
}

function emailFromIdentifier(identifier: string): string {
  return identifier.slice(PASSWORD_RESET_IDENTIFIER_PREFIX.length);
}

function findResetToken(token: string) {
  return prisma.verificationToken.findFirst({
    where: {
      token: hashToken(token),
      identifier: { startsWith: PASSWORD_RESET_IDENTIFIER_PREFIX },
    },
  });
}

/**
 * Issues a fresh password-reset token for an email, invalidating any previous
 * reset tokens so only the newest link works.
 *
 * @returns the raw (unhashed) token to embed in the email link.
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  const identifier = identifierFor(email);
  const token = generateToken();

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  return token;
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

/** Read-only check used to decide whether to render the reset form. */
export async function isPasswordResetTokenValid(
  token: string,
): Promise<PasswordResetStatus> {
  const record = await findResetToken(token);

  if (!record) {
    return "invalid";
  }

  return record.expires.getTime() < Date.now() ? "expired" : "success";
}

/**
 * Validates a raw reset token, updates the user's password and consumes the
 * token so the link can only be used once.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<PasswordResetStatus> {
  const record = await findResetToken(token);

  if (!record) {
    return "invalid";
  }

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    });

    return "expired";
  }

  const email = emailFromIdentifier(record.identifier);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    });

    return "invalid";
  }

  const passwordHash = await hash(newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    }),
  ]);

  return "success";
}
