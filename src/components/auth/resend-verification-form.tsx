"use client";

import { useActionState } from "react";

import {
  resendVerificationEmail,
  type ResendVerificationState,
} from "@/actions/email-verification";
import { useRateLimitToast } from "@/components/auth/use-rate-limit-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ResendVerificationFormProps {
  defaultEmail?: string;
}

const INITIAL_STATE: ResendVerificationState | null = null;

export function ResendVerificationForm({
  defaultEmail,
}: ResendVerificationFormProps) {
  const [state, formAction, isPending] = useActionState(
    resendVerificationEmail,
    INITIAL_STATE,
  );

  useRateLimitToast(state);

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
          defaultValue={defaultEmail}
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
        {isPending ? "Sending..." : "Send verification link"}
      </Button>
    </form>
  );
}
