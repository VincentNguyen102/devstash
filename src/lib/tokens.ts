import { createHash, randomBytes } from "node:crypto";

// Password-reset tokens share the Auth.js `VerificationToken` table with
// email-verification tokens, so they are namespaced to keep the two flows
// from colliding or consuming each other.
export const PASSWORD_RESET_IDENTIFIER_PREFIX = "password-reset:";

/** Generates a cryptographically random, URL-safe opaque token. */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Only the hash of an opaque token is ever stored or logged. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
