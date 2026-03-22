"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { Trade, DailyCheckin } from "@/lib/types";
import { DemoBanner } from "@/components/demo-banner";
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
  Heart,
  Smile,
  Battery,
  Zap,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { NovaNarrative } from "@/components/nova-narrative";

export default function ReportsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const { data } = await fetchAllTrades(supabase);
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades([]);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }
    const { data: checkinData } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });
    setCheckins((checkinData as DailyCheckin[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // Fetch narrative for selected week
  useEffect(() => {
    if (!selectedWeek || usingDemo) {
      setNarrative(null);
      return;
    }
    supabase
      .from("trading_summaries")
      .select("narrative")
      .eq("period_type", "weekly")
      .eq("period_start", selectedWeek)
      .maybeSingle()
      .then(({ data }: { data: { narrative: string | null } | null }) => setNarrative(data?.narrative ?? null));
  }, [selectedWeek, usingDemo, supabase]);

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
          <h1 id="tour-reports-header" className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileBarChart size={24} className="text-accent" />
            Weekly Report
            <InfoTooltip text="Auto-generated weekly performance summaries with key metrics and trade breakdowns" articleId="an-reports" />
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Auto-generated performance review
          </p>
        </div>
      </div>
      {usingDemo && <DemoBanner feature="reports" />}

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
            <span className="text-win font-semibold">{report.greenDays}</span> profitable {report.greenDays === 1 ? "day" : "days"}
          </span>
          <span>
            <span className="text-loss font-semibold">{report.redDays}</span> losing {report.redDays === 1 ? "day" : "days"}
          </span>
          <span>
            {report.tradingDays} days traded
          </span>
        </div>
      </div>

      {/* Nova's AI narrative */}
      {!usingDemo && selectedWeek && (
        <NovaNarrative periodType="weekly" periodStart={selectedWeek} narrative={narrative} />
      )}

      {/* Report sections grid */}
      <div id="tour-reports-content" className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {report.avgProcessScore === null && (report.ruleCompliance === null || report.ruleCompliance === 0) ? (
            <div className="rounded-xl border border-border/50 bg-background/50 p-6 text-center space-y-2">
              <Target size={24} className="mx-auto text-accent/30" />
              <p className="text-sm text-muted">No discipline data this week.</p>
              <p className="text-xs text-muted/70">
                Rate your process after each trade and use the pre-trade checklist to track your discipline over time.
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
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

      {/* Psychology & Mindset Section */}
      {(() => {
        const weekCheckins = checkins.filter((c) => c.date >= report.weekStart && c.date <= report.weekEnd);
        if (weekCheckins.length === 0) return null;

        const moods = weekCheckins.filter((c) => c.mood != null).map((c) => c.mood);
        const energies = weekCheckins.filter((c) => c.energy != null).map((c) => c.energy!);
        const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
        const avgEnergy = energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : null;
        const greenDays = weekCheckins.filter((c) => c.traffic_light === "green").length;
        const yellowDays = weekCheckins.filter((c) => c.traffic_light === "yellow").length;
        const redDays = weekCheckins.filter((c) => c.traffic_light === "red").length;

        const moodEmoji = (n: number) => n >= 4.5 ? "🔥" : n >= 3.5 ? "🙂" : n >= 2.5 ? "😐" : n >= 1.5 ? "😔" : "😞";
        const energyEmoji = (n: number) => n >= 4.5 ? "🚀" : n >= 3.5 ? "💪" : n >= 2.5 ? "⚡" : n >= 1.5 ? "😴" : "🪫";

        return (
          <div
            className="glass rounded-2xl border border-border/50 p-6 space-y-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-pink-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Mindset & Wellbeing
              </h3>
              <span className="text-[10px] text-muted">({weekCheckins.length} check-ins this week)</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Average Mood */}
              <div className="rounded-xl border border-border p-3 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Avg Mood</p>
                {avgMood !== null ? (
                  <>
                    <span className="text-xl">{moodEmoji(avgMood)}</span>
                    <p className="text-sm font-bold text-foreground">{avgMood.toFixed(1)}/5</p>
                  </>
                ) : <p className="text-muted text-sm">—</p>}
              </div>

              {/* Average Energy */}
              <div className="rounded-xl border border-border p-3 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Avg Energy</p>
                {avgEnergy !== null ? (
                  <>
                    <span className="text-xl">{energyEmoji(avgEnergy)}</span>
                    <p className="text-sm font-bold text-foreground">{avgEnergy.toFixed(1)}/5</p>
                  </>
                ) : <p className="text-muted text-sm">—</p>}
              </div>

              {/* Readiness Distribution */}
              <div className="rounded-xl border border-border p-3 text-center col-span-2">
                <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Trading Readiness</p>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <span><Zap size={10} className="inline text-win mr-0.5" />{greenDays} go</span>
                  <span><Zap size={10} className="inline text-yellow-400 mr-0.5" />{yellowDays} caution</span>
                  <span><Zap size={10} className="inline text-loss mr-0.5" />{redDays} stop</span>
                </div>
              </div>
            </div>

            {/* Mood bars */}
            <div>
              <p className="text-[10px] text-muted mb-2">Daily mood this week</p>
              <div className="flex items-end gap-1 h-8">
                {weekCheckins.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${(c.mood / 5) * 100}%`,
                      backgroundColor: c.mood >= 4 ? "var(--win)" : c.mood >= 3 ? "var(--accent)" : c.mood >= 2 ? "#eab308" : "var(--loss)",
                      opacity: 0.8,
                    }}
                    title={`${c.date}: mood ${c.mood}/5`}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })()}
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
    if (report.ruleCompliance === 0) {
      return "Start using the pre-trade checklist to build discipline. Having a routine before each trade helps prevent impulsive decisions.";
    }
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
