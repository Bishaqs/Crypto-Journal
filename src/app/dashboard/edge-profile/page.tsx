"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import type { Trade, PsychologyProfile } from "@/lib/types";
import { calculateAdvancedStats } from "@/lib/calculations";
import {
  calculateEmotionCorrelations,
  calculateTimeCorrelations,
  calculateConfidenceCalibration,
} from "@/lib/psychology-correlations";
import {
  detectSelfSabotage,
  calculatePsychDevelopmentStage,
} from "@/lib/calculations";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { useDateRange } from "@/lib/date-range-context";
import {
  Fingerprint,
  TrendingUp,
  TrendingDown,
  Shield,
  Brain,
  Target,
  Activity,
  AlertTriangle,
  Trophy,
  Minus,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const RISK_LABELS: Record<string, string> = {
  conservative_guardian: "Conservative Guardian",
  calculated_risk_taker: "Calculated Risk-Taker",
  aggressive_hunter: "Aggressive Hunter",
  adaptive_chameleon: "Adaptive Chameleon",
};

const IDENTITY_LABELS: Record<string, string> = {
  disciplined_executor: "Disciplined Executor",
  pattern_hunter: "Pattern Hunter",
  contrarian: "Contrarian",
  survivor: "Survivor",
  student: "Student",
};

export default function EdgeProfilePage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = usePsychologyTier();
  const { filterTrades } = useDateRange();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await fetchAllTrades(supabase);
      setTrades(filterTrades(data as Trade[]));
      setLoading(false);
    }
    load();
  }, [filterTrades]);

  const closed = useMemo(
    () => trades.filter((t) => t.close_timestamp && t.pnl !== null),
    [trades],
  );

  const stats = useMemo(() => (closed.length >= 5 ? calculateAdvancedStats(closed) : null), [closed]);
  const emotionCorr = useMemo(() => calculateEmotionCorrelations(closed), [closed]);
  const timeCorr = useMemo(() => calculateTimeCorrelations(closed), [closed]);
  const confCal = useMemo(() => calculateConfidenceCalibration(closed), [closed]);
  const stage = useMemo(() => calculatePsychDevelopmentStage(closed), [closed]);

  // Best/worst by symbol
  const symbolStats = useMemo(() => {
    const map: Record<string, { wins: number; total: number; pnl: number }> = {};
    for (const t of closed) {
      const s = t.symbol || "Unknown";
      if (!map[s]) map[s] = { wins: 0, total: 0, pnl: 0 };
      map[s].total++;
      map[s].pnl += t.pnl ?? 0;
      if ((t.pnl ?? 0) > 0) map[s].wins++;
    }
    return Object.entries(map)
      .filter(([, v]) => v.total >= 3)
      .map(([symbol, v]) => ({ symbol, winRate: Math.round((v.wins / v.total) * 100), totalPnl: Math.round(v.pnl), trades: v.total }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [closed]);

  // Best/worst by setup type
  const setupStats = useMemo(() => {
    const map: Record<string, { wins: number; total: number; pnl: number }> = {};
    for (const t of closed) {
      const s = t.setup_type || "No Setup";
      if (!map[s]) map[s] = { wins: 0, total: 0, pnl: 0 };
      map[s].total++;
      map[s].pnl += t.pnl ?? 0;
      if ((t.pnl ?? 0) > 0) map[s].wins++;
    }
    return Object.entries(map)
      .filter(([, v]) => v.total >= 3)
      .map(([setup, v]) => ({ setup, winRate: Math.round((v.wins / v.total) * 100), totalPnl: Math.round(v.pnl), trades: v.total }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [closed]);

  // Process score trend
  const processTrend = useMemo(() => {
    const withScore = closed.filter((t) => t.process_score != null);
    if (withScore.length < 10) return null;
    const overall = withScore.reduce((s, t) => s + (t.process_score ?? 0), 0) / withScore.length;
    const recent10 = withScore.slice(-10);
    const recentAvg = recent10.reduce((s, t) => s + (t.process_score ?? 0), 0) / recent10.length;
    const trend = recentAvg > overall + 0.5 ? "improving" : recentAvg < overall - 0.5 ? "declining" : "stable";
    return { overall: Math.round(overall * 10) / 10, recent: Math.round(recentAvg * 10) / 10, trend };
  }, [closed]);

  // Account age
  const accountAge = useMemo(() => {
    if (closed.length === 0) return "";
    const first = new Date(closed[0].open_timestamp);
    const last = new Date(closed[closed.length - 1].close_timestamp!);
    const days = Math.floor((last.getTime() - first.getTime()) / 86400000);
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${(days / 365).toFixed(1)} years`;
  }, [closed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Fingerprint className="w-8 h-8 animate-pulse opacity-50" />
      </div>
    );
  }

  if (closed.length < 10) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <Fingerprint className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-semibold mb-2">Not Enough Data Yet</h2>
        <p className="text-sm opacity-60">
          Your Edge Profile needs at least 10 closed trades to generate. You have {closed.length}. Keep trading!
        </p>
      </div>
    );
  }

  if (!stats) return null;

  // Derived data for display
  const emotions = emotionCorr.filter((e) => e.tradeCount >= 3 && e.value !== "Untagged");
  const bestEmotion = emotions.length > 0 ? [...emotions].sort((a, b) => b.winRate - a.winRate)[0] : null;
  const worstEmotion = emotions.length > 1 ? [...emotions].sort((a, b) => a.winRate - b.winRate)[0] : null;

  const days = timeCorr.filter((t) => t.dimension === "day_of_week" && t.tradeCount >= 3);
  const bestDay = days.length > 0 ? [...days].sort((a, b) => b.totalPnl - a.totalPnl)[0] : null;
  const worstDay = days.length > 1 ? [...days].sort((a, b) => a.totalPnl - b.totalPnl)[0] : null;

  const bestSymbols = symbolStats.slice(0, 3);
  const worstSymbols = [...symbolStats].sort((a, b) => a.totalPnl - b.totalPnl).slice(0, 3);
  const bestSetups = setupStats.slice(0, 3);
  const worstSetups = [...setupStats].sort((a, b) => a.totalPnl - b.totalPnl).slice(0, 3);

  const riskPersonality = profile?.risk_personality ? RISK_LABELS[profile.risk_personality] || profile.risk_personality : null;
  const selfIdentity = profile?.self_concept_identity ? IDENTITY_LABELS[profile.self_concept_identity] || profile.self_concept_identity : null;

  // Build identity sentence
  const identityParts: string[] = [];
  if (riskPersonality) identityParts.push(riskPersonality);
  if (bestSetups[0] && bestSetups[0].setup !== "No Setup") identityParts.push(`${bestSetups[0].setup} specialist`);
  if (bestDay) identityParts.push(`strongest on ${bestDay.value}s`);
  const identitySentence = identityParts.length > 0
    ? `You are a ${identityParts.join(", ")}.`
    : `You have ${stats.totalTrades} trades across ${accountAge}.`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Hero: Trading Identity Card */}
      <div className="glass rounded-2xl border border-accent/20 p-6 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-3">
            <Fingerprint className="text-accent" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Edge Profile</h1>
            <p className="text-sm text-muted">Your trading DNA — auto-generated from {stats.totalTrades} trades over {accountAge}</p>
          </div>
        </div>
        <p className="text-lg font-medium text-foreground">{identitySentence}</p>
        {bestEmotion && (
          <p className="text-sm text-muted">
            Best in <span className="text-accent font-medium">{bestEmotion.value}</span> state ({bestEmotion.winRate}% WR)
            {bestSymbols[0] && <> trading <span className="text-accent font-medium">{bestSymbols[0].symbol}</span> ({bestSymbols[0].winRate}% WR)</>}
            {bestDay && <> on <span className="text-accent font-medium">{bestDay.value}s</span> ({bestDay.winRate}% WR)</>}.
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Target} accent={stats.winRate >= 50} />
        <StatCard label="Profit Factor" value={stats.profitFactor.toFixed(2)} icon={TrendingUp} accent={stats.profitFactor >= 1.5} />
        <StatCard label="Expectancy" value={`${stats.expectancy.toFixed(2)}R`} icon={Activity} accent={stats.expectancy > 0} />
        <StatCard label="Max Drawdown" value={`$${Math.abs(stats.maxDrawdown).toFixed(0)}`} icon={TrendingDown} accent={false} />
      </div>

      {/* Best & Worst Performers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            Where You Win
          </h2>
          <PerformerList title="Symbols" items={bestSymbols.map((s) => ({ label: s.symbol, wr: s.winRate, pnl: s.totalPnl, n: s.trades }))} positive />
          <PerformerList title="Setups" items={bestSetups.map((s) => ({ label: s.setup, wr: s.winRate, pnl: s.totalPnl, n: s.trades }))} positive />
          {bestEmotion && (
            <PerformerList title="Emotional State" items={[{ label: bestEmotion.value, wr: bestEmotion.winRate, pnl: Math.round(bestEmotion.avgPnl * bestEmotion.tradeCount), n: bestEmotion.tradeCount }]} positive />
          )}
          {bestDay && (
            <PerformerList title="Day" items={[{ label: bestDay.value, wr: bestDay.winRate, pnl: Math.round(bestDay.totalPnl), n: bestDay.tradeCount }]} positive />
          )}
        </div>

        {/* Worst */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Where Money Leaks
          </h2>
          <PerformerList title="Symbols" items={worstSymbols.map((s) => ({ label: s.symbol, wr: s.winRate, pnl: s.totalPnl, n: s.trades }))} positive={false} />
          <PerformerList title="Setups" items={worstSetups.map((s) => ({ label: s.setup, wr: s.winRate, pnl: s.totalPnl, n: s.trades }))} positive={false} />
          {worstEmotion && (
            <PerformerList title="Emotional State" items={[{ label: worstEmotion.value, wr: worstEmotion.winRate, pnl: Math.round(worstEmotion.avgPnl * worstEmotion.tradeCount), n: worstEmotion.tradeCount }]} positive={false} />
          )}
          {worstDay && (
            <PerformerList title="Day" items={[{ label: worstDay.value, wr: worstDay.winRate, pnl: Math.round(worstDay.totalPnl), n: worstDay.tradeCount }]} positive={false} />
          )}
        </div>
      </div>

      {/* Discipline & Psychology */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discipline */}
        <div className="glass rounded-xl border border-border/50 p-5 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Discipline
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">{stage.stage}/5</div>
            <div>
              <p className="text-sm font-medium">{stage.label}</p>
              <p className="text-xs text-muted">{stage.nextStageHint}</p>
            </div>
          </div>
          {processTrend && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Process Score:</span>
              <span className="font-medium">{processTrend.overall}/10</span>
              <span className="text-muted">→ Last 10:</span>
              <span className={`font-medium ${processTrend.trend === "improving" ? "text-emerald-400" : processTrend.trend === "declining" ? "text-red-400" : "text-muted"}`}>
                {processTrend.recent}/10
                {processTrend.trend === "improving" && " ↑"}
                {processTrend.trend === "declining" && " ↓"}
                {processTrend.trend === "stable" && " →"}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted">Best Streak</span>
              <p className="font-medium text-emerald-400">{stats.bestWinStreak} wins</p>
            </div>
            <div>
              <span className="text-muted">Worst Streak</span>
              <p className="font-medium text-red-400">{stats.worstLoseStreak} losses</p>
            </div>
            <div>
              <span className="text-muted">Current</span>
              <p className={`font-medium ${stats.currentStreak.type === "win" ? "text-emerald-400" : stats.currentStreak.type === "loss" ? "text-red-400" : "text-muted"}`}>
                {stats.currentStreak.count} {stats.currentStreak.type}
                {stats.currentStreak.type === "none" && "s"}
              </p>
            </div>
            <div>
              <span className="text-muted">Sharpe Ratio</span>
              <p className={`font-medium ${stats.sharpeRatio > 1 ? "text-emerald-400" : stats.sharpeRatio < 0 ? "text-red-400" : "text-muted"}`}>
                {stats.sharpeRatio.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Psychology Snapshot */}
        <div className="glass rounded-xl border border-border/50 p-5 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Psychology
          </h2>
          {profile ? (
            <div className="space-y-3">
              {riskPersonality && (
                <div className="text-sm">
                  <span className="text-muted">Risk Personality:</span>
                  <p className="font-medium">{riskPersonality}</p>
                </div>
              )}
              {selfIdentity && (
                <div className="text-sm">
                  <span className="text-muted">Self-Concept:</span>
                  <p className="font-medium">{selfIdentity}</p>
                </div>
              )}
              {profile.money_avoidance != null && (
                <div className="space-y-1.5">
                  <span className="text-xs text-muted">Money Scripts</span>
                  <div className="grid grid-cols-2 gap-2">
                    <ScriptBar label="Avoidance" value={profile.money_avoidance ?? 0} />
                    <ScriptBar label="Worship" value={profile.money_worship ?? 0} />
                    <ScriptBar label="Status" value={profile.money_status ?? 0} />
                    <ScriptBar label="Vigilance" value={profile.money_vigilance ?? 0} />
                  </div>
                </div>
              )}
              {profile.loss_aversion_coefficient != null && (
                <div className="text-sm">
                  <span className="text-muted">Loss Aversion:</span>
                  <span className="font-medium ml-1">{profile.loss_aversion_coefficient.toFixed(1)}x</span>
                  <span className="text-xs text-muted ml-1">(losses feel {profile.loss_aversion_coefficient.toFixed(1)}x more painful than equivalent gains)</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Brain className="mx-auto text-muted/30 mb-2" size={32} />
              <p className="text-sm text-muted mb-3">Complete your Psychology Profile to see your trading psychology here.</p>
              <Link href="/dashboard/insights" className="inline-block px-4 py-2 rounded-xl bg-accent text-background text-xs font-semibold hover:bg-accent/90 transition-colors">
                Complete Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Risk Profile */}
      <div className="glass rounded-xl border border-border/50 p-5 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Risk Profile
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted">Avg Winner</span>
            <p className="font-medium text-emerald-400">${stats.avgWinner.toFixed(0)}</p>
          </div>
          <div>
            <span className="text-muted">Avg Loser</span>
            <p className="font-medium text-red-400">${stats.avgLoser.toFixed(0)}</p>
          </div>
          <div>
            <span className="text-muted">Largest Win</span>
            <p className="font-medium text-emerald-400">${stats.largestWin.toFixed(0)}</p>
          </div>
          <div>
            <span className="text-muted">Largest Loss</span>
            <p className="font-medium text-red-400">${stats.largestLoss.toFixed(0)}</p>
          </div>
          <div>
            <span className="text-muted">Avg Hold (Winners)</span>
            <p className="font-medium">{stats.avgHoldTimeWinners.toFixed(1)}h</p>
          </div>
          <div>
            <span className="text-muted">Avg Hold (Losers)</span>
            <p className="font-medium">{stats.avgHoldTimeLosers.toFixed(1)}h</p>
          </div>
          <div>
            <span className="text-muted">Max Drawdown</span>
            <p className="font-medium text-red-400">${Math.abs(stats.maxDrawdown).toFixed(0)} ({stats.maxDrawdownPct.toFixed(1)}%)</p>
          </div>
          <div>
            <span className="text-muted">Total P&L</span>
            <p className={`font-medium ${stats.closedPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>${stats.closedPnl.toFixed(0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ComponentType<{ size?: number; className?: string }>; accent: boolean }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4 text-center">
      <Icon size={16} className={`mx-auto mb-1 ${accent ? "text-accent" : "text-muted"}`} />
      <div className={`text-xl font-bold ${accent ? "text-foreground" : "text-muted"}`}>{value}</div>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function PerformerList({ title, items, positive }: { title: string; items: { label: string; wr: number; pnl: number; n: number }[]; positive: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className="glass rounded-xl border border-border/50 p-3 space-y-2">
      <p className="text-xs text-muted font-semibold uppercase tracking-wider">{title}</p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between text-sm">
          <span className="font-medium truncate max-w-[140px]">{item.label}</span>
          <div className="flex items-center gap-3 text-xs">
            <span className={positive ? "text-emerald-400" : "text-red-400"}>{item.wr}% WR</span>
            <span className={item.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>${item.pnl}</span>
            <span className="text-muted">{item.n}t</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScriptBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted">{label}</span>
        <span className="font-medium">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div className="h-full bg-accent/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
