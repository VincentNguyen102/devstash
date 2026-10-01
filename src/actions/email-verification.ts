"use server";

import { z } from "zod";

import { sendVerificationEmail } from "@/lib/email";
import {
  buildVerificationUrl,
  createEmailVerificationToken,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const resendSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export interface ResendVerificationState {
  success: boolean;
  data?: { message: string };
  error?: string;
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
  const parsed = resendSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email address",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
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
