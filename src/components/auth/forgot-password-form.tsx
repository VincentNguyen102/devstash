"use client";

import { useActionState } from "react";

import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_STATE: ForgotPasswordState | null = null;

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    INITIAL_STATE,
  );

  const message = state?.success ? state.data?.message : state?.error;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      {message ? (
        <p
          role={state?.success ? "status" : "alert"}
          className={
            state?.success
              ? "text-sm text-emerald-500"
              : "text-sm text-destructive"
          }
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
