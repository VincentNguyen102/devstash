/**
 * Absolute base URL for links and redirects. Kept free of framework imports so
 * it can be used by billing, email and password-reset code alike.
 */
export function getAppUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  return (configured ?? "http://localhost:3000").replace(/\/+$/, "");
}
