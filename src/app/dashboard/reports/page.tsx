"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import {
  generateWeeklyReport,
  getAvailableWeeks,
} from "@/lib/calculations";
import {
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  Trophy,
  AlertTriangle,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  CheckCircle2,
  XCircle,
  Brain,
} from "lucide-react";

export default function ReportsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    setTrades(dbTrades.length === 0 ? DEMO_TRADES : dbTrades);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const weeks = useMemo(() => getAvailableWeeks(trades), [trades]);

  useEffect(() => {
    if (weeks.length > 0 && !selectedWeek) {
      setSelectedWeek(weeks[0]);
    }
  }, [weeks, selectedWeek]);

  const report = useMemo(() => {
    if (!selectedWeek) return null;
    return generateWeeklyReport(trades, selectedWeek);
  }, [trades, selectedWeek]);

  const weekIdx = weeks.indexOf(selectedWeek ?? "");

  function formatDateRange(start: string, end: string) {
    const s = new Date(start + "T12:00:00");
    const e = new Date(end + "T12:00:00");
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${s.toLocaleDateString("en-US", opts)} — ${e.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  if (!report || !selectedWeek) {
    return (
      <div className="max-w-[1600px] mx-auto flex flex-col items-center justify-center h-full text-center">
        <FileBarChart size={48} className="text-accent/30 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No Reports Yet</h2>
        <p className="text-sm text-muted">
          Complete a week of trading to see your first weekly report.
        </p>
      </div>
    );
  }

  const pnlColor = report.totalPnl >= 0 ? "text-win" : "text-loss";
  const pnlLabel = report.totalPnl >= 0 ? "Profit" : "Learning Investment";

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileBarChart size={24} className="text-accent" />
            Weekly Report
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Auto-generated performance review
          </p>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedWeek(weeks[weekIdx + 1] ?? selectedWeek)}
          disabled={weekIdx >= weeks.length - 1}
          className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">
            {formatDateRange(report.weekStart, report.weekEnd)}
          </span>
          {weekIdx === 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              Latest
            </span>
          )}
        </div>
        <button
          onClick={() => setSelectedWeek(weeks[weekIdx - 1] ?? selectedWeek)}
          disabled={weekIdx <= 0}
          className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* P&L Hero Card */}
      <div
        className="glass rounded-2xl border border-border/50 p-8 text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">
          {pnlLabel}
        </p>
        <p className={`text-4xl font-bold ${pnlColor}`}>
          {report.totalPnl >= 0 ? "+" : ""}${report.totalPnl.toFixed(2)}
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <span className="text-muted">
            <span className="font-bold text-foreground">{report.tradeCount}</span> trades
          </span>
          <span className="text-muted">
            <span className="font-bold text-win">{report.wins}</span> wins
          </span>
          <span className="text-muted">
            <span className="font-bold text-loss">{report.losses}</span> losses
          </span>
          <span className="text-muted">
            Win rate: <span className="font-bold text-foreground">{report.winRate.toFixed(0)}%</span>
          </span>
        </div>
        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted">
          <span>
            <span className="text-win font-semibold">{report.greenDays}</span> green days
          </span>
          <span>
            <span className="text-loss font-semibold">{report.redDays}</span> red days
          </span>
          <span>
            {report.tradingDays} days traded
          </span>
        </div>
      </div>

      {/* Report sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Trade (P&L) */}
        {report.bestTrade && (
          <ReportCard
            icon={Trophy}
            iconColor="text-win"
            title="Best Trade"
            subtitle={`${report.bestTrade.symbol} on ${formatShortDate(report.bestTrade.date)}`}
          >
            <p className="text-2xl font-bold text-win">
              +${report.bestTrade.pnl.toFixed(2)}
            </p>
            {report.bestTrade.processScore !== null && (
              <p className="text-xs text-muted mt-1">
                Process score: <span className="text-foreground font-semibold">{report.bestTrade.processScore}/10</span>
              </p>
            )}
          </ReportCard>
        )}

        {/* Worst Trade (P&L) */}
        {report.worstTrade && (
          <ReportCard
            icon={AlertTriangle}
            iconColor="text-loss"
            title="Biggest Learning Investment"
            subtitle={`${report.worstTrade.symbol} on ${formatShortDate(report.worstTrade.date)}`}
          >
            <p className="text-2xl font-bold text-loss">
              ${report.worstTrade.pnl.toFixed(2)}
            </p>
            {report.worstTrade.processScore !== null && (
              <p className="text-xs text-muted mt-1">
                Process score: <span className="text-foreground font-semibold">{report.worstTrade.processScore}/10</span>
              </p>
            )}
          </ReportCard>
        )}

        {/* Best Process Trade */}
        {report.bestProcessTrade && (
          <ReportCard
            icon={Target}
            iconColor="text-accent"
            title="Best Execution"
            subtitle={`${report.bestProcessTrade.symbol} — highest process score`}
          >
            <p className="text-2xl font-bold text-accent">
              {report.bestProcessTrade.processScore}/10
            </p>
            <p className="text-xs text-muted mt-1">
              P&L: <span className={report.bestProcessTrade.pnl >= 0 ? "text-win" : "text-loss"}>
                {report.bestProcessTrade.pnl >= 0 ? "+" : ""}${report.bestProcessTrade.pnl.toFixed(2)}
              </span>
            </p>
          </ReportCard>
        )}

        {/* Worst Process Trade */}
        {report.worstProcessTrade && report.worstProcessTrade.processScore !== report.bestProcessTrade?.processScore && (
          <ReportCard
            icon={Brain}
            iconColor="text-amber-500"
            title="Process Breakdown"
            subtitle={`${report.worstProcessTrade.symbol} — lowest process score`}
          >
            <p className="text-2xl font-bold text-amber-500">
              {report.worstProcessTrade.processScore}/10
            </p>
            <p className="text-xs text-muted mt-1">
              P&L: <span className={report.worstProcessTrade.pnl >= 0 ? "text-win" : "text-loss"}>
                {report.worstProcessTrade.pnl >= 0 ? "+" : ""}${report.worstProcessTrade.pnl.toFixed(2)}
              </span>
            </p>
          </ReportCard>
        )}
      </div>

      {/* Bottom row: Process + Emotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Process / Discipline */}
        <div
          className="glass rounded-2xl border border-border/50 p-6 space-y-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-accent" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Discipline Report
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4 text-center">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
                Avg Process Score
              </p>
              <p className="text-2xl font-bold text-foreground">
                {report.avgProcessScore !== null
                  ? report.avgProcessScore.toFixed(1)
                  : "—"}
                <span className="text-sm text-muted">/10</span>
              </p>
            </div>
            <div className="rounded-xl border border-border p-4 text-center">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
                Rule Compliance
              </p>
              <p className="text-2xl font-bold text-foreground">
                {report.ruleCompliance !== null
                  ? `${report.ruleCompliance.toFixed(0)}%`
                  : "—"}
              </p>
            </div>
          </div>

          {report.avgProcessScore !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Process Quality</span>
                <span className="text-foreground font-semibold">
                  {report.avgProcessScore >= 7
                    ? "Excellent"
                    : report.avgProcessScore >= 5
                    ? "Needs Work"
                    : "Poor"}
                </span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    report.avgProcessScore >= 7
                      ? "bg-win"
                      : report.avgProcessScore >= 5
                      ? "bg-amber-500"
                      : "bg-loss"
                  }`}
                  style={{ width: `${(report.avgProcessScore / 10) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Suggestion */}
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
            <p className="text-xs text-accent font-semibold mb-1">
              {report.avgProcessScore !== null && report.avgProcessScore >= 7 ? (
                <><CheckCircle2 size={12} className="inline mr-1" />Keep it up!</>
              ) : (
                <><Target size={12} className="inline mr-1" />Focus Area</>
              )}
            </p>
            <p className="text-[11px] text-muted leading-relaxed">
              {getSuggestion(report)}
            </p>
          </div>
        </div>

        {/* Emotional State */}
        <div
          className="glass rounded-2xl border border-border/50 p-6 space-y-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-accent" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Emotional Patterns
            </h3>
          </div>

          {report.emotionBreakdown.length > 0 ? (
            <div className="space-y-2">
              {report.emotionBreakdown.map((e) => (
                <div
                  key={e.emotion}
                  className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {e.emotion}
                    </span>
                    <span className="text-[10px] text-muted">
                      {e.count} trade{e.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      e.pnl >= 0 ? "text-win" : "text-loss"
                    }`}
                  >
                    {e.pnl >= 0 ? "+" : ""}${e.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-4">
              No emotion data this week. Tag your trades to see patterns.
            </p>
          )}

          {/* Emotional insight */}
          {report.emotionBreakdown.length > 0 && (() => {
            const worstEmotion = [...report.emotionBreakdown].sort(
              (a, b) => a.pnl - b.pnl
            )[0];
            const bestEmotion = [...report.emotionBreakdown].sort(
              (a, b) => b.pnl - a.pnl
            )[0];
            return (
              <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-2">
                {bestEmotion.pnl > 0 && (
                  <p className="text-[11px] text-muted">
                    <TrendingUp size={11} className="inline text-win mr-1" />
                    You performed best while <span className="text-win font-semibold">{bestEmotion.emotion}</span> (+${bestEmotion.pnl.toFixed(2)})
                  </p>
                )}
                {worstEmotion.pnl < 0 && worstEmotion !== bestEmotion && (
                  <p className="text-[11px] text-muted">
                    <TrendingDown size={11} className="inline text-loss mr-1" />
                    <span className="text-loss font-semibold">{worstEmotion.emotion}</span> trades cost you ${Math.abs(worstEmotion.pnl).toFixed(2)}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="glass rounded-2xl border border-border/50 p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={iconColor} />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted mb-3">{subtitle}</p>
      {children}
    </div>
  );
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getSuggestion(report: ReturnType<typeof generateWeeklyReport>): string {
  if (report.tradeCount === 0) {
    return "No trades this week. Consider reviewing your watchlist and plans.";
  }

  if (report.ruleCompliance !== null && report.ruleCompliance < 50) {
    return "Your rule compliance is below 50%. Focus on going through your pre-trade checklist before every entry. The checklist exists to protect you from impulsive decisions.";
  }

  if (report.avgProcessScore !== null && report.avgProcessScore < 5) {
    return "Process scores are low this week. Before your next session, review what a 'perfect execution' looks like regardless of outcome. Process is the only thing you control.";
  }

  const fomoTrades = report.emotionBreakdown.find(
    (e) => e.emotion === "FOMO" || e.emotion === "Revenge"
  );
  if (fomoTrades && fomoTrades.pnl < 0) {
    return `Your ${fomoTrades.emotion} trades cost you $${Math.abs(fomoTrades.pnl).toFixed(2)} this week. Next week, when you feel that urge, step away for 15 minutes. If the setup is still valid, enter then.`;
  }

  if (report.avgProcessScore !== null && report.avgProcessScore >= 7 && report.winRate >= 50) {
    return "Strong week both in process and results. Your discipline is translating into profits. Keep logging emotions and sticking to your plan — consistency compounds.";
  }

  if (report.avgProcessScore !== null && report.avgProcessScore >= 7 && report.totalPnl < 0) {
    return "Great process but negative P&L — that's variance, not a problem. Your process scores show discipline. Stay the course; the math works in your favor over time.";
  }

  return "Review your best trade this week and ask: 'What made this work?' Then look at your worst trade and ask: 'What signal did I ignore?' The gap between these answers is your edge.";
}
