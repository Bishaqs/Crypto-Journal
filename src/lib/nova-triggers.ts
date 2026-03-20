import { Trade } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";

export type NovaNudge = {
  id: string;
  type:
    | "loss_streak"
    | "big_move"
    | "revenge_pattern"
    | "declining_process"
    | "no_journal"
    | "weekly_review"
    | "morning_checkin";
  priority: number;
  message: string;
  cta: string;
  ctaLink: string;
};

/** Analyze recent trades for proactive coaching triggers. */
export function detectTradeNudges(trades: Trade[]): NovaNudge[] {
  const nudges: NovaNudge[] = [];
  const closed = trades
    .filter((t) => t.close_timestamp !== null)
    .sort((a, b) => (b.close_timestamp ?? "").localeCompare(a.close_timestamp ?? ""));

  if (closed.length < 2) return nudges;

  // 1. Loss streak (3+ consecutive losses)
  let lossStreak = 0;
  for (const t of closed) {
    const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
    if (pnl < 0) lossStreak++;
    else break;
  }
  if (lossStreak >= 3) {
    nudges.push({
      id: `loss-streak-${lossStreak}`,
      type: "loss_streak",
      priority: 1,
      message: `That's ${lossStreak} losses in a row. Want to talk about what's happening?`,
      cta: "Talk to Nova",
      ctaLink: "/dashboard/ai",
    });
  }

  // 2. Big move (latest trade P&L > 2x average absolute P&L)
  const pnls = closed.slice(0, 20).map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
  const avgAbsPnl = pnls.reduce((s, p) => s + Math.abs(p), 0) / pnls.length;
  const latestPnl = pnls[0] ?? 0;
  if (avgAbsPnl > 0 && Math.abs(latestPnl) > avgAbsPnl * 2) {
    const symbol = closed[0].symbol;
    nudges.push({
      id: `big-move-${symbol}`,
      type: "big_move",
      priority: 2,
      message: latestPnl > 0
        ? `Big win on ${symbol}! Let's debrief before the next trade.`
        : `Tough loss on ${symbol}. Let's figure out what happened.`,
      cta: "Debrief with Nova",
      ctaLink: "/dashboard/ai",
    });
  }

  // 3. Revenge pattern (entry within 30 min of a loss)
  if (closed.length >= 2 && lossStreak < 3) {
    const latest = closed[0];
    const prev = closed[1];
    const prevPnl = prev.pnl ?? calculateTradePnl(prev) ?? 0;
    if (prevPnl < 0 && latest.open_timestamp && prev.close_timestamp) {
      const gap = new Date(latest.open_timestamp).getTime() - new Date(prev.close_timestamp).getTime();
      if (gap >= 0 && gap < 30 * 60 * 1000) {
        nudges.push({
          id: "revenge-pattern",
          type: "revenge_pattern",
          priority: 1,
          message: "This looks like a revenge entry. Take a breath?",
          cta: "Talk to Nova",
          ctaLink: "/dashboard/ai",
        });
      }
    }
  }

  // 4. Declining process scores (last 5 vs overall average)
  const withProcess = closed.filter((t) => t.process_score != null);
  if (withProcess.length >= 10) {
    const recent5 = withProcess.slice(0, 5);
    const recentAvg = recent5.reduce((s, t) => s + (t.process_score ?? 0), 0) / 5;
    const overallAvg = withProcess.reduce((s, t) => s + (t.process_score ?? 0), 0) / withProcess.length;
    if (recentAvg < overallAvg - 1) {
      nudges.push({
        id: "declining-process",
        type: "declining_process",
        priority: 3,
        message: `Your discipline is slipping (${recentAvg.toFixed(1)} vs ${overallAvg.toFixed(1)} avg). Let's figure out why.`,
        cta: "Talk to Nova",
        ctaLink: "/dashboard/ai",
      });
    }
  }

  return nudges.sort((a, b) => a.priority - b.priority);
}

/** Check time-based triggers (journal, check-in, weekly review). */
export function detectTimeNudges(
  hasJournaledToday: boolean,
  hasCheckedInToday: boolean
): NovaNudge[] {
  const nudges: NovaNudge[] = [];
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun, 1=Mon

  // Morning check-in reminder (before noon, not checked in)
  if (hour < 12 && !hasCheckedInToday) {
    nudges.push({
      id: "morning-checkin",
      type: "morning_checkin",
      priority: 5,
      message: "Morning check-in: How are you feeling about today's session?",
      cta: "Check In",
      ctaLink: "/dashboard/psychology",
    });
  }

  // Journal nudge (after 2pm, haven't journaled)
  if (hour >= 14 && !hasJournaledToday) {
    nudges.push({
      id: "no-journal",
      type: "no_journal",
      priority: 6,
      message: "You haven't journaled today. Even a quick note helps.",
      cta: "Open Journal",
      ctaLink: "/dashboard/journal",
    });
  }

  // Weekly review (Sunday or Monday)
  if (day === 0 || day === 1) {
    nudges.push({
      id: "weekly-review",
      type: "weekly_review",
      priority: 7,
      message: "Your weekly review is ready. Reflect on the past week's performance.",
      cta: "View Report",
      ctaLink: "/dashboard/reports",
    });
  }

  return nudges;
}
