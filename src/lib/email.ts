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

export async function sendWaitlistConfirmation(
  to: string,
  position: number,
  accessToken: string,
  discountCode: string
) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping waitlist confirmation email");
    return;
  }

  const voteLink = `https://traversejournal.com/waitlist/vote?token=${accessToken}`;

  try {
    await resend.emails.send({
      from: "Traverse Journal <noreply@traversejournal.com>",
      to,
      subject: `Welcome to Traverse. You're #${position} of 100.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 0; background: #0a0a0c;">
          <div style="padding: 48px 32px; text-align: center;">
            <div style="display: inline-block; background: rgba(103,232,249,0.1); border: 1px solid rgba(103,232,249,0.2); border-radius: 999px; padding: 6px 16px; margin-bottom: 24px;">
              <span style="font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #67e8f9;">Early Access</span>
            </div>

            <h1 style="font-size: 36px; font-weight: 600; color: #f4f4f5; margin: 0 0 8px 0; letter-spacing: -0.02em;">
              You're in.
            </h1>
            <p style="font-size: 20px; color: #67e8f9; font-weight: 600; margin: 0 0 16px 0;">
              You are #${position} out of 100 early adopters.
            </p>
            <p style="font-size: 16px; color: rgba(244,244,245,0.6); margin: 0 0 32px 0; line-height: 1.6;">
              We're building Traverse because traders are blind to the actual cost of their emotional leaks. You now have a front-row seat to fixing that.
            </p>

            <div style="background: rgba(103,232,249,0.05); border: 1px solid rgba(103,232,249,0.15); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: left;">
              <div style="margin-bottom: 16px;">
                <span style="font-size: 13px; color: rgba(244,244,245,0.5); text-transform: uppercase; letter-spacing: 0.1em;">Your discount code</span>
                <div style="font-family: monospace; font-size: 22px; font-weight: 700; color: #67e8f9; margin-top: 4px; letter-spacing: 0.05em;">${discountCode}</div>
              </div>
              <p style="font-size: 14px; color: rgba(244,244,245,0.5); margin: 0; line-height: 1.5;">
                Keep this safe. This code automatically activates your 50% discount when our paid tiers launch.
              </p>
            </div>

            <div style="background: rgba(244,244,245,0.03); border: 1px solid rgba(244,244,245,0.08); border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: left;">
              <p style="font-size: 15px; font-weight: 600; color: #f4f4f5; margin: 0 0 8px 0;">Shape the Product</p>
              <p style="font-size: 14px; color: rgba(244,244,245,0.5); margin: 0 0 16px 0; line-height: 1.5;">
                As part of the first 100, you have voting rights. You decide what we build next. We've compiled a list of initial features ranging from automated broker syncs to tilt-alerts. Review the proposals and cast your votes.
              </p>
              <a href="${voteLink}" style="display: inline-block; background: #67e8f9; color: #0a0a0c; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 999px; text-decoration: none;">
                Vote on Features
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid rgba(244,244,245,0.08); margin: 24px 0;" />
            <p style="font-size: 12px; color: rgba(244,244,245,0.3);">
              Traverse Journal — The trading journal that connects your psychology to your P&L.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] Failed to send waitlist confirmation:", err);
  }
}
