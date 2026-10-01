import { Resend } from "resend";

interface SendVerificationEmailParams {
  to: string;
  name?: string | null;
  url: string;
}

function verificationEmailHtml({
  name,
  url,
}: {
  name?: string | null;
  url: string;
}): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#0a0a0a;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#fafafa;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#171717;border:1px solid #262626;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#fafafa;">Verify your email</h1>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#a3a3a3;">${greeting}</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a3a3a3;">
                  Thanks for signing up for DevStash. Confirm your email address by clicking the button below. This link expires in 24 hours.
                </p>
                <a href="${url}" style="display:inline-block;background:#fafafa;color:#0a0a0a;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">Verify email</a>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#737373;">
                  If the button doesn't work, copy and paste this link into your browser:<br />
                  <a href="${url}" style="color:#a3a3a3;word-break:break-all;">${url}</a>
                </p>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#737373;">
                  If you didn't create a DevStash account, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Sends the email-verification link through Resend.
 *
 * When `RESEND_API_KEY` is missing we cannot deliver mail. In development we
 * log the link instead so the flow can still be completed locally; in
 * production a missing key is treated as an error.
 */
export async function sendVerificationEmail({
  to,
  name,
  url,
}: SendVerificationEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "DevStash <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[email] RESEND_API_KEY is not set — skipping send. Verification link for ${to}: ${url}`,
      );
      return;
    }

    throw new Error("RESEND_API_KEY is not set.");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Verify your DevStash email",
    html: verificationEmailHtml({ name, url }),
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
