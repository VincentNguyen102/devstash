import Link from "next/link";
import { connection } from "next/server";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { isPasswordResetTokenValid } from "@/lib/password-reset";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  await connection();

  const { token } = await searchParams;
  const resetToken =
    typeof token === "string" && token.length > 0 ? token : null;
  const status = resetToken
    ? await isPasswordResetTokenValid(resetToken)
    : "invalid";

  if (!resetToken || status !== "success") {
    const expired = status === "expired";

    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              {expired ? "Link expired" : "Invalid link"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {expired
                ? "This password reset link has expired. Request a new one and check your inbox."
                : "This password reset link is invalid or has already been used. Request a new one."}
            </p>
          </div>

          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>

          <p className="text-sm text-muted-foreground">
            <Link
              href="/sign-in"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Choose a new password</h1>
          <p className="text-sm text-muted-foreground">
            Enter a new password for your account.
          </p>
        </div>

        <ResetPasswordForm token={resetToken} />

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
