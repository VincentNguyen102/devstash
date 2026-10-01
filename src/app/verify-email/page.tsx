import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CheckCircle2, Clock, MailWarning, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

interface VerifyEmailPageProps {
  searchParams: Promise<{ status?: string; email?: string }>;
}

const CONTENT = {
  success: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-500",
    title: "Email verified",
    description: "Your email address has been verified. You can now sign in.",
    action: { label: "Sign in", href: "/sign-in" },
  },
  expired: {
    icon: Clock,
    iconClassName: "text-amber-500",
    title: "Link expired",
    description:
      "This verification link has expired. Request a new one and check your inbox.",
    action: { label: "Send a new link", href: "/check-email" },
  },
  invalid: {
    icon: XCircle,
    iconClassName: "text-destructive",
    title: "Invalid link",
    description:
      "This verification link is invalid or has already been used. If you still need to verify your email, request a new link.",
    action: { label: "Send a new link", href: "/check-email" },
  },
  error: {
    icon: MailWarning,
    iconClassName: "text-destructive",
    title: "Something went wrong",
    description:
      "We couldn't verify your email right now. Please try again or request a new link.",
    action: { label: "Send a new link", href: "/check-email" },
  },
} as const;

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  // Read the flag at request time so it always matches the server behavior.
  await connection();

  if (!isEmailVerificationEnabled()) {
    redirect("/sign-in");
  }

  const { status, email } = await searchParams;
  const content =
    CONTENT[status as keyof typeof CONTENT] ?? CONTENT.invalid;
  const Icon = content.icon;

  const actionHref =
    status === "expired" && email
      ? `/check-email?email=${encodeURIComponent(email)}`
      : content.action.href;

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <Icon className={`size-10 ${content.iconClassName}`} aria-hidden />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{content.title}</h1>
          <p className="text-sm text-muted-foreground">
            {content.description}
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href={actionHref}>{content.action.label}</Link>
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
