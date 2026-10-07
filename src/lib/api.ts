import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { rateLimitMessage } from "@/lib/rate-limit";

/** Shared JSON error body for route handlers. */
export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Standard 401 response for unauthenticated route handler calls. */
export function unauthorized(message = "You must be signed in."): NextResponse {
  return jsonError(message, 401);
}

/** 429 response carrying the `Retry-After` header for rate-limited requests. */
export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { success: false, error: rateLimitMessage(retryAfterSeconds) },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

/** The signed-in user's id, or null when there is no session. */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();

  return session?.user?.id ?? null;
}
