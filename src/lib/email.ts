import { Resend } from "resend";
import { WaitlistConfirmation } from "@/emails/waitlist-confirmation";
import { WelcomeEmail } from "@/emails/welcome";
import { PasswordReset } from "@/emails/password-reset";
import { WeeklyDigest, type WeeklyDigestProps } from "@/emails/weekly-digest";
import { BanNotification } from "@/emails/ban-notification";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "Traverse Journal <noreply@traversejournal.com>";

async function send(options: {
  to: string;
  subject: string;
  react: React.ReactElement;
  tags?: { name: string; value: string }[];
}): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      ...options,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}

export async function sendBanNotification(to: string, reason?: string) {
  return send({
    to,
    subject: "Your Traverse Journal account has been closed",
    react: BanNotification({ email: to, reason }),
    tags: [{ name: "category", value: "admin" }],
  });
}

export async function sendWaitlistConfirmation(
  to: string,
  position: number,
  accessToken: string,
  discountCode: string,
  referralCode: string
) {
  const voteLink = `https://traversejournal.com/waitlist/vote?token=${accessToken}`;
  const referralLink = `https://traversejournal.com/?ref=${referralCode}`;
  return send({
    to,
    subject: `Welcome to Traverse. You're #${position} of 100.`,
    react: WaitlistConfirmation({ position, voteLink, discountCode, referralLink, referralCode }),
    tags: [{ name: "category", value: "waitlist" }],
  });
}

export async function sendWelcomeEmail(to: string, name?: string) {
  return send({
    to,
    subject: "Welcome to Traverse Journal",
    react: WelcomeEmail({ name }),
    tags: [{ name: "category", value: "onboarding" }],
  });
}

export async function sendPasswordReset(to: string, resetLink: string) {
  return send({
    to,
    subject: "Reset your Traverse Journal password",
    react: PasswordReset({ resetLink }),
    tags: [{ name: "category", value: "auth" }],
  });
}

export async function sendWeeklyDigest(
  to: string,
  data: Omit<WeeklyDigestProps, "dashboardLink" | "unsubscribeUrl">,
  unsubscribeUrl?: string
) {
  return send({
    to,
    subject: `Your week: ${data.totalPnl >= 0 ? "+" : ""}$${data.totalPnl.toFixed(2)} across ${data.tradeCount} trades`,
    react: WeeklyDigest({
      ...data,
      dashboardLink: "https://traversejournal.com/dashboard/reports",
      unsubscribeUrl,
    }),
    tags: [{ name: "category", value: "digest" }],
  });
}
