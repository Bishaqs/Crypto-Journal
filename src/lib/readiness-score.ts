import { Trade, DailyCheckin } from "./types";
import { detectTiltSignals, type TiltSignal } from "./calculations";
import { MINI_ARCHETYPES, type MiniArchetype } from "./mini-quiz-archetypes";

export type ReadinessComponent = {
  name: string;
  value: number; // adjustment to base score
  reason: string;
};

export type ReadinessResult = {
  score: number; // 1-10
  components: ReadinessComponent[];
  warnings: string[];
  recommendation: string;
  hasCheckin: boolean;
};

/**
 * Compute a Trading Readiness Score (1-10).
 * Works without check-in data — degrades gracefully using only trade patterns.
 *
 * Baseline: 7 (neutral, no data = "probably fine")
 * Adjustments from check-in, trade patterns, tilt signals, archetype risk.
 */
export function computeReadinessScore({
  trades,
  checkin,
  archetype,
  tiltSignals,
}: {
  trades: Trade[];
  checkin: DailyCheckin | null;
  archetype: MiniArchetype | null;
  tiltSignals?: TiltSignal[];
}): ReadinessResult {
  let score = 7;
  const components: ReadinessComponent[] = [];
  const warnings: string[] = [];

  // ─── Check-in factors (optional) ──────────────────────────
  if (checkin) {
    // Mood: 1-2 = bad, 3 = neutral, 4-5 = good
    if (checkin.mood <= 2) {
      const adj = -2;
      score += adj;
      components.push({ name: "mood", value: adj, reason: `Mood: ${checkin.mood}/5` });
      warnings.push("Low mood detected — consider trading smaller or sitting out.");
    } else if (checkin.mood >= 4) {
      const adj = 1;
      score += adj;
      components.push({ name: "mood", value: adj, reason: `Mood: ${checkin.mood}/5` });
    }

    // Energy
    if (checkin.energy !== null) {
      if (checkin.energy <= 2) {
        const adj = -1;
        score += adj;
        components.push({ name: "energy", value: adj, reason: `Energy: ${checkin.energy}/5` });
      } else if (checkin.energy >= 4) {
        const adj = 1;
        score += adj;
        components.push({ name: "energy", value: adj, reason: `Energy: ${checkin.energy}/5` });
      }
    }

    // Sleep (Advanced tier)
    if (checkin.sleep_quality !== null) {
      if (checkin.sleep_quality <= 2) {
        const adj = -1;
        score += adj;
        components.push({ name: "sleep", value: adj, reason: `Sleep: ${checkin.sleep_quality}/5` });
        warnings.push("Poor sleep degrades decision quality. Stick to A+ setups only.");
      } else if (checkin.sleep_quality >= 4) {
        const adj = 1;
        score += adj;
        components.push({ name: "sleep", value: adj, reason: `Sleep: ${checkin.sleep_quality}/5` });
      }
    }

    // Traffic light — strongest signal
    if (checkin.traffic_light === "red") {
      const adj = -3;
      score += adj;
      components.push({ name: "traffic_light", value: adj, reason: "You said: sit out today" });
      warnings.push("You marked yourself RED. Consider not trading today.");
    } else if (checkin.traffic_light === "yellow") {
      const adj = -1;
      score += adj;
      components.push({ name: "traffic_light", value: adj, reason: "You said: trade with caution" });
    }
  }

  // ─── Trade pattern factors ────────────────────────────────
  const closedTrades = trades.filter(
    (t) => t.close_timestamp !== null || t.exit_price !== null || t.pnl !== null,
  );

  // Loss streak (last N closed trades)
  if (closedTrades.length >= 2) {
    const recent = closedTrades
      .sort((a, b) => (b.close_timestamp ?? b.open_timestamp).localeCompare(a.close_timestamp ?? a.open_timestamp))
      .slice(0, 10);

    let streak = 0;
    for (const t of recent) {
      const pnl = t.pnl ?? 0;
      if (pnl < 0) streak++;
      else break;
    }

    if (streak >= 3) {
      const adj = -2;
      score += adj;
      components.push({ name: "loss_streak", value: adj, reason: `${streak} consecutive losses` });
      warnings.push(`${streak} losses in a row. High risk of revenge trading.`);
    } else if (streak === 2) {
      const adj = -1;
      score += adj;
      components.push({ name: "loss_streak", value: adj, reason: "2 consecutive losses" });
    }

    // Recent win rate (last 5 trading days)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const recentTrades = closedTrades.filter(
      (t) => new Date(t.close_timestamp ?? t.open_timestamp) >= fiveDaysAgo,
    );
    if (recentTrades.length >= 3) {
      const wins = recentTrades.filter((t) => (t.pnl ?? 0) > 0).length;
      const winRate = wins / recentTrades.length;
      if (winRate > 0.6) {
        const adj = 1;
        score += adj;
        components.push({ name: "recent_win_rate", value: adj, reason: `${Math.round(winRate * 100)}% win rate (5d)` });
      } else if (winRate < 0.3) {
        const adj = -1;
        score += adj;
        components.push({ name: "recent_win_rate", value: adj, reason: `${Math.round(winRate * 100)}% win rate (5d)` });
      }
    }
  }

  // Today's trade count (overtrade risk)
  const today = new Date().toISOString().split("T")[0];
  const todayTrades = trades.filter((t) => t.open_timestamp.startsWith(today));
  if (todayTrades.length > 5) {
    const adj = -1;
    score += adj;
    components.push({ name: "overtrade", value: adj, reason: `${todayTrades.length} trades today` });
    warnings.push(`${todayTrades.length} trades today — are you overtrading?`);
  }

  // ─── Tilt signals ─────────────────────────────────────────
  const signals = tiltSignals ?? detectTiltSignals(trades, { excludeBrokerSynced: true });
  for (const signal of signals) {
    if (signal.type === "rapid_fire") {
      const adj = -2;
      score += adj;
      components.push({ name: "tilt_rapid_fire", value: adj, reason: signal.message });
      warnings.push(signal.message);
    } else if (signal.type === "revenge_reentry") {
      const adj = -2;
      score += adj;
      components.push({ name: "tilt_revenge", value: adj, reason: signal.message });
      warnings.push(signal.message);
    } else if (signal.type === "size_spike") {
      const adj = -1;
      score += adj;
      components.push({ name: "tilt_size_spike", value: adj, reason: signal.message });
    }
  }

  // ─── Archetype-specific risk ──────────────────────────────
  if (archetype) {
    const info = MINI_ARCHETYPES[archetype];
    if (info) {
      // Tilt archetype + recent loss = extra penalty (revenge-prone)
      if (archetype === "tilt" && components.some((c) => c.name === "loss_streak")) {
        const adj = -1;
        score += adj;
        components.push({
          name: "archetype_risk",
          value: adj,
          reason: `${info.name}: ${info.blindSpots[0]}`,
        });
      }
      // Degen archetype + high trade count = extra penalty
      if (archetype === "degen" && todayTrades.length > 3) {
        const adj = -1;
        score += adj;
        components.push({
          name: "archetype_risk",
          value: adj,
          reason: `${info.name}: ${info.blindSpots[0]}`,
        });
      }
      // Paper hand after wins — might exit too early
      if (archetype === "paper_hand") {
        const recentWins = closedTrades
          .sort((a, b) => (b.close_timestamp ?? b.open_timestamp).localeCompare(a.close_timestamp ?? a.open_timestamp))
          .slice(0, 3)
          .filter((t) => (t.pnl ?? 0) > 0).length;
        if (recentWins >= 2) {
          warnings.push(`${info.name}: You're on a streak — watch for early exits.`);
        }
      }
    }
  }

  // ─── Clamp & generate recommendation ──────────────────────
  score = Math.max(1, Math.min(10, score));

  let recommendation: string;
  if (score <= 3) {
    recommendation = "Consider sitting out today or trading with minimal size.";
  } else if (score <= 5) {
    recommendation = "Proceed with caution. Stick to your best setups only.";
  } else if (score <= 7) {
    recommendation = "Conditions are neutral. Follow your plan.";
  } else {
    recommendation = "You're in good shape. Trust your process.";
  }

  return {
    score,
    components,
    warnings,
    recommendation,
    hasCheckin: checkin !== null,
  };
}

/**
 * Color for the readiness score.
 */
export function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
  ring: string;
} {
  if (score <= 3) {
    return {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      ring: "stroke-red-400",
    };
  }
  if (score <= 5) {
    return {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      ring: "stroke-amber-400",
    };
  }
  if (score <= 7) {
    return {
      text: "text-foreground",
      bg: "bg-accent/5",
      border: "border-border/30",
      ring: "stroke-accent/60",
    };
  }
  return {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ring: "stroke-emerald-400",
  };
}

/**
 * Label for the readiness score.
 */
export function getScoreLabel(score: number): string {
  if (score <= 3) return "High Risk";
  if (score <= 5) return "Caution";
  if (score <= 7) return "Neutral";
  return "Ready";
}
