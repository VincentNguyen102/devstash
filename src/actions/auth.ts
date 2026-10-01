"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

function getCallbackUrl(formData: FormData): string {
  const value = formData.get("callbackUrl");

  return typeof value === "string" && value.length > 0 ? value : "/dashboard";
}

/** Credentials sign-in. Returns an error message for the form, or redirects. */
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: getCallbackUrl(formData),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return "Invalid email or password.";
      }

      return "Something went wrong. Please try again.";
    }

    // Re-throw redirects (and anything else) so Next.js can handle them.
    throw error;
  }
}

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: getCallbackUrl(formData) });
}
