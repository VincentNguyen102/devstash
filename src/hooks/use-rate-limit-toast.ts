"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface RateLimitedState {
  rateLimited?: boolean;
  error?: string;
  message?: string;
}

/**
 * Surfaces a toast whenever a server action result reports that the request
 * was rate limited. Forms still render the message inline for accessibility.
 */
export function useRateLimitToast(state: RateLimitedState | null): void {
  useEffect(() => {
    if (!state?.rateLimited) {
      return;
    }

    toast.error(
      state.error ??
        state.message ??
        "Too many attempts. Please try again later.",
    );
  }, [state]);
}
