"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import type { Trade, PsychologyCorrelations, ExpertSessionLog, DailyCheckin, BehavioralLog, PsychologyProfile } from "@/lib/types";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import Link from "next/link";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { PsychologyTierToggle } from "@/components/psychology-tier-toggle";
import { useAccount } from "@/lib/account-context";
import { useDateRange } from "@/lib/date-range-context";
import {
  calculateAllCorrelations,
  generateHeadlineInsights,
  type PsychologyInsight,
} from "@/lib/psychology-correlations";
import {
  detectSelfSabotage,
  detectWealthThermostat,
  detectRiskHomeostasis,
  detectEndowmentEffect,
  detectAnchoringPatterns,
  calculatePsychDevelopmentStage,
} from "@/lib/calculations";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Target,
  Activity,
  Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function PsychologyPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [correlations, setCorrelations] = useState<PsychologyCorrelations | null>(null);
  const [insights, setInsights] = useState<PsychologyInsight[]>([]);
  const { tier, profile } = usePsychologyTier();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const { selectedAccount } = useAccount();
  const { dateRange, filterTrades } = useDateRange();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [
        { data: allTrades },
        { data: sessionLogs },
        { data: checkins },
        { data: profileRows },
        { data: behavioralLogs },
      ] = await Promise.all([
        fetchAllTrades(supabase),
        supabase.from("expert_session_logs").select("*").eq("user_id", user.id).order("session_date", { ascending: false }),
        supabase.from("daily_checkins").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("psychology_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("behavioral_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const filtered = filterTrades(allTrades as Trade[]);
      setTrades(filtered);

      const corr = calculateAllCorrelations(
        filtered,
        (sessionLogs || []) as ExpertSessionLog[],
        (profileRows?.[0] ?? null) as PsychologyProfile | null,
        (checkins || []) as DailyCheckin[],
        (behavioralLogs || []) as BehavioralLog[],
      );
      setCorrelations(corr);
      setInsights(generateHeadlineInsights(corr));
      setLoading(false);
    }
    load();
  }, [selectedAccount, dateRange, filterTrades]);

  const closedTrades = useMemo(
    () => trades.filter((t) => t.close_timestamp && t.pnl !== null),
    [trades],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Brain className="w-8 h-8 animate-pulse opacity-50" />
      </div>
    );
  }

  if (closedTrades.length < 10) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-semibold mb-2">Not Enough Data Yet</h2>
        <p className="text-sm opacity-60">
          The Psychology Engine needs at least 10 closed trades to generate meaningful correlations.
          You have {closedTrades.length}. Keep logging trades!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Psychology Engine
          </h1>
          <p className="text-sm opacity-60 mt-1">
            How your psychology affects your P&L — backed by {closedTrades.length} trades
          </p>
        </div>
        <PsychologyTierToggle />
      </div>

      {/* Profile encouragement */}
      {!profile && (
        <div className="glass rounded-xl border border-accent/20 p-5 text-center space-y-2">
          <Brain className="mx-auto text-accent" size={24} />
          <p className="text-sm font-medium text-foreground">Your Psychology Profile powers Nova&apos;s coaching</p>
          <p className="text-xs text-muted">Complete it once and Nova automatically adapts her coaching style to your personality.</p>
          <Link
            href="/dashboard/insights"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-accent text-background text-xs font-semibold hover:bg-accent/90 transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      )}

      {/* Headline Insights */}
      {insights.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Key Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.slice(0, 6).map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* Emotion-Outcome Matrix */}
      {correlations && correlations.emotionCorrelations.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Emotion → P&L Correlation
          </h2>
          <EmotionPnlChart data={correlations.emotionCorrelations} colors={colors} />
        </section>
      )}

      {/* Confidence Calibration */}
      {correlations && correlations.confidenceCalibration.length >= 3 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Confidence Calibration
          </h2>
          <ConfidenceChart data={correlations.confidenceCalibration} colors={colors} />
        </section>
      )}

      {/* Time Correlations */}
      {correlations && correlations.timeCorrelations.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Time Patterns
          </h2>
          <TimeCorrelationChart
            data={correlations.timeCorrelations.filter((t) => t.dimension === "day_of_week")}
            colors={colors}
          />
        </section>
      )}

      {/* Detection Alerts */}
      {correlations && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Pattern Detection
          </h2>
          <DetectionPanel trades={closedTrades} correlations={correlations} />
        </section>
      )}

      {/* Somatic Stress → Trade Outcome */}
      {correlations?.somaticStressCorrelation && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Body Stress → Trade Outcome
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {correlations.somaticStressCorrelation.byIntensity.length > 0 && (
              <div className="glass rounded-xl border border-border/50 p-4 space-y-3">
                <h3 className="text-sm font-semibold opacity-80">By Stress Intensity</h3>
                {correlations.somaticStressCorrelation.byIntensity.map((d) => (
                  <div key={d.intensity} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{d.intensity}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={d.winRate >= 50 ? "text-green-400" : "text-red-400"}>{d.winRate}% WR</span>
                      <span className={d.avgPnl >= 0 ? "text-green-400" : "text-red-400"}>${d.avgPnl.toFixed(0)}</span>
                      <span className="opacity-50">{d.tradeCount} trades</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {correlations.somaticStressCorrelation.byArea.length > 0 && (
              <div className="glass rounded-xl border border-border/50 p-4 space-y-3">
                <h3 className="text-sm font-semibold opacity-80">By Body Area</h3>
                {correlations.somaticStressCorrelation.byArea.map((d) => (
                  <div key={d.area} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{d.area}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={d.winRate >= 50 ? "text-green-400" : "text-red-400"}>{d.winRate}% WR</span>
                      <span className={d.avgPnl >= 0 ? "text-green-400" : "text-red-400"}>${d.avgPnl.toFixed(0)}</span>
                      <span className="opacity-50">{d.tradeCount} trades</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Money Script Patterns */}
      {correlations && correlations.moneyScriptBehaviors.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Money Script Patterns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {correlations.moneyScriptBehaviors.map((b) => (
              <div key={b.scriptType} className="glass rounded-xl border border-amber-500/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize">{b.scriptType}</span>
                  <span className="text-xs opacity-50">Score: {b.score.toFixed(1)}/5</span>
                </div>
                <p className="text-sm opacity-80">{b.detectedPattern}</p>
                <div className="flex items-center gap-2 text-xs opacity-60">
                  <span>{b.evidence.metric}: {b.evidence.value}%</span>
                  <span>vs benchmark {b.evidence.benchmark}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Readiness Check → Trade Outcome */}
      {correlations && correlations.readinessCorrelation.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Readiness Check Accuracy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {correlations.readinessCorrelation.map((r) => (
              <div key={r.score} className={`glass rounded-xl border p-4 text-center space-y-1 ${
                r.label === "green" ? "border-emerald-500/20" : r.label === "yellow" ? "border-amber-500/20" : "border-red-500/20"
              }`}>
                <div className={`text-2xl font-bold ${
                  r.label === "green" ? "text-emerald-400" : r.label === "yellow" ? "text-amber-400" : "text-red-400"
                }`}>
                  {r.winRate}%
                </div>
                <p className="text-sm capitalize font-medium">{r.label} Readiness</p>
                <p className="text-xs opacity-50">{r.tradeCount} trades, ${r.avgPnl.toFixed(0)} avg</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Daily Check-in → Trade Outcome */}
      {correlations && correlations.checkinCorrelation.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Daily Check-in → Trade Outcome
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["mood", "energy", "sleep_quality", "cognitive_load", "traffic_light"] as const).map((dim) => {
              const data = correlations.checkinCorrelation.filter((c) => c.dimension === dim);
              if (data.length < 2) return null;
              const label = dim === "sleep_quality" ? "Sleep Quality" : dim === "cognitive_load" ? "Cognitive Load" : dim === "traffic_light" ? "Traffic Light" : dim.charAt(0).toUpperCase() + dim.slice(1);
              return (
                <div key={dim} className="glass rounded-xl border border-border/50 p-4 space-y-3">
                  <h3 className="text-sm font-semibold opacity-80">{label}</h3>
                  {data.map((d) => (
                    <div key={d.bucket} className="flex items-center justify-between text-sm">
                      <span>{d.bucket}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={d.winRate >= 50 ? "text-green-400" : "text-red-400"}>{d.winRate}% WR</span>
                        <span className={d.avgPnl >= 0 ? "text-green-400" : "text-red-400"}>${d.avgPnl.toFixed(0)}</span>
                        <span className="opacity-50">{d.tradeCount} trades</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Body Tension Heatmap */}
      {correlations && correlations.somaticHeatmap.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Body Tension Heatmap
          </h2>
          <div className="flex flex-wrap gap-3">
            {correlations.somaticHeatmap.map((entry) => (
              <div key={entry.area} className={`glass rounded-xl border p-4 text-center min-w-[120px] ${
                entry.sentiment === "positive" ? "border-emerald-500/30" : entry.sentiment === "negative" ? "border-red-500/30" : "border-border/50"
              }`}>
                <div className={`text-lg font-bold ${
                  entry.sentiment === "positive" ? "text-emerald-400" : entry.sentiment === "negative" ? "text-red-400" : "opacity-70"
                }`}>
                  {entry.winRate}%
                </div>
                <p className="text-sm capitalize font-medium mt-1">{entry.area}</p>
                <p className="text-xs opacity-50">{entry.tradeCount} trades, ${entry.avgPnl.toFixed(0)} avg</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Development Stage */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Trader Development Stage
        </h2>
        <DevelopmentStagePanel trades={closedTrades} />
      </section>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: PsychologyInsight }) {
  const borderColor =
    insight.severity === "critical"
      ? "border-red-500/50"
      : insight.severity === "warning"
        ? "border-yellow-500/50"
        : insight.severity === "positive"
          ? "border-green-500/50"
          : "border-white/10";

  const icon =
    insight.severity === "critical" ? (
      <AlertTriangle className="w-4 h-4 text-red-400" />
    ) : insight.severity === "warning" ? (
      <AlertTriangle className="w-4 h-4 text-yellow-400" />
    ) : insight.severity === "positive" ? (
      <TrendingUp className="w-4 h-4 text-green-400" />
    ) : (
      <Brain className="w-4 h-4 opacity-50" />
    );

  return (
    <div className={`rounded-lg border ${borderColor} bg-white/5 p-4`}>
      <div className="flex items-start gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-medium leading-tight">{insight.title}</h3>
      </div>
      <p className="text-xs opacity-60 leading-relaxed">{insight.description}</p>
      <p className="text-[10px] opacity-40 mt-2">{insight.framework}</p>
    </div>
  );
}

function EmotionPnlChart({
  data,
  colors,
}: {
  data: PsychologyCorrelations["emotionCorrelations"];
  colors: ReturnType<typeof getChartColors>;
}) {
  const filtered = data.filter((d) => d.tradeCount >= 3 && d.value !== "Untagged");
  const chartData = filtered.map((d) => ({
    name: d.value,
    avgPnl: d.avgPnl,
    winRate: d.winRate,
    count: d.tradeCount,
  }));

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="name" tick={{ fill: colors.tick, fontSize: 11 }} />
          <YAxis tick={{ fill: colors.tick, fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
            formatter={(value, name) => {
              const v = Number(value ?? 0);
              return [
                name === "avgPnl" ? `$${v.toFixed(2)}` : `${v}%`,
                name === "avgPnl" ? "Avg P&L" : "Win Rate",
              ];
            }}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.name === String(label));
              return `${label} (${item?.count ?? 0} trades)`;
            }}
          />
          <ReferenceLine y={0} stroke={colors.tick} strokeOpacity={0.3} />
          <Bar dataKey="avgPnl" name="Avg P&L" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.avgPnl >= 0 ? colors.win : colors.loss} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ConfidenceChart({
  data,
  colors,
}: {
  data: PsychologyCorrelations["confidenceCalibration"];
  colors: ReturnType<typeof getChartColors>;
}) {
  const chartData = data.map((d) => ({
    confidence: d.confidence,
    actual: d.actualWinRate,
    expected: d.confidence * 10,
    count: d.tradeCount,
    gap: d.gap,
  }));

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs opacity-50 mb-3">
        Dots above the line = underconfident (good). Below = overconfident (dangerous).
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis
            dataKey="confidence"
            name="Confidence"
            type="number"
            domain={[1, 10]}
            tick={{ fill: colors.tick, fontSize: 11 }}
            label={{ value: "Self-rated Confidence", position: "bottom", fill: colors.tick, fontSize: 10 }}
          />
          <YAxis
            dataKey="actual"
            name="Actual Win %"
            tick={{ fill: colors.tick, fontSize: 11 }}
            label={{ value: "Actual Win %", angle: -90, position: "insideLeft", fill: colors.tick, fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
            formatter={(value, name) => [
              name === "actual" ? `${Number(value ?? 0)}%` : value,
              name === "actual" ? "Actual Win Rate" : String(name),
            ]}
            labelFormatter={() => ""}
          />
          {/* Diagonal reference: perfect calibration would be y = x * 10 */}
          <ReferenceLine
            y={50}
            stroke={colors.tick}
            strokeOpacity={0.2}
            strokeDasharray="5 5"
            label={{ value: "50% baseline", fill: colors.tick, fontSize: 9 }}
          />
          <Scatter data={chartData} fill={colors.accent}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.gap >= 0 ? colors.win : colors.loss} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimeCorrelationChart({
  data,
  colors,
}: {
  data: PsychologyCorrelations["timeCorrelations"];
  colors: ReturnType<typeof getChartColors>;
}) {
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const sorted = [...data].sort((a, b) => dayOrder.indexOf(a.value) - dayOrder.indexOf(b.value));
  const chartData = sorted.map((d) => ({
    name: d.value.slice(0, 3),
    totalPnl: d.totalPnl,
    winRate: d.winRate,
    count: d.tradeCount,
  }));

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="name" tick={{ fill: colors.tick, fontSize: 11 }} />
          <YAxis tick={{ fill: colors.tick, fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Total P&L"]}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.name === String(label));
              return `${label} (${item?.count ?? 0} trades, ${item?.winRate ?? 0}% WR)`;
            }}
          />
          <ReferenceLine y={0} stroke={colors.tick} strokeOpacity={0.3} />
          <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.totalPnl >= 0 ? colors.win : colors.loss} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DetectionPanel({
  trades,
  correlations,
}: {
  trades: Trade[];
  correlations: PsychologyCorrelations;
}) {
  const sabotage = useMemo(() => detectSelfSabotage(trades), [trades]);
  const thermostat = useMemo(() => detectWealthThermostat(trades), [trades]);
  const homeostasis = useMemo(() => detectRiskHomeostasis(trades), [trades]);
  const endowment = useMemo(() => detectEndowmentEffect(trades), [trades]);
  const anchoring = useMemo(() => detectAnchoringPatterns(trades), [trades]);

  const alerts: { label: string; detail: string; framework: string }[] = [];

  if (thermostat) {
    alerts.push({
      label: `Wealth Thermostat at $${thermostat.ceilingLevel}`,
      detail: `Hit ${thermostat.peakCount} times, avg retrace ${thermostat.avgRetracePercent}%`,
      framework: "Freud/Van Tharp",
    });
  }

  for (const sig of sabotage) {
    alerts.push({
      label: sig.type === "process_break" ? "Self-Sabotage: Process Breaks" : "Self-Sabotage: Profit Givebacks",
      detail: `${sig.occurrences} occurrences detected`,
      framework: "Jung (Shadow)",
    });
  }

  if (homeostasis) {
    alerts.push({
      label: `Risk Homeostasis: ${homeostasis.direction === "doubling_down" ? "Doubling Down" : "Compensating"}`,
      detail: `Position sizes change ${homeostasis.changePercent}% after losses vs wins`,
      framework: "Van Tharp",
    });
  }

  for (const e of endowment.slice(0, 2)) {
    alerts.push({
      label: `Disposition Effect: ${e.symbol}`,
      detail: `Holds losers ${e.ratio.toFixed(1)}x longer than winners (win: ${e.avgHoldWin.toFixed(1)}h, loss: ${e.avgHoldLoss.toFixed(1)}h)`,
      framework: "Kahneman",
    });
  }

  for (const a of anchoring.slice(0, 2)) {
    alerts.push({
      label: `Anchoring: ${a.symbol}`,
      detail: `${a.tradeCount} entries near ${a.pattern === "round_number" ? `$${a.anchorPrice}` : `previous price $${a.anchorPrice}`}`,
      framework: "Kahneman",
    });
  }

  // Add new detections from correlation engine
  if (correlations.dispositionRatio && correlations.dispositionRatio.interpretation === "strong_disposition") {
    alerts.push({
      label: "Strong Disposition Effect (Portfolio-Wide)",
      detail: `Holding losers ${correlations.dispositionRatio.ratio}x longer than winners across all trades`,
      framework: "Kahneman (Prospect Theory)",
    });
  }

  for (const r of correlations.repetitionCompulsions.slice(0, 2)) {
    alerts.push({
      label: `Repetition Compulsion: ${r.symbol}`,
      detail: `${r.occurrences} repeated ${r.direction} losses, $${r.totalLoss.toFixed(0)} total (process: ${r.avgProcessScore}/10)`,
      framework: "Freud",
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
        <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm opacity-50">No significant pattern alerts detected. Keep logging!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {alerts.map((alert, i) => (
        <div key={i} className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{alert.label}</p>
              <p className="text-xs opacity-60 mt-0.5">{alert.detail}</p>
              <p className="text-[10px] opacity-40 mt-1">{alert.framework}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DevelopmentStagePanel({ trades }: { trades: Trade[] }) {
  const stage = useMemo(() => calculatePsychDevelopmentStage(trades, [], []), [trades]);

  const stageLabels = [
    "Unconscious Incompetence",
    "Conscious Incompetence",
    "Conscious Competence",
    "Unconscious Competence",
    "Mastery",
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl font-bold">{stage.stage}/5</div>
        <div>
          <p className="text-sm font-medium">{stage.label}</p>
          <p className="text-xs opacity-50">{stage.nextStageHint}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-4">
        {stageLabels.map((label, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < stage.stage ? "bg-cyan-500" : "bg-white/10"
            }`}
            title={label}
          />
        ))}
      </div>

      {/* Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {stage.criteria.met.map((c, i) => (
          <div key={`met-${i}`} className="flex items-center gap-2 text-xs">
            <TrendingUp className="w-3 h-3 text-green-400 shrink-0" />
            <span className="opacity-70">{c}</span>
          </div>
        ))}
        {stage.criteria.unmet.map((c, i) => (
          <div key={`unmet-${i}`} className="flex items-center gap-2 text-xs">
            <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />
            <span className="opacity-50">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
