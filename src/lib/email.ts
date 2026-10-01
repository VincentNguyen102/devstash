import { Resend } from "resend";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Logged in development when the message cannot be sent. */
  devFallbackLink: string;
}

/**
 * Sends a transactional email through Resend.
 *
 * When mail cannot be delivered — missing API key, or Resend rejecting the
 * send (e.g. test mode) — development logs the link so flows stay testable
 * locally, while production treats it as an error.
 */
async function sendEmail({
  to,
  subject,
  html,
  devFallbackLink,
}: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "DevStash <onboarding@resend.dev>";
  const isDev = process.env.NODE_ENV !== "production";

  if (!apiKey) {
    if (isDev) {
      console.warn(
        `[email] RESEND_API_KEY is not set — skipping send to ${to}. Link: ${devFallbackLink}`,
      );
      return;
    }

    throw new Error("RESEND_API_KEY is not set.");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    if (isDev) {
      console.warn(
        `[email] Failed to send to ${to} (${error.message}). Link: ${devFallbackLink}`,
      );
      return;
    }

    throw new Error(`Failed to send email: ${error.message}`);
  }
}

interface SendLinkEmailParams {
  to: string;
  name?: string | null;
  url: string;
}

function emailShell({
  heading,
  greeting,
  body,
  ctaLabel,
  url,
  footer,
}: {
  heading: string;
  greeting: string;
  body: string;
  ctaLabel: string;
  url: string;
  footer: string;
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#0a0a0a;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#fafafa;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#171717;border:1px solid #262626;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#fafafa;">${heading}</h1>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#a3a3a3;">${greeting}</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a3a3a3;">${body}</p>
                <a href="${url}" style="display:inline-block;background:#fafafa;color:#0a0a0a;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">${ctaLabel}</a>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#737373;">
                  If the button doesn't work, copy and paste this link into your browser:<br />
                  <a href="${url}" style="color:#a3a3a3;word-break:break-all;">${url}</a>
                </p>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#737373;">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail({
  to,
  name,
  url,
}: SendLinkEmailParams): Promise<void> {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  await sendEmail({
    to,
    subject: "Verify your DevStash email",
    devFallbackLink: url,
    html: emailShell({
      heading: "Verify your email",
      greeting,
      body: "Thanks for signing up for DevStash. Confirm your email address by clicking the button below. This link expires in 24 hours.",
      ctaLabel: "Verify email",
      url,
      footer:
        "If you didn't create a DevStash account, you can safely ignore this email.",
    }),
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  url,
}: SendLinkEmailParams): Promise<void> {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  await sendEmail({
    to,
    subject: "Reset your DevStash password",
    devFallbackLink: url,
    html: emailShell({
      heading: "Reset your password",
      greeting,
      body: "We received a request to reset your DevStash password. Click the button below to choose a new one. This link expires in 1 hour.",
      ctaLabel: "Reset password",
      url,
      footer:
        "If you didn't request a password reset, you can safely ignore this email — your password won't change.",
    }),
  });
}
