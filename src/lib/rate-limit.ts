import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Central rate-limit definitions for the auth flows. Each entry maps to one
 * `Ratelimit` instance (and therefore one Redis key namespace), so limits do
 * not bleed between endpoints.
 *
 * Windows use the `@upstash/ratelimit` duration format (e.g. "15 m", "1 h").
 */
const LIMITERS = {
  login: { tokens: 5, window: "15 m" },
  register: { tokens: 3, window: "1 h" },
  forgotPassword: { tokens: 3, window: "1 h" },
  resetPassword: { tokens: 5, window: "15 m" },
  resendVerification: { tokens: 3, window: "15 m" },
} as const satisfies Record<
  string,
  { tokens: number; window: `${number} ${"s" | "m" | "h" | "d"}` }
>;

export type RateLimitName = keyof typeof LIMITERS;

export interface RateLimitResult {
  /** Whether the request may proceed. */
  success: boolean;
  /** Requests left within the current window. */
  remaining: number;
  /** Unix timestamp in milliseconds when the window resets. */
  reset: number;
  /** Seconds until the window resets; `0` when the request is allowed. */
  retryAfterSeconds: number;
}

// Keep one client/limiter per process instead of rebuilding them per check.
const instances = new Map<RateLimitName, Ratelimit>();

function isConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getLimiter(name: RateLimitName): Ratelimit | null {
  if (!isConfigured()) {
    return null;
  }

  const cached = instances.get(name);
  if (cached) {
    return cached;
  }

  const { tokens, window } = LIMITERS[name];
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `devstash:ratelimit:${name}`,
  });

  instances.set(name, limiter);

  return limiter;
}

function allowed(name: RateLimitName): RateLimitResult {
  return {
    success: true,
    remaining: LIMITERS[name].tokens,
    reset: 0,
    retryAfterSeconds: 0,
  };
}

/**
 * Checks a named rate limit for an identifier. Fails open — when Upstash is
 * not configured, or a check errors/times out, the request is allowed so a
 * Redis outage never locks users out of their account.
 */
export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);

  if (!limiter) {
    return allowed(name);
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);

    return {
      success,
      remaining,
      reset,
      retryAfterSeconds: success
        ? 0
        : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (error) {
    console.error(`Rate limit check failed (${name})`, error);

    return allowed(name);
  }
}

/** Extracts the client IP from a headers object, preferring proxy headers. */
export function getClientIpFrom(headerList: Headers): string {
  const forwardedFor = headerList.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();

  return (
    firstForwarded ||
    headerList.get("x-real-ip") ||
    headerList.get("cf-connecting-ip") ||
    "unknown"
  );
}

/** Client IP for the current request (server actions, route handlers). */
export async function getClientIp(): Promise<string> {
  return getClientIpFrom(await headers());
}

/** Joins the parts of a limiter key, skipping empty values. */
export function rateLimitKey(
  ...parts: (string | null | undefined)[]
): string {
  return parts
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.trim().toLowerCase())
    .join(":");
}

/** User-facing message for a blocked request. */
export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return `Too many attempts. Please try again in ${minutes} minute${
    minutes === 1 ? "" : "s"
  }.`;
}
