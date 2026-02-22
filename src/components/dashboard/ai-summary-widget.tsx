"use client";

import { Trade } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";
import { Brain, Sparkles } from "lucide-react";

type QuickInsight = {
  text: string;
  sentiment: "positive" | "negative" | "neutral";
};

function generateQuickInsights(trades: Trade[]): QuickInsight[] {
  const insights: QuickInsight[] = [];
  const closed = trades.filter((t) => t.close_timestamp !== null);
  if (closed.length < 3) return insights;

  // 1. Most costly negative emotion
  const negativeEmotions = ["FOMO", "Frustrated", "Revenge", "Anxious", "Bored"];
  const emotionCost = new Map<string, { total: number; count: number }>();
  for (const t of closed) {
    if (!t.emotion || !negativeEmotions.includes(t.emotion)) continue;
    const p = t.pnl ?? calculateTradePnl(t) ?? 0;
    const e = emotionCost.get(t.emotion) ?? { total: 0, count: 0 };
    emotionCost.set(t.emotion, { total: e.total + p, count: e.count + 1 });
  }
  let worstEmotion = "";
  let worstCost = 0;
  for (const [emotion, data] of emotionCost) {
    if (data.total < worstCost) {
      worstEmotion = emotion;
      worstCost = data.total;
    }
  }
  if (worstEmotion && worstCost < -10) {
    insights.push({
      text: `${worstEmotion} trades cost you $${Math.abs(worstCost).toFixed(0)}`,
      sentiment: "negative",
    });
  }

  // 2. Best performing setup type
  const setupMap = new Map<string, { pnl: number; count: number; wins: number }>();
  for (const t of closed) {
    if (!t.setup_type) continue;
    const p = t.pnl ?? calculateTradePnl(t) ?? 0;
    const e = setupMap.get(t.setup_type) ?? { pnl: 0, count: 0, wins: 0 };
    setupMap.set(t.setup_type, { pnl: e.pnl + p, count: e.count + 1, wins: e.wins + (p > 0 ? 1 : 0) });
  }
  let bestSetup = { name: "", pnl: 0, winRate: 0 };
  for (const [name, data] of setupMap) {
    if (data.count >= 2 && data.pnl > bestSetup.pnl) {
      bestSetup = { name, pnl: data.pnl, winRate: (data.wins / data.count) * 100 };
    }
  }
  if (bestSetup.name) {
    insights.push({
      text: `Best setup: "${bestSetup.name}" (${bestSetup.winRate.toFixed(0)}% WR)`,
      sentiment: "positive",
    });
  }

  // 3. Process score trend
  const withProcess = closed
    .filter((t) => t.process_score !== null)
    .sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
  if (withProcess.length >= 10) {
    const recent = withProcess.slice(-10);
    const earlier = withProcess.slice(-20, -10);
    const recentAvg = recent.reduce((s, t) => s + t.process_score!, 0) / recent.length;
    if (earlier.length >= 5) {
      const earlierAvg = earlier.reduce((s, t) => s + t.process_score!, 0) / earlier.length;
      const diff = recentAvg - earlierAvg;
      if (Math.abs(diff) >= 0.5) {
        insights.push({
          text: diff > 0
            ? `Discipline up: ${recentAvg.toFixed(1)} avg (was ${earlierAvg.toFixed(1)})`
            : `Discipline slipping: ${recentAvg.toFixed(1)} avg (was ${earlierAvg.toFixed(1)})`,
          sentiment: diff > 0 ? "positive" : "negative",
        });
      }
    }
  }

  return insights.slice(0, 2);
}

function getBehavioralInsight(): QuickInsight | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("stargate-behavioral-log");
    if (!stored) return null;
    const entries: { timestamp: string; mood: string }[] = JSON.parse(stored);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = entries.filter((e) => new Date(e.timestamp) >= weekAgo);
    if (recent.length < 2) return null;
    const moodCounts: Record<string, number> = {};
    for (const e of recent) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    const negCount = (moodCounts["bad"] || 0) + (moodCounts["tilted"] || 0);
    const posCount = (moodCounts["great"] || 0) + (moodCounts["good"] || 0);
    if (negCount >= 3) {
      const tilt = moodCounts["tilted"] || 0;
      return tilt >= 2
        ? { text: `Tilted ${tilt}x this week — consider reducing size`, sentiment: "negative" }
        : { text: `${negCount} negative logs this week — watch your mindset`, sentiment: "negative" };
    }
    if (posCount >= 4) {
      return { text: `Strong mindset: ${posCount}/${recent.length} positive logs`, sentiment: "positive" };
    }
    return null;
  } catch {
    return null;
  }
}

export function AISummaryWidget({ trades }: { trades: Trade[] }) {
  const tradeInsights = generateQuickInsights(trades);
  const behavioralInsight = getBehavioralInsight();
  const insights = behavioralInsight
    ? [...tradeInsights.slice(0, 2), behavioralInsight].slice(0, 3)
    : tradeInsights;

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Brain size={14} className="text-accent" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Quick Insights</h3>
      </div>

      {insights.length > 0 ? (
        <div className="space-y-1.5">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-[11px] leading-snug px-2.5 py-1.5 rounded-lg ${
                insight.sentiment === "positive"
                  ? "bg-win/5 text-win/90"
                  : insight.sentiment === "negative"
                  ? "bg-loss/5 text-loss/90"
                  : "bg-surface-hover text-muted"
              }`}
            >
              <span className="shrink-0 text-[10px]">
                {insight.sentiment === "positive" ? "+" : insight.sentiment === "negative" ? "!" : "·"}
              </span>
              <span>{insight.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-2">
          <Sparkles size={16} className="text-accent/40 mx-auto mb-1" />
          <p className="text-[11px] text-muted">Log trades with emotions to unlock insights</p>
        </div>
      )}
    </div>
  );
}
