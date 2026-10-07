import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, tooManyRequests } from "@/lib/api";
import { sendVerificationEmail } from "@/lib/email";
import {
  buildVerificationUrl,
  createEmailVerificationToken,
  isEmailVerificationEnabled,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIpFrom,
  rateLimitKey,
} from "@/lib/rate-limit";
import {
  passwordField,
  withPasswordConfirmation,
} from "@/lib/validations/password";

const registerSchema = withPasswordConfirmation(
  {
    name: z.string().trim().min(1, "Name is required"),
    email: z.email("Enter a valid email address"),
    password: passwordField,
  },
  "password",
);

/**
 * Creates the account, hashing the password and marking the email verified up
 * front when the verification flow is disabled.
 */
async function createUser(input: {
  name: string;
  email: string;
  password: string;
  verificationEnabled: boolean;
}) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await hash(input.password, 12),
      emailVerified: input.verificationEnabled ? null : new Date(),
    },
  });
}

/**
 * Sends the verification email best-effort: a delivery failure must not roll
 * back the account (the user can request a new link from `/check-email`).
 */
async function sendVerification(
  user: { name: string | null },
  email: string,
): Promise<void> {
  try {
    const token = await createEmailVerificationToken(email);
    await sendVerificationEmail({
      to: email,
      name: user.name,
      url: buildVerificationUrl(token),
    });
  } catch (error) {
    console.error("Failed to send verification email", error);
  }
}

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(
      "register",
      rateLimitKey(getClientIpFrom(request.headers)),
    );

    if (!limit.success) {
      return tooManyRequests(limit.retryAfterSeconds);
    }

    const parsed = registerSchema.safeParse(await request.json());

    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        400,
      );
    }

    const { name, password } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return jsonError("An account with this email already exists", 409);
    }

    const verificationEnabled = isEmailVerificationEnabled();
    const user = await createUser({
      name,
      email,
      password,
      verificationEnabled,
    });

    if (verificationEnabled) {
      await sendVerification(user, email);
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration failed", error);

    return jsonError("Something went wrong. Please try again.", 500);
  }
}
