"use server";

import { z } from "zod";

import { sendVerificationEmail } from "@/lib/email";
import {
  buildVerificationUrl,
  createEmailVerificationToken,
  isEmailVerificationEnabled,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  rateLimitKey,
  rateLimitMessage,
} from "@/lib/rate-limit";

const resendSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export interface ResendVerificationState {
  success: boolean;
  data?: { message: string };
  error?: string;
  rateLimited?: boolean;
}

/**
 * Issues and sends a fresh verification link. The response is intentionally
 * identical whether or not the email has an unverified account, so it cannot
 * be used to enumerate registered addresses.
 */
export async function resendVerificationEmail(
  _prevState: ResendVerificationState | null,
  formData: FormData,
): Promise<ResendVerificationState> {
  if (!isEmailVerificationEnabled()) {
    return {
      success: true,
      data: { message: "Email verification is currently disabled." },
    };
  }

  const parsed = resendSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email address",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const ip = await getClientIp();
  const limit = await checkRateLimit(
    "resendVerification",
    rateLimitKey(ip, email),
  );

  if (!limit.success) {
    return {
      success: false,
      error: rateLimitMessage(limit.retryAfterSeconds),
      rateLimited: true,
    };
  }

  const message =
    "If an account exists for that email, we've sent a new verification link.";

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      const token = await createEmailVerificationToken(email);
      await sendVerificationEmail({
        to: email,
        name: user.name,
        url: buildVerificationUrl(token),
      });
    }

    return { success: true, data: { message } };
  } catch (error) {
    console.error("Resending verification email failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
