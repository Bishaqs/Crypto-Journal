import { Trade, TradingRule, TradingRuleType } from "./types";
import { MINI_ARCHETYPES, type MiniArchetype } from "./mini-quiz-archetypes";

// ─── Rule Evaluation ────────────────────────────────────────

export type RuleCheckResult = {
  violated: boolean;
  detail: string;
  violatingTradeIds: string[];
  pnlImpact: number;
};

export type RuleContext = {
  trades: Trade[]; // all trades (we filter internally)
  todayDate: string; // YYYY-MM-DD
};

/**
 * Evaluate a single rule against the current trading context.
 * Returns whether the rule was violated today and which trades caused it.
 */
export function evaluateRule(rule: TradingRule, ctx: RuleContext): RuleCheckResult {
  if (!rule.active) {
    return { violated: false, detail: "Rule inactive", violatingTradeIds: [], pnlImpact: 0 };
  }

  const threshold = Number(rule.parameters.threshold ?? 0);
  const todayTrades = ctx.trades.filter((t) => t.open_timestamp.startsWith(ctx.todayDate));
  const closedToday = todayTrades.filter(
    (t) => t.close_timestamp !== null || t.exit_price !== null || t.pnl !== null,
  );

  switch (rule.rule_type) {
    case "max_trades_per_day": {
      if (todayTrades.length > threshold) {
        const excess = todayTrades.slice(threshold);
        const impact = excess.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
        return {
          violated: true,
          detail: `${todayTrades.length} trades today (max: ${threshold})`,
          violatingTradeIds: excess.map((t) => t.id),
          pnlImpact: impact,
        };
      }
      return { violated: false, detail: `${todayTrades.length}/${threshold} trades`, violatingTradeIds: [], pnlImpact: 0 };
    }

    case "stop_after_consecutive_losses": {
      const sorted = [...closedToday].sort(
        (a, b) => (a.close_timestamp ?? a.open_timestamp).localeCompare(b.close_timestamp ?? b.open_timestamp),
      );
      let streak = 0;
      let streakBrokenAt = -1;
      for (let i = 0; i < sorted.length; i++) {
        const pnl = sorted[i].pnl ?? 0;
        if (pnl < 0) {
          streak++;
          if (streak >= threshold && streakBrokenAt === -1) {
            streakBrokenAt = i;
          }
        } else {
          streak = 0;
        }
      }

      if (streakBrokenAt !== -1 && streakBrokenAt < sorted.length - 1) {
        const afterStreak = sorted.slice(streakBrokenAt + 1);
        const impact = afterStreak.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
        return {
          violated: true,
          detail: `${afterStreak.length} trade(s) after ${threshold} consecutive losses`,
          violatingTradeIds: afterStreak.map((t) => t.id),
          pnlImpact: impact,
        };
      }
      return { violated: false, detail: `Current loss streak: ${streak}`, violatingTradeIds: [], pnlImpact: 0 };
    }

    case "max_loss_per_day": {
      const dayPnl = closedToday.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
      if (dayPnl < -threshold) {
        return {
          violated: true,
          detail: `Day P&L: $${dayPnl.toFixed(0)} (max loss: -$${threshold})`,
          violatingTradeIds: closedToday.filter((t) => (t.pnl ?? 0) < 0).map((t) => t.id),
          pnlImpact: dayPnl + threshold, // how much over the limit
        };
      }
      return { violated: false, detail: `Day P&L: $${dayPnl.toFixed(0)}`, violatingTradeIds: [], pnlImpact: 0 };
    }

    case "no_trading_after_time": {
      const timeStr = String(rule.parameters.threshold ?? "21:00");
      const afterTimeTrades = todayTrades.filter((t) => {
        const tradeTime = t.open_timestamp.split("T")[1]?.substring(0, 5) ?? "00:00";
        return tradeTime > timeStr;
      });
      if (afterTimeTrades.length > 0) {
        const impact = afterTimeTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
        return {
          violated: true,
          detail: `${afterTimeTrades.length} trade(s) after ${timeStr}`,
          violatingTradeIds: afterTimeTrades.map((t) => t.id),
          pnlImpact: impact,
        };
      }
      return { violated: false, detail: `No trades after ${timeStr}`, violatingTradeIds: [], pnlImpact: 0 };
    }

    case "no_trading_before_time": {
      const timeStr = String(rule.parameters.threshold ?? "09:00");
      const beforeTimeTrades = todayTrades.filter((t) => {
        const tradeTime = t.open_timestamp.split("T")[1]?.substring(0, 5) ?? "00:00";
        return tradeTime < timeStr;
      });
      if (beforeTimeTrades.length > 0) {
        const impact = beforeTimeTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
        return {
          violated: true,
          detail: `${beforeTimeTrades.length} trade(s) before ${timeStr}`,
          violatingTradeIds: beforeTimeTrades.map((t) => t.id),
          pnlImpact: impact,
        };
      }
      return { violated: false, detail: `No trades before ${timeStr}`, violatingTradeIds: [], pnlImpact: 0 };
    }

    case "cooldown_after_loss_minutes": {
      const cooldownMin = threshold || 15;
      const sorted = [...closedToday].sort(
        (a, b) => (a.close_timestamp ?? a.open_timestamp).localeCompare(b.close_timestamp ?? b.open_timestamp),
      );
      const violators: string[] = [];
      let impact = 0;

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const prevPnl = prev.pnl ?? 0;
        if (prevPnl >= 0) continue;

        const prevClose = new Date(prev.close_timestamp ?? prev.open_timestamp).getTime();
        const currOpen = new Date(curr.open_timestamp).getTime();
        const diffMin = (currOpen - prevClose) / 60000;

        if (diffMin >= 0 && diffMin < cooldownMin) {
          violators.push(curr.id);
          impact += curr.pnl ?? 0;
        }
      }

      if (violators.length > 0) {
        return {
          violated: true,
          detail: `${violators.length} trade(s) within ${cooldownMin}min cooldown after loss`,
          violatingTradeIds: violators,
          pnlImpact: impact,
        };
      }
      return { violated: false, detail: `${cooldownMin}min cooldown respected`, violatingTradeIds: [], pnlImpact: 0 };
    }

    case "min_readiness_score":
    case "custom":
      // These are tracked manually or via readiness integration
      return { violated: false, detail: "Manual tracking", violatingTradeIds: [], pnlImpact: 0 };

    default:
      return { violated: false, detail: "Unknown rule type", violatingTradeIds: [], pnlImpact: 0 };
  }
}

/**
 * Evaluate all active rules for a given day.
 */
export function evaluateAllRules(
  rules: TradingRule[],
  ctx: RuleContext,
): { rule: TradingRule; result: RuleCheckResult }[] {
  return rules
    .filter((r) => r.active)
    .map((rule) => ({ rule, result: evaluateRule(rule, ctx) }));
}

// ─── Compliance Stats ────────────────────────────────────────

export type ComplianceStats = {
  totalRules: number;
  activeRules: number;
  totalViolations: number;
  complianceRate: number; // 0-100
  totalPnlImpact: number; // sum of pnl_impact from violations (negative = money lost)
  potentialSavings: number; // abs value of total negative pnl_impact
  byRule: {
    rule: TradingRule;
    violationCount: number;
    pnlImpact: number;
  }[];
};

/**
 * Compute compliance statistics from rules and stored violations.
 * Uses actual violation records from Supabase, not live evaluation.
 */
export function computeComplianceStats(
  rules: TradingRule[],
  violations: { rule_id: string; pnl_impact: number | null }[],
  totalTradeDays: number,
): ComplianceStats {
  const activeRules = rules.filter((r) => r.active);
  const totalCheckpoints = activeRules.length * Math.max(totalTradeDays, 1);
  const totalViolations = violations.length;
  const complianceRate =
    totalCheckpoints > 0
      ? Math.round(((totalCheckpoints - totalViolations) / totalCheckpoints) * 100)
      : 100;

  const totalPnlImpact = violations.reduce((sum, v) => sum + (v.pnl_impact ?? 0), 0);

  const byRule = rules.map((rule) => {
    const ruleViolations = violations.filter((v) => v.rule_id === rule.id);
    return {
      rule,
      violationCount: ruleViolations.length,
      pnlImpact: ruleViolations.reduce((sum, v) => sum + (v.pnl_impact ?? 0), 0),
    };
  });

  return {
    totalRules: rules.length,
    activeRules: activeRules.length,
    totalViolations,
    complianceRate: Math.max(0, Math.min(100, complianceRate)),
    totalPnlImpact,
    potentialSavings: Math.abs(Math.min(totalPnlImpact, 0)),
    byRule: byRule.sort((a, b) => a.pnlImpact - b.pnlImpact), // worst first
  };
}

// ─── Archetype-Based Rule Suggestions ────────────────────────

export type SuggestedRule = {
  name: string;
  description: string;
  rule_type: TradingRuleType;
  parameters: Record<string, number | string>;
  reason: string;
};

const ARCHETYPE_SUGGESTIONS: Partial<Record<MiniArchetype, SuggestedRule[]>> = {
  tilt: [
    {
      name: "Stop after 2 consecutive losses",
      description: "Take a mandatory break after 2 losses in a row to prevent revenge trading.",
      rule_type: "stop_after_consecutive_losses",
      parameters: { threshold: 2 },
      reason: "Your Tilt archetype is prone to revenge trading after losses.",
    },
    {
      name: "15min cooldown after loss",
      description: "Wait at least 15 minutes after a losing trade before opening a new one.",
      rule_type: "cooldown_after_loss_minutes",
      parameters: { threshold: 15 },
      reason: "Cortisol needs 15+ minutes to clear after a loss. Your speed becomes reckless, not an edge.",
    },
  ],
  degen: [
    {
      name: "Max 5 trades per day",
      description: "Quality over quantity — stop after 5 trades.",
      rule_type: "max_trades_per_day",
      parameters: { threshold: 5 },
      reason: "Your Degen archetype thrives on action but overtrading erodes your edge.",
    },
    {
      name: "Max $200 daily loss",
      description: "Hard stop if you lose more than $200 in a day.",
      rule_type: "max_loss_per_day",
      parameters: { threshold: 200 },
      reason: "A daily loss cap prevents the 'one more trade to make it back' spiral.",
    },
  ],
  paper_hand: [
    {
      name: "Max 8 trades per day",
      description: "Fewer trades, held longer. Your win rate is high — let the winners run.",
      rule_type: "max_trades_per_day",
      parameters: { threshold: 8 },
      reason: "Paper Hands exit early and re-enter often. Fewer but longer trades improve R:R.",
    },
  ],
  architect: [
    {
      name: "Max $500 daily loss",
      description: "Cut your losses when the model is wrong. The market isn't irrational — your model is incomplete.",
      rule_type: "max_loss_per_day",
      parameters: { threshold: 500 },
      reason: "Architects double down instead of cutting when the system says hold.",
    },
  ],
  librarian: [
    {
      name: "No trading before 9 AM",
      description: "Avoid impulsive pre-market entries. Wait for the session to develop.",
      rule_type: "no_trading_before_time",
      parameters: { threshold: "09:00" },
      reason: "When Librarians finally act impulsively, they often do it pre-market. Structure your window.",
    },
  ],
  chameleon: [
    {
      name: "Max 6 trades per day",
      description: "Your intuition is strong but scatters across too many setups.",
      rule_type: "max_trades_per_day",
      parameters: { threshold: 6 },
      reason: "Chameleons adapt well but spread too thin. Focus your intuition on fewer trades.",
    },
  ],
  lurker: [
    {
      name: "No trading after 9 PM",
      description: "Late-night FOMO trades are your weakness. Set a hard cutoff.",
      rule_type: "no_trading_after_time",
      parameters: { threshold: "21:00" },
      reason: "Lurkers watch all day and finally act late at night when discipline is lowest.",
    },
  ],
  diamond_hand: [
    {
      name: "Max $300 daily loss",
      description: "Holding through drawdowns is strength — but unlimited drawdowns are not.",
      rule_type: "max_loss_per_day",
      parameters: { threshold: 300 },
      reason: "Diamond Hands hold too long. A daily loss cap forces you to re-evaluate positions.",
    },
  ],
};

/**
 * Get rule suggestions based on user's trading archetype.
 * Filters out rules the user already has (by rule_type + similar params).
 */
export function suggestRulesForArchetype(
  archetype: MiniArchetype | null,
  existingRules: TradingRule[],
): SuggestedRule[] {
  if (!archetype) return [];

  const suggestions = ARCHETYPE_SUGGESTIONS[archetype] ?? [];

  // Filter out already-existing rules of the same type
  return suggestions.filter((s) => {
    return !existingRules.some((r) => r.rule_type === s.rule_type && r.active);
  });
}

// ─── Rule Type Metadata ──────────────────────────────────────

export const RULE_TYPE_META: Record<
  TradingRuleType,
  { label: string; paramLabel: string; paramType: "number" | "time"; defaultValue: number | string }
> = {
  max_trades_per_day: { label: "Max trades per day", paramLabel: "Max trades", paramType: "number", defaultValue: 5 },
  stop_after_consecutive_losses: { label: "Stop after consecutive losses", paramLabel: "Max consecutive losses", paramType: "number", defaultValue: 2 },
  min_readiness_score: { label: "Min readiness score", paramLabel: "Min score (1-10)", paramType: "number", defaultValue: 5 },
  max_loss_per_day: { label: "Max daily loss", paramLabel: "Max loss ($)", paramType: "number", defaultValue: 200 },
  no_trading_after_time: { label: "No trading after time", paramLabel: "Cutoff time", paramType: "time", defaultValue: "21:00" },
  no_trading_before_time: { label: "No trading before time", paramLabel: "Start time", paramType: "time", defaultValue: "09:00" },
  cooldown_after_loss_minutes: { label: "Cooldown after loss", paramLabel: "Minutes", paramType: "number", defaultValue: 15 },
  custom: { label: "Custom rule", paramLabel: "", paramType: "number", defaultValue: 0 },
};
