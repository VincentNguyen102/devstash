# Authentication Security Audit

**Last Audit Date**: 2026-10-02
**Auditor**: Auth Security Agent
**Scope**: DevStash — Next.js 16 (App Router) + NextAuth v5 (Auth.js) + Prisma/Neon, credentials (bcryptjs) + GitHub OAuth, email via Resend.

## Executive Summary

The custom authentication code is thoughtfully written and gets the hard parts right: bcrypt at cost 12 in every password-setting path, cryptographically random 256-bit tokens that are only stored as SHA-256 hashes, server-side expiry (1h reset / 24h verification), single-use consumption, namespaced tokens so reset and verification flows cannot consume each other, and reset/resend endpoints that deliberately return identical messages to prevent enumeration. Server actions correctly derive identity from `session.user.id` rather than client input, and route protection is layered (`proxy.ts` + the `(dashboard)` layout re-check).

No authentication-bypass or account-takeover issue was found, and NextAuth-handled concerns (CSRF, cookie flags, OAuth state, JWT signing/encryption, callback-URL validation) were not re-reported. The real gaps are in what NextAuth does **not** cover: **there is no rate limiting on any auth entry point**, the **dashboard/sidebar read a hardcoded demo account while auth is now live**, **registration enumerates registered emails**, the **token single-use check is a non-atomic read-then-write**, and **password changes/resets do not invalidate existing JWT sessions**. Those, plus a handful of hardening items, are the backlog.

## Findings

### Critical Issues

None found.

### High Severity

#### 1. No rate limiting on any authentication entry point

**Severity**: High
**File**: `src/auth.ts`, `src/app/api/auth/register/route.ts`, `src/actions/password-reset.ts`, `src/actions/email-verification.ts`
**Line(s)**: `src/auth.ts:39-73`; `src/app/api/auth/register/route.ts:26-97`; `src/actions/password-reset.ts:33-75`; `src/actions/email-verification.ts:28-76`

**Vulnerable Code**:
```typescript
// src/auth.ts — authorize()
const user = await prisma.user.findUnique({ where: { email } });
if (!user?.password) {
  return null;
}
const passwordMatches = await compare(parsed.data.password, user.password);
if (!passwordMatches) {
  return null;   // unlimited guesses, no counter, no lockout
}
```

```typescript
// src/actions/password-reset.ts — no limiter before sending
const token = await createPasswordResetToken(email);
await sendPasswordResetEmail({ to: email, name: user.name, url: buildPasswordResetUrl(token) });
```

**Problem**: A full-repository search for any limiter (`rate-limit`, `ratelimit`, `upstash`, `redis`, `throttle`, `lockout`, `attempt`) returns **no application code** — only unrelated docs and a transitive `express-rate-limit` inside `package-lock.json`. Every auth-sensitive operation is unbounded:

- Credentials sign-in (`authorize`) — unlimited password guesses per account/IP.
- `POST /api/auth/register` — unlimited account creation (spam / resource exhaustion / bcrypt CPU).
- `requestPasswordReset` — unlimited reset emails to arbitrary addresses (email bombing + Resend quota/cost).
- `resendVerificationEmail` — unlimited verification emails to arbitrary addresses.

`changePassword` is also unrated, though it requires a valid session and the current password.

**Attack Scenario**: An attacker runs a credential-stuffing/brute-force list against `/sign-in`. Nothing throttles, delays, locks out, or alerts; bcrypt cost only slows the *server* (and, at high volume, constitutes a cheap CPU-exhaustion DoS of the credentials path). Separately, an attacker loops `requestPasswordReset` with a victim's address to mail-bomb them and exhaust the shared Resend sending quota, denying mail to real users.

**Fix**: Add a shared limiter and apply it per-IP **and** per-identifier (email) at every entry point. A DB- or Upstash-backed sliding window works on serverless; server actions can read the client IP via the `x-forwarded-for` header from `headers()`.

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "rl:auth",
});

export async function enforce(identifier: string) {
  const { success } = await limiter.limit(identifier);
  if (!success) throw new Error("Too many attempts. Try again later.");
}
```

```typescript
// src/auth.ts — inside authorize(), before the bcrypt compare
await enforce(`signin:${ip}:${email}`);
```

Use a separate, more generous limit keyed by IP **and** target address for the email-sending endpoints (register, reset request, resend verification).

#### 2. Dashboard and sidebar read a hardcoded demo account, not the signed-in user

**Severity**: High
**File**: `src/lib/db/collections.ts`, `src/lib/db/items.ts` (consumed by `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/collections/page.tsx`)
**Line(s)**: `src/lib/db/collections.ts:7`, used at `36`, `88-91`; `src/lib/db/items.ts:8`, used at `41`, `89-92`, `109`

**Vulnerable Code**:
```typescript
// src/lib/db/collections.ts:5-7 (src/lib/db/items.ts is identical)
// Auth is not wired up yet, so dashboard data is scoped to the seeded demo
// user. Replace this with the signed-in user once NextAuth is in place.
const DEMO_USER_EMAIL = "demo@devstash.io";
```

```typescript
// src/lib/db/collections.ts:35-37
const collections = await prisma.collection.findMany({
  where: { user: { email: DEMO_USER_EMAIL } },
  // ...
});
```

**Problem**: Both data-access modules scope **every** query to the constant `demo@devstash.io`. The comment claims "auth is not wired up yet", but auth **is** wired up: `src/auth.ts`, the edge-auth `src/proxy.ts`, and the `(dashboard)/layout.tsx` guard all authenticate the visitor first. Because `layout.tsx` then calls `getItemTypes()` / `getCollections()` (and `dashboard/page.tsx` calls `getRecentCollections` / `getPinnedItems` / `getRecentItems` / statistics), **every signed-in user is shown the demo account's items, collections, tags and stats**. There is no check tying a rendered row to `session.user.id`. This is a broken object-level authorization boundary and a data-isolation bug: the moment the demo account (or the queried rows) contain anything non-public, it is exposed to all authenticated users, and the pattern will silently leak real user data as accounts are added. The seed account also carries a weak, publicly-known password (see Low §3), so the "demo" principal is trivially sign-in-able.

**Attack Scenario**: Register any account, sign in, open `/dashboard` or `/collections` — you are served `demo@devstash.io`'s data. A normal user cannot tell whose data it is, and no query is scoped to their own `session.user.id`. Anyone who knows the seeded password can also authenticate directly as the demo principal.

**Fix**: Thread the authenticated user id into every query (like `getProfile(userId)` already does) and delete `DEMO_USER_EMAIL`:

```typescript
// src/lib/db/items.ts
import { auth } from "@/auth";

export async function getRecentItems(limit = 10) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.item.findMany({
    where: { userId: session.user.id }, // scope by the session, never a constant
    orderBy: { updatedAt: "desc" },
    take: limit,
    // ...
  });
}
```

Update `getCollections`, `getCollectionStats`, `getItemStats`, and `getItemTypes` the same way (prefer passing `userId` from the caller so the data layer stays testable).

### Medium Severity

#### 3. Registration endpoint enumerates registered emails

**Severity**: Medium
**File**: `src/app/api/auth/register/route.ts`
**Line(s)**: 44-51

**Vulnerable Code**:
```typescript
const existingUser = await prisma.user.findUnique({ where: { email } });

if (existingUser) {
  return NextResponse.json(
    { success: false, error: "An account with this email already exists" },
    { status: 409 },
  );
}
```

**Problem**: The endpoint returns a distinguishable `409` and an explicit message when the address already has an account. This directly contradicts the deliberate uniform-response design used by `requestPasswordReset` and `resendVerificationEmail` (`"If an account exists for that email, we've sent…"`). It lets an attacker enumerate which addresses have DevStash accounts. The same block is also a check-then-create race: two concurrent registrations for the same address both pass `findUnique`, and one hits the unique constraint, producing an unhandled `500`.

**Attack Scenario**: `POST /api/auth/register` with a list of addresses; `409` ⇒ registered, `201` ⇒ not registered. The harvested list feeds targeted phishing and credential stuffing.

**Fix**: Return a uniform response that does not reveal existence (optionally notify the real owner), and treat a `P2002` unique-constraint error as the duplicate case:

```typescript
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  // Do not reveal existence. Optionally email the real owner a heads-up.
  return NextResponse.json({ success: true }, { status: 200 });
}
```

#### 4. Token single-use is not atomic — read-then-write race allows replay

**Severity**: Medium
**File**: `src/lib/password-reset.ts`, `src/lib/email-verification.ts`
**Line(s)**: `src/lib/password-reset.ts:79-124` (esp. `83`, `113-121`); `src/lib/email-verification.ts:74-121` (esp. `77`, `110-118`)

**Vulnerable Code**:
```typescript
// src/lib/password-reset.ts
const record = await findResetToken(token);   // read — no lock / no claim
// ...checks...
const passwordHash = await hash(newPassword, BCRYPT_ROUNDS);

await prisma.$transaction([
  prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } }),
  prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }),
]);
```

**Problem**: Both flows `findFirst` the token, then consume it later with an **unconditional `deleteMany`** (keyed by `identifier`, not by the token) inside a transaction. The delete is never verified to have removed exactly one row (`count === 1`). Under PostgreSQL's default READ COMMITTED, two concurrent requests carrying the same link can both observe the record as valid before either transaction commits; both then update the target and both deletes vacuously succeed. The expiry check is likewise evaluated from the earlier, unlocked read. For password reset this means two password writes land (last-writer-wins) after the token was supposed to be spent; for verification a second request can still act within the window.

**Attack Scenario**: A reset link is exposed (shared inbox, forwarded mail, proxy access log, shoulder-surf). The attacker and victim submit near-simultaneously. Both pass validation; the attacker's chosen password can be the one that persists, or the link can be reused after consumption for the duration of the race window.

**Fix**: Claim the token atomically with a conditional delete and require `count === 1` **before** doing any user write:

```typescript
const claimed = await prisma.verificationToken.deleteMany({
  where: {
    token: hashToken(token),
    identifier: { startsWith: PASSWORD_RESET_IDENTIFIER_PREFIX },
    expires: { gt: new Date() },
  },
});

if (claimed.count !== 1) return "invalid"; // re-check separately to distinguish "expired"

// Only now update the password.
await prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } });
```

Apply the same conditional-delete pattern in `verifyEmailToken`.

#### 5. Existing JWT sessions survive a password change and a password reset

**Severity**: Medium
**File**: `src/auth.ts`, `src/actions/profile.ts`, `src/lib/password-reset.ts`
**Line(s)**: `src/auth.ts:29`, `76-85`; `src/actions/profile.ts:75-80`; `src/lib/password-reset.ts:111-121`

**Vulnerable Code**:
```typescript
// src/auth.ts
session: { strategy: "jwt" },
// ...
callbacks: {
  session({ session, token }) {
    if (token.sub) { session.user.id = token.sub; }
    return session;
  },
},
```

**Problem**: Sessions use the JWT strategy, so there is no `Session` row to delete and the JWT carries no revocation state. Neither `changePassword` nor `resetPasswordWithToken` invalidates existing tokens. A password change/reset — the canonical response to "my account was compromised" — leaves an attacker who holds a session cookie fully authenticated until the JWT naturally expires (default lifetime is long). Note that `changePassword` also does not detect reuse of the current password (see Low §5).

**Attack Scenario**: An attacker with a stolen session cookie retains full access to items, collections and the profile after the victim resets their password in response to the breach; nothing about the old JWT becomes invalid.

**Fix**: Record a password-change timestamp and reject tokens issued before it in the `jwt`/`session` callbacks:

```prisma
model User {
  // ...
  passwordChangedAt DateTime?
}
```

```typescript
// src/auth.ts — session callback
async session({ session, token }) {
  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { passwordChangedAt: true },
  });
  if (user?.passwordChangedAt && token.iat! * 1000 < user.passwordChangedAt.getTime()) {
    return null as never; // force re-authentication
  }
  session.user.id = token.sub!;
  return session;
},
```

Set `passwordChangedAt = new Date()` in both `changePassword` and `resetPasswordWithToken`. (Alternatively, switch to the database session strategy.)

#### 6. User enumeration through response timing

**Severity**: Medium
**File**: `src/auth.ts`, `src/actions/password-reset.ts`, `src/actions/email-verification.ts`
**Line(s)**: `src/auth.ts:47-56`; `src/actions/password-reset.ts:50-64`; `src/actions/email-verification.ts:52-67`

**Vulnerable Code**:
```typescript
// src/auth.ts
const user = await prisma.user.findUnique({ where: { email } });
if (!user?.password) {
  return null;                       // ~1 ms: no bcrypt work
}
const passwordMatches = await compare(parsed.data.password, user.password); // ~150-300 ms
```

```typescript
// src/actions/password-reset.ts — send only happens for existing credential accounts
if (user?.password) {
  const token = await createPasswordResetToken(email);
  await sendPasswordResetEmail({ ... }); // awaited network round-trip
}
return { success: true, data: { message } };
```

**Problem**: Three timing oracles leak account existence even though the error strings are generic:

1. **Sign-in**: unknown emails (and accounts with no password) return before the bcrypt compare. The response time separates "real credential account" from "unknown".
2. **Reset request**: the Resend network call is awaited only when the address maps to a password account, so existing accounts respond measurably slower.
3. **Resend verification**: identical shape.

**Attack Scenario**: An attacker submits batches of addresses and classifies them as registered vs. not from mean latency alone, defeating the intentionally uniform messages and feeding the same targeting pipeline as finding 3.

**Fix**: Equalise the work. In `authorize`, always run a bcrypt compare against a fixed dummy hash:

```typescript
const DUMMY_HASH = "$2a$12$................"; // real bcrypt hash of a random string
const user = await prisma.user.findUnique({ where: { email } });
const hashToCheck = user?.password ?? DUMMY_HASH;
const ok = await compare(parsed.data.password, hashToCheck);
if (!user?.password || !ok) return null;
```

For the email-request endpoints, do not `await` the send on the request path (queue it / fire-and-forget with error capture) so both branches return at the same time.

#### 7. No maximum password length — bcrypt silently truncates at 72 bytes

**Severity**: Medium
**File**: `src/lib/validations/password.ts`
**Line(s)**: 23-25 (`passwordField`), also reflected in the client `minLength` attributes

**Vulnerable Code**:
```typescript
export const PASSWORD_MIN_LENGTH = 8;

export const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE);
```

**Problem**: `passwordField` enforces only a minimum. bcrypt (and bcryptjs) hashes only the first 72 bytes, so two distinct passphrases differing only after byte 72 are the **same** password. This is a correctness trap for users who choose long passphrases and a small, unnecessary resource cost (there is no upper bound at all). The sign-in `requiredPasswordField` being length-free is fine; the *setting* paths (register, reset, change) should cap the value and mirror it in the form inputs.

**Attack Scenario**: A user sets a long passphrase believing every character matters; anyone who learns the first 72 bytes can authenticate with any suffix. Separately, unbounded password inputs can be used as cheap server-side memory/CPU work.

**Fix**:
```typescript
export const PASSWORD_MAX_LENGTH = 72;
export const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
```
Add `maxLength={72}` to the register/reset/change password inputs.

#### 8. Silent `localhost` fallback for the app URL can leak or break token links

**Severity**: Medium
**File**: `src/lib/email-verification.ts`
**Line(s)**: 31-38 (used by `buildVerificationUrl` and `buildPasswordResetUrl`)

**Vulnerable Code**:
```typescript
export function getAppUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  return (configured ?? "http://localhost:3000").replace(/\/+$/, "");
}
```

**Problem**: When `NEXT_PUBLIC_APP_URL`, `AUTH_URL` and `VERCEL_URL` are all unset, reset and verification emails are built with `http://localhost:3000`. In a self-hosted or misconfigured production deploy this silently mails bearer tokens pointing at localhost instead of failing loudly. There is no production guard, and `.env.example` lists `NEXT_PUBLIC_APP_URL` as optional/absent, so this is easy to hit.

**Attack Scenario**: A production deploy missing the env var sends reset links to `http://localhost:3000/reset-password?token=…`. The flow is broken, and if any service later runs on localhost (or the token is harvested from a log/redirect), the reset token is exposed. The failure mode is a confusing partial success rather than an error.

**Fix**: Require the URL in production and fail fast:
```typescript
if (!configured) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL (or AUTH_URL) must be set in production.");
  }
  return "http://localhost:3000";
}
```

### Low Severity

#### 9. Account deletion requires no re-authentication

**Severity**: Low
**File**: `src/actions/profile.ts`
**Line(s)**: 103-121

**Vulnerable Code**:
```typescript
export async function deleteAccount(): Promise<DeleteAccountState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that." };
  }
  try {
    await prisma.user.delete({ where: { id: session.user.id } });
  }
  // ...
}
```

**Problem**: Unlike `changePassword`, which verifies the current password, `deleteAccount` only checks for a session and then permanently deletes the user (cascading all items, collections and tags). The confirmation dialog is client-side only; the server action will delete for any request bearing a valid session. Next.js Server Actions mitigate classic CSRF (origin-checked POSTs), but this still means an XSS payload, a malicious extension, or a shared/unlocked device can irreversibly destroy the account without proving knowledge of the password.

**Attack Scenario**: A user leaves a tab open on a shared device; a script invokes the server action and the account and all its data are permanently gone.

**Fix**: Require the current password (or a fresh re-auth) for credential accounts, mirroring `changePassword`; for GitHub-only accounts require a recent sign-in.

```typescript
const parsed = z.object({ password: z.string().min(1) }).safeParse({
  password: formData.get("password"),
});
if (!parsed.success) return { success: false, error: "Password required." };

const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { password: true },
});
if (user?.password && !(await compare(parsed.data.password, user.password))) {
  return { success: false, error: "Your password is incorrect." };
}
```

#### 10. Unescaped user name injected into transactional email HTML

**Severity**: Low
**File**: `src/lib/email.ts`
**Line(s)**: 86, 109, 132

**Vulnerable Code**:
```typescript
// src/lib/email.ts:86
<p ...>${greeting}</p>
```
```typescript
// src/lib/email.ts:109 / 132
const greeting = name ? `Hi ${name},` : "Hi there,";
```

**Problem**: The user-controlled `name` is interpolated directly into the email HTML with no escaping. It is validated only as `z.string().trim().min(1)` in the register schema (`src/app/api/auth/register/route.ts:19`), so it can contain markup.

**Attack Scenario**: Register with the name `</p><a href="https://evil.example">Click to restore your account</a><p>`. The verification/reset email then renders attacker-controlled markup and links under the legitimate Resend sending domain — effective phishing that survives basic link scanning. Script execution is generally blocked by mail clients, but layout and links are not.

**Fix**: HTML-escape any interpolated user data before it reaches `emailShell`:
```typescript
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );

const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi there,";
```

#### 11. Weak, publicly-known password on the seeded demo credential account

**Severity**: Low
**File**: `prisma/seed.ts`
**Line(s)**: 23-28, 414-432

**Vulnerable Code**:
```typescript
const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
  isPro: false,
};
```
```typescript
const password = await hash(DEMO_USER.password, 12);
return prisma.user.upsert({ where: { email: DEMO_USER.email }, /* ... */ });
```

**Problem**: The seed creates a verified credential account with the well-known password `12345678`. Seeding is manual (`npm run db:seed`) and the script is not environment-gated, so running it against a production database creates a trivially guessable account. This compounds finding 2: the same demo principal is the one whose data the live dashboard serves.

**Attack Scenario**: If the seed has been run in production, an attacker signs in as `demo@devstash.io` / `12345678` (the account is `emailVerified`, so no further step is needed).

**Fix**: Generate a random password at seed time (print it once), and refuse to run the seed when `NODE_ENV === "production"` unless an explicit override is set:
```typescript
if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error("Refusing to seed the demo account in production.");
}
const password = randomBytes(24).toString("base64url");
```

#### 12. Tokens travel in URL query strings; verification consumes on GET

**Severity**: Low
**File**: `src/lib/email-verification.ts`, `src/app/api/auth/verify-email/route.ts`, `src/lib/password-reset.ts`, `src/app/reset-password/page.tsx`
**Line(s)**: `src/lib/email-verification.ts:67`; `src/app/api/auth/verify-email/route.ts:9-34`; `src/lib/password-reset.ts:59`

**Problem**: Both links embed the raw token as `?token=…`. Query strings are recorded in browser history, server/proxy access logs, and can leak via `Referer` when the page loads a third-party resource. Additionally, `/api/auth/verify-email` **consumes** the verification token on `GET`, so email-security scanners and link prefetchers that fetch the URL can burn the token before the user clicks (the user then sees "invalid" despite being verified). The reset flow is safer here: `reset-password/page.tsx` only performs a read-only validity check on GET and consumes the token on form POST via the server action.

**Attack Scenario**: A token ends up in an access log or shared analytics referrer; anyone with log access can replay it within the 1h/24h window if it has not yet been consumed. An automated mail scanner can consume a verification token out from under the user.

**Fix**: Keep the email-link pattern, but harden it: set `Referrer-Policy: no-referrer` and `Cache-Control: no-store` on token-bearing responses, strip query strings from access logs for these paths, and avoid state-changing GETs (require a POST/button confirmation before consuming the verification token).

#### 13. Password change allows reusing the current password

**Severity**: Low
**File**: `src/actions/profile.ts`
**Line(s)**: 69-80

**Problem**: The new password is hashed and stored without checking that it differs from the current one. A user who "changes" their password to the same value gets a false sense of remediation — particularly relevant once finding 5's session-invalidation fix is added, since other sessions would need to be invalidated even when the value is unchanged.

**Fix**: Reject a new password identical to the current one before hashing:
```typescript
if (await compare(parsed.data.newPassword, user.password)) {
  return { success: false, error: "Choose a password you haven't used here before." };
}
```

#### 14. `trustHost: true` should be a consciously managed deployment setting

**Severity**: Low
**File**: `src/auth.config.ts`
**Line(s)**: 8-10

**Vulnerable Code**:
```typescript
export default {
  // Trust the host header. Auth.js enables this automatically on Vercel, but
  // it is required when running the production server locally or self-hosting.
  trustHost: true,
  // ...
} satisfies NextAuthConfig;
```

**Problem**: This is **not a bug** — the comment is correct and Auth.js needs it for the self-hosted/local production server. It does mean Auth.js derives redirect/callback origins from the incoming `Host`/`X-Forwarded-Host` header. If the app is ever placed behind a proxy that does not overwrite a client-supplied `X-Forwarded-Host`, redirect/callback URLs can be influenced. NextAuth's default `redirect` callback still restricts `callbackUrl` to same-origin URLs, so this is a defence-in-depth note rather than an exploitable open redirect.

**Fix**: Keep it, but ensure the deployment terminates TLS at a proxy that sets/overwrites `Host` and `X-Forwarded-Host` (Vercel/standard load balancers do), and make the setting explicit via an env flag so production is auditable.

## Passed Checks

- **Strong password hashing**: bcrypt cost 12 in every setting path (`src/app/api/auth/register/route.ts:53`, `src/actions/profile.ts:13,75`, `src/lib/password-reset.ts:13,111`), verified with `bcryptjs.compare`.
- **No plaintext password exposure**: passwords are never logged, returned to the client, or placed in the JWT. Registration returns only `id`/`name`/`email`; `getProfile` selects `password` only to compute a boolean `hasPassword` (`src/lib/db/profile.ts:48,86`).
- **High-entropy tokens**: generated with `crypto.randomBytes(32)` (256 bits, `src/lib/tokens.ts:9-11`); only the **SHA-256 hash** is stored.
- **Server-side expiry**: 24h for verification, **1h** for reset, enforced from the stored `expires` value.
- **Fresh-issue invalidation**: creating a new token deletes all outstanding tokens for that identifier first, so only the newest link works.
- **Flow namespacing**: `PASSWORD_RESET_IDENTIFIER_PREFIX` prevents a reset token being accepted as a verification token and vice versa (`src/lib/email-verification.ts:80-82`, `src/lib/password-reset.ts:17-31`).
- **Anti-enumeration on reset/resend**: identical messages regardless of account existence, and action only for credential accounts.
- **Server actions trust the session, not input**: `changePassword` and `deleteAccount` use `session.user.id` (`src/actions/profile.ts:36-40,104-111`); the profile page calls `getProfile(session.user.id)`.
- **`changePassword` verifies the current password** and refuses password-less (GitHub-only) accounts.
- **Layered route protection**: `proxy.ts` guards `/dashboard`, `/collections`, `/items`, `/profile`, and the `(dashboard)` layout independently re-checks the session.
- **Email verification fails safe**: enabled by default (opt-out), so a missing env var keeps verification on rather than silently disabling it.
- **Deleted/unverified accounts handled**: tokens for users that no longer exist are purged, and a session whose user was deleted redirects to sign-in.
- **Secrets hygiene**: no hardcoded `AUTH_SECRET`; `.env*` is gitignored while `.env.example` is committed; dev-only email-link logging is gated on `NODE_ENV !== "production"` and throws in production.
- **NextAuth-handled concerns** (CSRF, secure cookie flags, OAuth state, JWT signing/encryption, callback-URL origin validation) were **not** re-reported.

## Recommendations Summary

Prioritised, most critical first:

1. **Rate limit every auth entry point** — sign-in, register, password-reset request, reset submit, resend verification — keyed per-IP **and** per-account. *(Finding 1)*
2. **Scope all dashboard/sidebar queries to `session.user.id`** and delete `DEMO_USER_EMAIL`. *(Finding 2)*
3. **Stop enumerating emails at registration** — return a uniform response and handle the `P2002` race. *(Finding 3)*
4. **Make token consumption atomic** — conditional `deleteMany … count === 1` before writing the user. *(Finding 4)*
5. **Invalidate existing sessions on password change/reset** via a `passwordChangedAt` claim. *(Finding 5)*
6. **Equalise response timing** on sign-in (dummy bcrypt compare) and on the email-request endpoints. *(Finding 6)*
7. **Cap password length at 72 bytes** in the shared validation module and form inputs. *(Finding 7)*
8. **Fail fast on a missing app URL in production** instead of falling back to localhost. *(Finding 8)*
9. Require re-authentication for account deletion. *(Finding 9)*
10. Escape user-controlled values in email HTML. *(Finding 10)*
11. Remove the weak demo seed password and gate seeding out of production. *(Finding 11)*
12. Harden token URLs (`Referrer-Policy: no-referrer`, `Cache-Control: no-store`) and avoid state-changing GETs. *(Finding 12)*
13. Reject reusing the current password on change. *(Finding 13)*
14. Keep `trustHost` but ensure the edge proxy overwrites `Host`/`X-Forwarded-Host`. *(Finding 14)*
