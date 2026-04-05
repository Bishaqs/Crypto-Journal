import { Trade, TradingRule } from "./types";
import { detectTiltSignals, type TiltSignal } from "./calculations";
import { evaluateAllRules, type RuleCheckResult } from "./rules-engine";
import { MINI_ARCHETYPES, type MiniArchetype } from "./mini-quiz-archetypes";

export type PostSyncAlertType =
  | "tilt_pattern"
  | "overtrade"
  | "loss_streak"
  | "rule_violation"
  | "revenge_trade";

export type PostSyncAlert = {
  id: string;
  type: PostSyncAlertType;
  severity: "danger" | "warning" | "info";
  title: string;
  message: string;
  tradeIds: string[];
  suggestedActions: {
    label: string;
    href: string;
  }[];
};

/**
 * Analyze newly synced trades against full trade history.
 * Returns alerts for detected patterns, tilt signals, and rule violations.
 */
export function analyzeNewTrades({
  newTradeCount,
  allTrades,
  rules,
  archetype,
}: {
  newTradeCount: number;
  allTrades: Trade[];
  rules: TradingRule[];
  archetype: MiniArchetype | null;
}): PostSyncAlert[] {
  const alerts: PostSyncAlert[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Today's trades
  const todayTrades = allTrades.filter((t) => t.open_timestamp.startsWith(today));
  const closedToday = todayTrades.filter(
    (t) => t.close_timestamp !== null || t.exit_price !== null || t.pnl !== null,
  );

  // ─── Tilt signals ──────────────────────────────────────────
  const tiltSignals = detectTiltSignals(todayTrades);
  for (const signal of tiltSignals) {
    alerts.push({
      id: `tilt-${signal.type}-${Date.now()}`,
      type: signal.type === "revenge_reentry" ? "revenge_trade" : "tilt_pattern",
      severity: signal.severity,
      title:
        signal.type === "revenge_reentry"
          ? "Revenge Trade Detected"
          : signal.type === "rapid_fire"
            ? "Rapid Fire Trading"
            : "Position Size Spike",
      message: signal.message,
      tradeIds: signal.trades,
      suggestedActions: [
        { label: "Review Trades", href: "/dashboard/trades" },
        { label: "Talk to Nova", href: "/dashboard/ai" },
      ],
    });
  }

  // ─── Overtrade detection ───────────────────────────────────
  if (todayTrades.length > 8) {
    alerts.push({
      id: `overtrade-${Date.now()}`,
      type: "overtrade",
      severity: "warning",
      title: "Overtrading Alert",
      message: `${todayTrades.length} trades today. Are you trading your plan or chasing action?`,
      tradeIds: todayTrades.map((t) => t.id),
      suggestedActions: [
        { label: "Create Max Trades Rule", href: "/dashboard/rules" },
      ],
    });
  }

  // ─── Loss streak ───────────────────────────────────────────
  if (closedToday.length >= 2) {
    const sorted = [...closedToday].sort(
      (a, b) =>
        (b.close_timestamp ?? b.open_timestamp).localeCompare(
          a.close_timestamp ?? a.open_timestamp,
        ),
    );
    let streak = 0;
    for (const t of sorted) {
      if ((t.pnl ?? 0) < 0) streak++;
      else break;
    }
    if (streak >= 3) {
      const archetypeWarning =
        archetype === "tilt"
          ? " Your Tilt archetype is at high risk of revenge trading right now."
          : archetype === "degen"
            ? " Your Degen archetype may push you to 'trade your way out.' Don't."
            : "";

      alerts.push({
        id: `loss-streak-${Date.now()}`,
        type: "loss_streak",
        severity: "danger",
        title: `${streak} Losses in a Row`,
        message: `You've hit ${streak} consecutive losses today.${archetypeWarning} Consider stopping for the day.`,
        tradeIds: sorted.slice(0, streak).map((t) => t.id),
        suggestedActions: [
          { label: "Create Loss Streak Rule", href: "/dashboard/rules" },
          { label: "Talk to Nova", href: "/dashboard/ai" },
        ],
      });
    }
  }

  // ─── Rule violations ──────────────────────────────────────
  if (rules.length > 0) {
    const results = evaluateAllRules(rules, { trades: allTrades, todayDate: today });
    for (const { rule, result } of results) {
      if (!result.violated) continue;
      alerts.push({
        id: `rule-${rule.id}-${Date.now()}`,
        type: "rule_violation",
        severity: "warning",
        title: `Rule Violated: ${rule.name}`,
        message: result.detail,
        tradeIds: result.violatingTradeIds,
        suggestedActions: [
          { label: "View Rules", href: "/dashboard/rules" },
        ],
      });
    }
  }

  // Deduplicate by type (keep highest severity)
  const seen = new Set<string>();
  return alerts.filter((a) => {
    const key = a.type;
    if (seen.has(key) && a.severity !== "danger") return false;
    seen.add(key);
    return true;
  });
}

/**
 * Custom event name for trade sync completion.
 */
export const TRADES_SYNCED_EVENT = "stargate-trades-synced";

/**
 * Dispatch the trades-synced event after a successful sync.
 */
export function dispatchTradesSyncedEvent(count: number) {
  window.dispatchEvent(
    new CustomEvent(TRADES_SYNCED_EVENT, { detail: { count } }),
  );
}
