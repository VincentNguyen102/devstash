"use server";

import { AuthError, CredentialsSignin } from "next-auth";

import { signIn } from "@/auth";

export interface AuthFormState {
  message: string;
  code?: "email_not_verified";
}

function getCallbackUrl(formData: FormData): string {
  const value = formData.get("callbackUrl");

  return typeof value === "string" && value.length > 0 ? value : "/dashboard";
}

/** Credentials sign-in. Returns an error state for the form, or redirects. */
export async function authenticate(
  _prevState: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: getCallbackUrl(formData),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (
        error instanceof CredentialsSignin &&
        error.code === "email_not_verified"
      ) {
        return {
          message: "Please verify your email before signing in.",
          code: "email_not_verified",
        };
      }

      if (error.type === "CredentialsSignin") {
        return { message: "Invalid email or password." };
      }

      return { message: "Something went wrong. Please try again." };
    }

    // Re-throw redirects (and anything else) so Next.js can handle them.
    throw error;
  }

  // `signIn` redirects on success, so this is only reached if it resolves
  // without redirecting.
  return null;
}

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: getCallbackUrl(formData) });
}
