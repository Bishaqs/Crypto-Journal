"use client";

import { useState } from "react";
import { Brain, AlertTriangle, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { Trade, BehavioralLog, BehavioralInsight } from "@/lib/types";
import { buildBehavioralContext } from "@/lib/ai-context";
import { useAiBehavioralAnalysis } from "@/lib/ai-insights";
import { useSubscription } from "@/lib/use-subscription";

type AiInsight = {
  insight: string;
  category: "pattern" | "warning" | "strength";
  priority: number;
};

type AiBehavioralInsightsProps = {
  trades: Trade[];
  behavioralLogs: BehavioralLog[];
  dailyCheckins: { date: string; mood: number; energy: number | null; traffic_light: "green" | "yellow" | "red" }[];
  algorithmicInsights: BehavioralInsight[];
};

const CACHE_KEY = "stargate-ai-behavioral-insights";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function AiBehavioralInsights({ trades, behavioralLogs, dailyCheckins, algorithmicInsights }: AiBehavioralInsightsProps) {
  const { apiKey, provider } = useAiBehavioralAnalysis();
  const { hasAccess } = useSubscription();
  const [insights, setInsights] = useState<AiInsight[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) return data;
      }
    } catch { /* ignore */ }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasAccess("ai-behavioral-analysis")) {
    return (
      <div className="rounded-2xl border border-border/50 bg-surface/50 p-5 text-center">
        <Sparkles size={20} className="text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-muted/60 mb-2">AI Behavioral Analysis is available on the Max plan</p>
      </div>
    );
  }

  // Feature is included with Max plan — no toggle needed.
  // Non-Max users are already blocked by hasAccess() above.

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      // Build trade context summary
      const closed = trades.filter((t) => t.close_timestamp);
      const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
      const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
      const winRate = closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(1) : "0";
      const tradeContext = `${closed.length} closed trades, P&L $${totalPnl.toFixed(0)}, WR ${winRate}%. Recent: ${closed.slice(0, 10).map((t) => `${t.symbol} ${t.position} $${(t.pnl ?? 0).toFixed(0)} ${t.emotion || "no-emotion"}`).join("; ")}`;

      // Build behavioral context
      const behavioralContext = buildBehavioralContext(
        behavioralLogs.map((l) => ({
          emotion: l.emotion,
          intensity: l.intensity,
          trigger: l.trigger,
          physical_state: l.physical_state,
          biases: l.biases,
          traffic_light: l.traffic_light,
          note: l.note,
          created_at: l.created_at,
        })),
        dailyCheckins,
      );

      const response = await fetch("/api/ai/trade-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "behavioral-insight",
          tradeContext,
          behavioralContext,
          algorithmicInsights: algorithmicInsights.map((i) => `${i.label}: ${i.description}`),
          apiKey: apiKey ?? undefined,
          provider: provider ?? undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to generate insights");
        return;
      }

      const data = await response.json();
      const aiInsights: AiInsight[] = (data.insights ?? []).sort((a: AiInsight, b: AiInsight) => b.priority - a.priority);
      setInsights(aiInsights);

      // Cache in sessionStorage
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: aiInsights, ts: Date.now() }));
      } catch { /* storage full */ }
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  }

  const categoryConfig = {
    pattern: { Icon: Brain, border: "border-accent/20", bg: "bg-accent/5", text: "text-accent" },
    warning: { Icon: AlertTriangle, border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-400" },
    strength: { Icon: TrendingUp, border: "border-win/20", bg: "bg-win/5", text: "text-win" },
  };

  return (
    <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">AI Behavioral Analysis</h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || behavioralLogs.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            loading || behavioralLogs.length === 0
              ? "bg-border text-muted cursor-not-allowed"
              : "bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
          }`}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
          {loading ? "Analyzing..." : insights.length > 0 ? "Refresh" : "Generate Analysis"}
        </button>
      </div>

      {error && <p className="text-[11px] text-loss mb-3">{error}</p>}

      {insights.length > 0 ? (
        <div className="space-y-2">
          {insights.map((insight, i) => {
            const config = categoryConfig[insight.category] ?? categoryConfig.pattern;
            return (
              <div key={i} className={`rounded-xl border ${config.border} ${config.bg} p-3`}>
                <div className="flex items-start gap-2">
                  <config.Icon size={14} className={`${config.text} mt-0.5 shrink-0`} />
                  <p className="text-[11px] text-foreground leading-relaxed">{insight.insight}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading && (
        <p className="text-[11px] text-muted/60 text-center py-4">
          {behavioralLogs.length === 0
            ? "Complete some emotion check-ins first to enable AI analysis"
            : "Click \"Generate Analysis\" to get AI-powered behavioral insights"}
        </p>
      )}
    </div>
  );
}
