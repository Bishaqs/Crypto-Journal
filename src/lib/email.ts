import { Resend } from "resend";
import { WaitlistConfirmation } from "@/emails/waitlist-confirmation";
import { WelcomeEmail } from "@/emails/welcome";
import { PasswordReset } from "@/emails/password-reset";
import { WeeklyDigest, type WeeklyDigestProps } from "@/emails/weekly-digest";
import { BanNotification } from "@/emails/ban-notification";
import { StreakRisk } from "@/emails/streak-risk";
import { LevelUp } from "@/emails/level-up";
import { AchievementUnlocked } from "@/emails/achievement-unlocked";
import { TrialExpired } from "@/emails/trial-expired";
import { QuizResults } from "@/emails/quiz-results";
import { NurtureDay3 } from "@/emails/nurture-day-3";
import { NurtureDay7 } from "@/emails/nurture-day-7";
import { NurtureDay10 } from "@/emails/nurture-day-10";
import { NurtureDay15 } from "@/emails/nurture-day-15";
import { QuizInvitation } from "@/emails/quiz-invitation";
import { ProtocolDelivery } from "@/emails/protocol-delivery";
import type { ArchetypeInfo } from "@/lib/psychology-scoring";

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
  referralCode: string,
  tierName: string = "Founding 100",
  discount: number = 50
) {
  const voteLink = `https://traversejournal.com/waitlist/vote?token=${accessToken}`;
  const referralLink = `https://traversejournal.com/?ref=${referralCode}`;
  const quizLink = `https://traversejournal.com/quiz?token=${accessToken}`;
  return send({
    to,
    subject: `Welcome to Traverse — You're #${position}, ${tierName}.`,
    react: WaitlistConfirmation({ position, voteLink, discountCode, referralLink, referralCode, quizLink, tierName, discount }),
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

export async function sendStreakRiskEmail(to: string, currentStreak: number) {
  return send({
    to,
    subject: `Your ${currentStreak}-day streak is at risk!`,
    react: StreakRisk({ currentStreak, dashboardLink: "https://traversejournal.com/dashboard" }),
    tags: [{ name: "category", value: "retention" }],
  });
}

export async function sendLevelUpEmail(to: string, newLevel: number, totalXp: number, unlockedFeature?: string) {
  return send({
    to,
    subject: `Level ${newLevel} unlocked!`,
    react: LevelUp({ newLevel, totalXp, unlockedFeature, dashboardLink: "https://traversejournal.com/dashboard" }),
    tags: [{ name: "category", value: "retention" }],
  });
}

export async function sendAchievementEmail(to: string, name: string, description: string, xpEarned: number) {
  return send({
    to,
    subject: `Achievement Unlocked: ${name}`,
    react: AchievementUnlocked({ achievementName: name, achievementDescription: description, xpEarned, dashboardLink: "https://traversejournal.com/dashboard/achievements" }),
    tags: [{ name: "category", value: "retention" }],
  });
}

export async function sendTrialExpiredEmail(to: string, trialTier: string) {
  return send({
    to,
    subject: "Your free trial has ended — upgrade to keep your features",
    react: TrialExpired({ trialTier, pricingLink: "https://traversejournal.com/pricing" }),
    tags: [{ name: "category", value: "monetization" }],
  });
}

export async function sendQuizResults(
  to: string,
  archetypeInfo: ArchetypeInfo,
  scores: Record<string, unknown>,
  unsubscribeUrl: string,
) {
  return send({
    to,
    subject: `Your Trading Psychology: ${archetypeInfo.name}`,
    react: QuizResults({ archetypeInfo, scores, unsubscribeUrl }),
    tags: [{ name: "category", value: "quiz" }],
  });
}

export async function sendNurtureEmail(
  to: string,
  dayIndex: number,
  archetype: string,
  scores: Record<string, unknown>,
  unsubscribeUrl: string,
  discountCode?: string,
): Promise<boolean> {
  const archetypeName = archetype.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  switch (dayIndex) {
    case 3:
      return send({
        to,
        subject: `What traders with your pattern struggle with most`,
        react: NurtureDay3({ archetypeName, archetype, scores, unsubscribeUrl }),
        tags: [{ name: "category", value: "nurture" }],
      });
    case 7:
      return send({
        to,
        subject: `3 techniques for ${archetypeName} traders`,
        react: NurtureDay7({ archetypeName, archetype, scores, unsubscribeUrl }),
        tags: [{ name: "category", value: "nurture" }],
      });
    case 10:
      return send({
        to,
        subject: "How Traverse tracks your psychology over time",
        react: NurtureDay10({ unsubscribeUrl }),
        tags: [{ name: "category", value: "nurture" }],
      });
    case 15:
      return send({
        to,
        subject: discountCode
          ? `Last chance: your discount code`
          : "Your trading psychology insights are waiting",
        react: NurtureDay15({ unsubscribeUrl, discountCode }),
        tags: [{ name: "category", value: "nurture" }],
      });
    default:
      return false;
  }
}

export async function sendQuizInvitation(
  to: string,
  accessToken: string,
  tierName: string,
  position: number,
  unsubscribeUrl: string,
): Promise<boolean> {
  const quizLink = `https://traversejournal.com/quiz?token=${accessToken}`;
  return send({
    to,
    subject: "Discover your trading psychology pattern (free)",
    react: QuizInvitation({ quizLink, tierName, position, unsubscribeUrl }),
    tags: [{ name: "category", value: "waitlist_nurture" }],
  });
}

export async function sendProtocolDelivery(
  to: string,
  quizResultId: string,
  unsubscribeToken: string,
  archetypeName: string,
  slideTitles: string[],
): Promise<boolean> {
  const protocolLink = `https://traversejournal.com/quiz/results?id=${quizResultId}&token=${unsubscribeToken}`;
  const cardImageUrl = `https://traversejournal.com/api/quiz/card/${quizResultId}`;
  return send({
    to,
    subject: `Your AI Psychology Protocol is ready`,
    react: ProtocolDelivery({ protocolLink, cardImageUrl, archetypeName, slideTitles, unsubscribeToken }),
    tags: [{ name: "category", value: "protocol" }],
  });
}
