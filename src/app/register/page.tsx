import Link from "next/link";
import { connection } from "next/server";

import { RegisterForm } from "@/components/auth/register-form";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

export default async function RegisterPage() {
  // Read the flag at request time so it always matches the server behavior.
  await connection();
  const emailVerificationEnabled = isEmailVerificationEnabled();

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Start stashing your dev knowledge.
          </p>
        </div>

        <RegisterForm
          emailVerificationEnabled={emailVerificationEnabled}
        />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
