"use server";

import { compare, hash } from "bcryptjs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  currentPasswordField,
  passwordField,
  withPasswordConfirmation,
} from "@/lib/validations/password";

const BCRYPT_ROUNDS = 12;

const changePasswordSchema = withPasswordConfirmation(
  {
    currentPassword: currentPasswordField,
    newPassword: passwordField,
  },
  "newPassword",
);

export interface ChangePasswordState {
  success: boolean;
  data?: { message: string };
  error?: string;
}

/**
 * Updates the signed-in user's password after verifying their current one.
 * Only works for credential accounts (users with a stored password).
 */
export async function changePassword(
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    // GitHub-only accounts have no password to change.
    if (!user?.password) {
      return {
        success: false,
        error: "This account does not use a password.",
      };
    }

    const matches = await compare(parsed.data.currentPassword, user.password);

    if (!matches) {
      return { success: false, error: "Your current password is incorrect." };
    }

    const hashedPassword = await hash(parsed.data.newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true, data: { message: "Password updated." } };
  } catch (error) {
    console.error("Change password failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

export interface DeleteAccountState {
  success: boolean;
  error?: string;
}

/**
 * Permanently deletes the signed-in user. Related records are removed through
 * the cascade rules in the Prisma schema. The client signs the user out after
 * a successful delete (see `DeleteAccountDialog`).
 */
export async function deleteAccount(): Promise<DeleteAccountState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeSubscriptionId: true },
    });

    if (user?.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
        );

        if (subscription.status !== "canceled") {
          await stripe.subscriptions.cancel(subscription.id);
        }
      } catch (error) {
        console.error(
          "Failed to cancel subscription before deleting user",
          error,
        );

        return {
          success: false,
          error:
            "We couldn't cancel your subscription. Please try again, or manage billing first.",
        };
      }
    }

    await prisma.user.delete({ where: { id: session.user.id } });
  } catch (error) {
    console.error("Delete account failed", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }

  return { success: true };
}
