"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { Trade, DailyCheckin, MonthlyRecap } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import {
  generateMonthlyRecap,
  getAvailableMonths,
} from "@/lib/calculations";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  Target,
  Brain,
  Heart,
  Zap,
  BarChart3,
  CheckCircle2,
  XCircle,
  Smile,
  Battery,
  Activity,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

/* ─── helpers ──────────────────────────────────────────────────────── */

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pnlColor(n: number) {
  return n > 0 ? "text-win" : n < 0 ? "text-loss" : "text-muted";
}

function pnlBg(n: number) {
  return n > 0 ? "bg-win/10 border-win/20" : n < 0 ? "bg-loss/10 border-loss/20" : "bg-surface border-border";
}

function moodEmoji(n: number) {
  if (n >= 4.5) return "🔥";
  if (n >= 3.5) return "🙂";
  if (n >= 2.5) return "😐";
  if (n >= 1.5) return "😔";
  return "😞";
}

function energyEmoji(n: number) {
  if (n >= 4.5) return "🚀";
  if (n >= 3.5) return "💪";
  if (n >= 2.5) return "⚡";
  if (n >= 1.5) return "😴";
  return "🪫";
}

/* ─── page ─────────────────────────────────────────────────────────── */

export default function RecapsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    // Fetch trades
    const { data: tradeData, error: tradeErr } = await fetchAllTrades(supabase);
    if (tradeErr) console.error("Trade fetch error:", tradeErr);
    const dbTrades = (tradeData as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }

    // Fetch checkins
    const { data: checkinData } = await supabase
      .from("daily_checkins")
      .select("*")
      .order("date", { ascending: true });
    setCheckins((checkinData as DailyCheckin[]) ?? []);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const months = useMemo(() => getAvailableMonths(trades), [trades]);

  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[0]);
    }
  }, [months, selectedMonth]);

  const recap: MonthlyRecap | null = useMemo(() => {
    if (!selectedMonth) return null;
    return generateMonthlyRecap(trades, checkins, selectedMonth);
  }, [trades, checkins, selectedMonth]);

  const monthIdx = months.indexOf(selectedMonth ?? "");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <CalendarCheck size={48} className="text-muted" />
        <h2 className="text-xl font-bold text-foreground">No Monthly Data Yet</h2>
        <p className="text-muted text-sm max-w-md">
          Complete some trades to see your monthly recaps. Each month with closed trades will appear here with performance metrics and psychological insights.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {usingDemo && <DemoBanner />}

      {/* Header + Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck size={24} className="text-accent" />
            Monthly Recap
          </h1>
          <p className="text-xs text-muted mt-1">Performance + psychology review</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonth(months[monthIdx + 1])}
            disabled={monthIdx >= months.length - 1}
            className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-hover disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
            {recap?.monthLabel ?? selectedMonth}
          </span>
          <button
            onClick={() => setSelectedMonth(months[monthIdx - 1])}
            disabled={monthIdx <= 0}
            className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-hover disabled:opacity-30 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {recap && (
        <>
          {/* Hero Card */}
          <div
            className={`glass rounded-2xl border p-6 ${pnlBg(recap.totalPnl)}`}
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">Monthly P&L</p>
                <p className={`text-3xl font-bold ${pnlColor(recap.totalPnl)}`}>
                  {recap.totalPnl >= 0 ? "+" : ""}{fmt(recap.totalPnl)}
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="text-muted text-xs">Trades</p>
                  <p className="font-bold text-foreground">{recap.tradeCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted text-xs">Win Rate</p>
                  <p className="font-bold text-foreground">{fmt(recap.winRate, 1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-muted text-xs">Trading Days</p>
                  <p className="font-bold text-foreground">
                    <span className="text-win">{recap.greenDays}</span>
                    {" / "}
                    <span className="text-loss">{recap.redDays}</span>
                  </p>
                </div>
                {recap.avgProcessScore !== null && (
                  <div className="text-center">
                    <p className="text-muted text-xs">Avg Process</p>
                    <p className="font-bold text-foreground">{fmt(recap.avgProcessScore, 1)}/10</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Best Trade */}
            {recap.bestTrade && (
              <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={14} className="text-win" />
                  <span className="text-xs text-muted">Best Trade</span>
                </div>
                <p className="font-bold text-foreground text-sm">{recap.bestTrade.symbol}</p>
                <p className="text-win text-sm font-semibold">+{fmt(recap.bestTrade.pnl)}</p>
              </div>
            )}

            {/* Worst Trade */}
            {recap.worstTrade && (
              <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-loss" />
                  <span className="text-xs text-muted">Worst Trade</span>
                </div>
                <p className="font-bold text-foreground text-sm">{recap.worstTrade.symbol}</p>
                <p className="text-loss text-sm font-semibold">{fmt(recap.worstTrade.pnl)}</p>
              </div>
            )}

            {/* Rule Compliance */}
            <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-accent" />
                <span className="text-xs text-muted">Rule Compliance</span>
              </div>
              <p className="font-bold text-foreground text-lg">
                {recap.ruleCompliance !== null ? `${fmt(recap.ruleCompliance, 0)}%` : "N/A"}
              </p>
            </div>

            {/* Wins / Losses */}
            <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} className="text-accent" />
                <span className="text-xs text-muted">W / L</span>
              </div>
              <p className="font-bold text-foreground text-lg">
                <span className="text-win">{recap.wins}</span>
                {" / "}
                <span className="text-loss">{recap.losses}</span>
              </p>
            </div>
          </div>

          {/* Psychology Section */}
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
              <Brain size={18} className="text-accent" />
              Psychological Review
              <InfoTooltip text="Aggregated from your daily check-ins. Mood, energy, and readiness signals tracked across the month." />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Average Mood */}
              <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Smile size={14} className="text-yellow-400" />
                  <span className="text-xs text-muted">Avg Mood</span>
                </div>
                {recap.avgMood !== null ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{moodEmoji(recap.avgMood)}</span>
                    <span className="font-bold text-foreground text-lg">{fmt(recap.avgMood, 1)}/5</span>
                  </div>
                ) : (
                  <p className="text-muted text-sm">No check-ins</p>
                )}
                <p className="text-xs text-muted mt-1">{recap.checkinDays} check-in days</p>
              </div>

              {/* Average Energy */}
              <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Battery size={14} className="text-green-400" />
                  <span className="text-xs text-muted">Avg Energy</span>
                </div>
                {recap.avgEnergy !== null ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{energyEmoji(recap.avgEnergy)}</span>
                    <span className="font-bold text-foreground text-lg">{fmt(recap.avgEnergy, 1)}/5</span>
                  </div>
                ) : (
                  <p className="text-muted text-sm">No check-ins</p>
                )}
              </div>

              {/* Trading Readiness */}
              <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-accent" />
                  <span className="text-xs text-muted">Trading Readiness</span>
                </div>
                {recap.checkinDays > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap size={12} className="text-win" />
                      <span className="text-foreground">{recap.greenLightDays} green</span>
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-win rounded-full" style={{ width: `${(recap.greenLightDays / recap.checkinDays) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap size={12} className="text-yellow-400" />
                      <span className="text-foreground">{recap.yellowLightDays} yellow</span>
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(recap.yellowLightDays / recap.checkinDays) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap size={12} className="text-loss" />
                      <span className="text-foreground">{recap.redLightDays} red</span>
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-loss rounded-full" style={{ width: `${(recap.redLightDays / recap.checkinDays) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-sm">No check-ins</p>
                )}
              </div>
            </div>
          </div>

          {/* Mood Trend (mini sparkline as colored dots) */}
          {recap.moodTrend.length > 0 && (
            <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Heart size={14} className="text-pink-400" />
                Mood Trend
              </h3>
              <div className="flex items-end gap-1 h-12">
                {recap.moodTrend.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm transition-all"
                    style={{
                      height: `${(d.mood / 5) * 100}%`,
                      backgroundColor: d.mood >= 4 ? "var(--win)" : d.mood >= 3 ? "var(--accent)" : d.mood >= 2 ? "var(--yellow, #eab308)" : "var(--loss)",
                      opacity: 0.8,
                    }}
                    title={`${d.date}: ${d.mood}/5`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>{recap.moodTrend[0]?.date.split("-").slice(1).join("/")}</span>
                <span>{recap.moodTrend[recap.moodTrend.length - 1]?.date.split("-").slice(1).join("/")}</span>
              </div>
            </div>
          )}

          {/* Weekly P&L Breakdown */}
          {recap.weeklyPnl.length > 0 && (
            <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 size={14} className="text-accent" />
                Weekly Breakdown
              </h3>
              <div className="space-y-2">
                {recap.weeklyPnl.map((w) => {
                  const weekDate = new Date(w.week + "T12:00:00");
                  const endDate = new Date(weekDate);
                  endDate.setDate(endDate.getDate() + 6);
                  const label = `${weekDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                  return (
                    <div key={w.week} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface/50">
                      <div>
                        <span className="text-xs text-foreground">{label}</span>
                        <span className="text-xs text-muted ml-2">({w.trades} trades)</span>
                      </div>
                      <span className={`text-sm font-semibold ${pnlColor(w.pnl)}`}>
                        {w.pnl >= 0 ? "+" : ""}{fmt(w.pnl)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emotion Breakdown */}
          {recap.emotionBreakdown.length > 0 && recap.emotionBreakdown[0].emotion !== "Untagged" && (
            <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Brain size={14} className="text-accent" />
                Emotion Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {recap.emotionBreakdown.slice(0, 6).map((e) => (
                  <div key={e.emotion} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface/50">
                    <div>
                      <span className="text-xs text-foreground">{e.emotion}</span>
                      <span className="text-xs text-muted ml-1">({e.count})</span>
                    </div>
                    <span className={`text-xs font-semibold ${pnlColor(e.pnl)}`}>
                      {e.pnl >= 0 ? "+" : ""}{fmt(e.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Symbols */}
          {recap.topSymbols.length > 0 && (
            <div className="glass rounded-xl border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent" />
                Top Symbols
              </h3>
              <div className="space-y-2">
                {recap.topSymbols.slice(0, 5).map((s) => (
                  <div key={s.symbol} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface/50">
                    <div>
                      <span className="text-sm font-medium text-foreground">{s.symbol}</span>
                      <span className="text-xs text-muted ml-2">{s.count} trades</span>
                    </div>
                    <span className={`text-sm font-semibold ${pnlColor(s.pnl)}`}>
                      {s.pnl >= 0 ? "+" : ""}{fmt(s.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month Summary Footer */}
          <div className="glass rounded-xl border border-border p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs text-muted">
              {recap.monthLabel}: {recap.tradeCount} trades across {recap.tradingDays} days
              {recap.checkinDays > 0 && ` | ${recap.checkinDays} daily check-ins logged`}
              {recap.totalPnl > 0 ? " | Profitable month" : recap.totalPnl < 0 ? " | Learning investment month" : ""}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
