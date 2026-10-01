import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { MailCheck } from "lucide-react";

import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

interface CheckEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  // Read the flag at request time so it always matches the server behavior.
  await connection();

  if (!isEmailVerificationEnabled()) {
    redirect("/sign-in");
  }

  const { email } = await searchParams;
  const hasEmail = typeof email === "string" && email.length > 0;

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <MailCheck className="size-10 text-muted-foreground" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold">Check your inbox</h1>
          <p className="text-sm text-muted-foreground">
            {hasEmail ? (
              <>
                We sent a verification link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link to activate your account.
              </>
            ) : (
              "Enter your email address and we'll send you a fresh verification link."
            )}
          </p>
        </div>

        <ResendVerificationForm defaultEmail={hasEmail ? email : undefined} />

        <p className="text-center text-sm text-muted-foreground">
          Already verified?{" "}
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
