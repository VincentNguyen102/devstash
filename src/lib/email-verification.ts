import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

// Verification links are valid for 24 hours.
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

/**
 * Whether the email-verification system is enabled. Enabled by default
 * (opt-out) so a missing or misconfigured variable keeps verification on;
 * set `EMAIL_VERIFICATION_ENABLED=false` (or `0`) to disable it.
 */
export function isEmailVerificationEnabled(): boolean {
  const value = process.env.EMAIL_VERIFICATION_ENABLED?.trim().toLowerCase();

  return value !== "false" && value !== "0";
}

export type VerifyEmailStatus = "success" | "expired" | "invalid";

export interface VerifyEmailResult {
  status: VerifyEmailStatus;
  /** Present for `expired` so the UI can prefill a resend request. */
  email?: string;
}

/** Only the hash of a verification token is ever stored or logged. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Absolute base URL used to build the link that goes in the email. */
export function getAppUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  return (configured ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Issues a fresh verification token for an email. Any outstanding tokens for
 * that email are invalidated first so only the newest link works.
 *
 * @returns the raw (unhashed) token to embed in the email link.
 */
export async function createEmailVerificationToken(
  email: string,
): Promise<string> {
  const identifier = email.trim().toLowerCase();
  const token = randomBytes(32).toString("hex");

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

export function buildVerificationUrl(token: string): string {
  return `${getAppUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * Validates a raw verification token, marks the matching user as verified and
 * consumes the token so the link can only be used once.
 */
export async function verifyEmailToken(
  token: string,
): Promise<VerifyEmailResult> {
  const record = await prisma.verificationToken.findFirst({
    where: { token: hashToken(token) },
  });

  if (!record) {
    return { status: "invalid" };
  }

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    });

    return { status: "expired", email: record.identifier };
  }

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    });

    return { status: "invalid" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: user.emailVerified ?? new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    }),
  ]);

  return { status: "success" };
}
