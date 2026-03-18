import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendBanNotification(to: string, reason?: string) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping ban notification email");
    return;
  }

  try {
    await resend.emails.send({
      from: "Traverse Journal <noreply@traversejournal.com>",
      to,
      subject: "Your Traverse Journal account has been closed",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px;">
            Account Closed
          </h1>
          <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 16px;">
            Your Traverse Journal account associated with <strong>${to}</strong> has been closed by an administrator.
          </p>
          ${reason ? `
            <div style="background: #f8f8fc; border-left: 3px solid #6c63ff; padding: 12px 16px; margin-bottom: 16px; border-radius: 0 8px 8px 0;">
              <p style="font-size: 14px; color: #555; margin: 0;"><strong>Reason:</strong> ${reason}</p>
            </div>
          ` : ""}
          <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">
            If you believe this was a mistake, please contact us at
            <a href="mailto:support@traversejournal.com" style="color: #6c63ff; text-decoration: none;">support@traversejournal.com</a>.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 12px; color: #999;">
            Traverse Journal
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] Failed to send ban notification:", err);
  }
}
