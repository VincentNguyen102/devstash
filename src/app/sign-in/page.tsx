import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const { callbackUrl, error, reset } = await props.searchParams;

  return (
    <AuthShell actions={["get-started"]}>
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Sign in to DevStash</h1>
        <p className="text-sm text-muted-foreground">Welcome back.</p>
      </div>

      {reset === "success" ? (
        <p
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-500"
        >
          Password updated. Sign in with your new password.
        </p>
      ) : null}

      <SignInForm
        callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined}
        error={typeof error === "string" ? error : undefined}
      />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
