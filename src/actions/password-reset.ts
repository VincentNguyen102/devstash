"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { sendPasswordResetEmail } from "@/lib/email";
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  resetPasswordWithToken,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import {
  passwordField,
  withPasswordConfirmation,
} from "@/lib/validations/password";

const requestSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export interface ForgotPasswordState {
  success: boolean;
  data?: { message: string };
  error?: string;
}

/**
 * Requests a password-reset link. The response is intentionally identical
 * whether or not the email has an account, so it cannot be used to enumerate
 * registered addresses.
 */
export async function requestPasswordReset(
  _prevState: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = requestSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email address",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const message =
    "If an account exists for that email, we've sent a reset link.";

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, password: true },
    });

    // Only credential accounts (which have a password) can be reset.
    if (user?.password) {
      const token = await createPasswordResetToken(email);
      await sendPasswordResetEmail({
        to: email,
        name: user.name,
        url: buildPasswordResetUrl(token),
      });
    }

    return { success: true, data: { message } };
  } catch (error) {
    console.error("Password reset request failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

const resetSchema = withPasswordConfirmation(
  {
    token: z.string().min(1),
    password: passwordField,
  },
  "password",
);

export interface ResetPasswordState {
  success: boolean;
  error?: string;
  code?: "invalid" | "expired";
}

export async function submitPasswordReset(
  _prevState: ResetPasswordState | null,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const status = await resetPasswordWithToken(
      parsed.data.token,
      parsed.data.password,
    );

    if (status === "expired") {
      return {
        success: false,
        code: "expired",
        error: "This reset link has expired. Request a new one.",
      };
    }

    if (status === "invalid") {
      return {
        success: false,
        code: "invalid",
        error: "This reset link is invalid or has already been used.",
      };
    }
  } catch (error) {
    console.error("Password reset failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }

  // `redirect` must run outside the try/catch (it throws a control-flow error).
  redirect("/sign-in?reset=success");
}
