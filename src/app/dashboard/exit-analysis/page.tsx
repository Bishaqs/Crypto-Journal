"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { StatBlock } from "@/components/ui/stat-block";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Gauge, Clock, Layers,
  Crosshair, ArrowUpDown, Sun, Moon,
} from "lucide-react";
import {
  analyzeExits,
  bestExitPnlChart,
  exitEfficiencyDistribution,
  exitTimeAnalysis,
  eodExitComparison,
  exitByDayOfWeek,
  holdDurationAnalysis,
  type TradeExitAnalysis,
} from "@/lib/exit-calculations";

/* ────────────────────────────────────────────────────────────────── */
/*  Tab definitions                                                   */
/* ────────────────────────────────────────────────────────────────── */

type TabId = "best-exit-pnl" | "best-exit-efficiency" | "best-exit-time" | "eod-pnl" | "eod-efficiency" | "multi-tf";

interface TabGroup {
  group: string | null;
  tabs: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[];
}

const TAB_GROUPS: TabGroup[] = [
  {
    group: "Best Exit",
    tabs: [
      { id: "best-exit-pnl", label: "Exit PnL", icon: TrendingUp },
      { id: "best-exit-efficiency", label: "Exit Efficiency", icon: Gauge },
      { id: "best-exit-time", label: "Exit Time", icon: Clock },
    ],
  },
  {
    group: "EOD Exit",
    tabs: [
      { id: "eod-pnl", label: "Exit PnL", icon: TrendingDown },
      { id: "eod-efficiency", label: "Exit Efficiency", icon: Gauge },
    ],
  },
  {
    group: null,
    tabs: [
      { id: "multi-tf", label: "Multi-Timeframe", icon: Layers },
    ],
  },
];

/* ────────────────────────────────────────────────────────────────── */
/*  Page wrapper (Suspense boundary for useSearchParams)              */
/* ────────────────────────────────────────────────────────────────── */

export default function ExitAnalysisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <ExitAnalysisContent />
    </Suspense>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Page content                                                      */
/* ────────────────────────────────────────────────────────────────── */

function ExitAnalysisContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = (searchParams.get("tab") as TabId) || "best-exit-pnl";
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase.from("trades").select("*").order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) { setTrades(DEMO_TRADES); setUsingDemo(true); } else { setTrades(dbTrades); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const filtered = useMemo(() => filterTrades(trades), [trades, filterTrades]);
  const exits = useMemo(() => analyzeExits(filtered), [filtered]);

  function setTab(tab: TabId) {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const tooltipStyle = {
    background: colors.tooltipBg,
    backdropFilter: "blur(16px)",
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  const fmt = (n: number) => n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crosshair size={24} className="text-accent" />
            Exit Analysis
          </h1>
          <p className="text-sm text-muted mt-1">Analyze your exit timing, efficiency, and patterns</p>
        </div>
        <div className="text-sm text-muted">
          {exits.length} closed trade{exits.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Tab bar */}
      <div className="glass rounded-2xl border border-border/50 p-1.5 flex flex-wrap gap-1" style={{ boxShadow: "var(--shadow-card)" }}>
        {TAB_GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-1">
            {group.group && gi > 0 && <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />}
            {group.group && (
              <span className="text-[10px] uppercase tracking-wider text-muted/50 font-semibold px-1.5 hidden sm:inline">{group.group}</span>
            )}
            {group.tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-muted hover:text-foreground hover:bg-surface-hover border border-transparent"
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Tab content */}
      {exits.length === 0 ? (
        <div className="glass rounded-2xl border border-border/50 p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <Crosshair size={48} className="text-muted/30 mx-auto mb-4" />
          <p className="text-muted">No closed trades found. Exit analysis requires trades with exit prices.</p>
        </div>
      ) : (
        <>
          {activeTab === "best-exit-pnl" && <BestExitPnlTab exits={exits} colors={colors} tooltipStyle={tooltipStyle} fmt={fmt} />}
          {activeTab === "best-exit-efficiency" && <BestExitEfficiencyTab exits={exits} colors={colors} tooltipStyle={tooltipStyle} fmt={fmt} />}
          {activeTab === "best-exit-time" && <BestExitTimeTab exits={exits} colors={colors} tooltipStyle={tooltipStyle} fmt={fmt} fmtPct={fmtPct} />}
          {activeTab === "eod-pnl" && <EodPnlTab exits={exits} colors={colors} tooltipStyle={tooltipStyle} fmt={fmt} fmtPct={fmtPct} />}
          {activeTab === "eod-efficiency" && <EodEfficiencyTab exits={exits} colors={colors} tooltipStyle={tooltipStyle} fmt={fmt} fmtPct={fmtPct} />}
          {activeTab === "multi-tf" && <MultiTimeframeTab exits={exits} colors={colors} tooltipStyle={tooltipStyle} fmt={fmt} fmtPct={fmtPct} />}
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Shared props                                                      */
/* ────────────────────────────────────────────────────────────────── */

interface TabProps {
  exits: TradeExitAnalysis[];
  colors: ReturnType<typeof getChartColors>;
  tooltipStyle: React.CSSProperties;
  fmt: (n: number) => string;
  fmtPct?: (n: number) => string;
}

/* ────────────────────────────────────────────────────────────────── */
/*  Best Exit PnL                                                     */
/* ────────────────────────────────────────────────────────────────── */

function BestExitPnlTab({ exits, colors, tooltipStyle, fmt }: TabProps) {
  const chartData = useMemo(() => bestExitPnlChart(exits), [exits]);
  const totalPnl = exits.reduce((s, e) => s + e.pnl, 0);
  const wins = exits.filter(e => e.isWin);
  const losses = exits.filter(e => !e.isWin);
  const avgWin = wins.length > 0 ? wins.reduce((s, e) => s + e.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, e) => s + e.pnl, 0) / losses.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Total PnL" value={fmt(totalPnl)} icon={TrendingUp} color={totalPnl >= 0 ? "text-win" : "text-loss"} />
        <StatBlock label="Avg Win" value={fmt(avgWin)} icon={TrendingUp} color="text-win" />
        <StatBlock label="Avg Loss" value={fmt(avgLoss)} icon={TrendingDown} color="text-loss" />
        <StatBlock label="Win Rate" value={`${exits.length > 0 ? ((wins.length / exits.length) * 100).toFixed(1) : 0}%`} icon={Gauge} color="text-accent" />
      </div>
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Top Trades by PnL Impact</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="symbol" tick={{ fill: colors.tick, fontSize: 11 }} />
            <YAxis tick={{ fill: colors.tick, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value?: number) => [fmt(value ?? 0), "PnL"]} />
            <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Best Exit Efficiency                                              */
/* ────────────────────────────────────────────────────────────────── */

function BestExitEfficiencyTab({ exits, colors, tooltipStyle, fmt }: TabProps) {
  const efficiency = useMemo(() => exitEfficiencyDistribution(exits), [exits]);
  const avgPnlPerHour = exits.length > 0 ? exits.reduce((s, e) => s + e.pnlPerHour, 0) / exits.length : 0;
  const avgHold = exits.length > 0 ? exits.reduce((s, e) => s + e.holdHours, 0) / exits.length : 0;
  const fmtHours = (h: number) => h < 1 ? `${Math.round(h * 60)}m` : h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;

  const pieColors = [colors.win, colors.accent, "#60a5fa", "#a1a1aa", colors.loss, "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBlock label="Avg PnL/Hour" value={fmt(avgPnlPerHour)} icon={Gauge} color={avgPnlPerHour >= 0 ? "text-win" : "text-loss"} />
        <StatBlock label="Avg Hold Time" value={fmtHours(avgHold)} icon={Clock} color="text-accent" />
        <StatBlock label="Categories" value={`${efficiency.length}`} icon={ArrowUpDown} color="text-foreground" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Efficiency Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={efficiency} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100} label={(props: { name?: string; value?: number }) => `${props.name ?? ""} (${props.value ?? 0})`}>
                {efficiency.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} fillOpacity={0.8} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Efficiency Breakdown</h3>
          <div className="space-y-3">
            {efficiency.map(b => (
              <div key={b.label} className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{b.label}</p>
                  <p className="text-xs text-muted">{b.count} trade{b.count !== 1 ? "s" : ""} &middot; {fmtHours(b.avgHoldHours)} avg hold</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${b.avgPnl >= 0 ? "text-win" : "text-loss"}`}>{fmt(b.avgPnl)}</p>
                  <p className="text-xs text-muted">{fmt(b.avgPnlPerHour)}/hr</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Best Exit Time                                                    */
/* ────────────────────────────────────────────────────────────────── */

function BestExitTimeTab({ exits, colors, tooltipStyle, fmt, fmtPct }: TabProps) {
  const timeSlots = useMemo(() => exitTimeAnalysis(exits), [exits]);
  const bestHour = timeSlots.length > 0 ? timeSlots.reduce((best, s) => s.avgPnl > best.avgPnl ? s : best, timeSlots[0]) : null;
  const worstHour = timeSlots.length > 0 ? timeSlots.reduce((worst, s) => s.avgPnl < worst.avgPnl ? s : worst, timeSlots[0]) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBlock
          label="Best Exit Hour"
          value={bestHour ? `${bestHour.hour}:00` : "—"}
          sub={bestHour ? `${fmt(bestHour.avgPnl)} avg` : undefined}
          icon={TrendingUp}
          color="text-win"
        />
        <StatBlock
          label="Worst Exit Hour"
          value={worstHour ? `${worstHour.hour}:00` : "—"}
          sub={worstHour ? `${fmt(worstHour.avgPnl)} avg` : undefined}
          icon={TrendingDown}
          color="text-loss"
        />
        <StatBlock label="Active Hours" value={`${timeSlots.length}`} icon={Clock} color="text-accent" />
      </div>
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">PnL by Exit Hour</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={timeSlots} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="hour" tick={{ fill: colors.tick, fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
            <YAxis tick={{ fill: colors.tick, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value?: number, name?: string) => [
                name === "avgPnl" ? fmt(value ?? 0) : name === "winRate" ? fmtPct!(value ?? 0) : `${value ?? 0}`,
                name === "avgPnl" ? "Avg PnL" : name === "winRate" ? "Win Rate" : "Trades",
              ]}
              labelFormatter={(h) => `${h}:00 - ${Number(h) + 1}:00`}
            />
            <Bar dataKey="avgPnl" radius={[6, 6, 0, 0]}>
              {timeSlots.map((entry, i) => (
                <Cell key={i} fill={entry.avgPnl >= 0 ? colors.win : colors.loss} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Win Rate by Exit Hour</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeSlots} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="hour" tick={{ fill: colors.tick, fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
            <YAxis tick={{ fill: colors.tick, fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value?: number) => [fmtPct!(value ?? 0), "Win Rate"]} labelFormatter={(h) => `${h}:00 - ${Number(h) + 1}:00`} />
            <Bar dataKey="winRate" radius={[6, 6, 0, 0]} fill={colors.accent} fillOpacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  EOD Exit PnL                                                      */
/* ────────────────────────────────────────────────────────────────── */

function EodPnlTab({ exits, colors, tooltipStyle, fmt, fmtPct }: TabProps) {
  const eod = useMemo(() => eodExitComparison(exits), [exits]);

  const comparisonData = [
    { label: "Same Day", ...eod.sameDay },
    { label: "Overnight", ...eod.overnight },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Same Day card */}
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sun size={18} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Same-Day Closes</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted">Trades</p>
              <p className="text-lg font-bold text-foreground">{eod.sameDay.count}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Win Rate</p>
              <p className="text-lg font-bold text-accent">{fmtPct!(eod.sameDay.winRate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Total PnL</p>
              <p className={`text-lg font-bold ${eod.sameDay.totalPnl >= 0 ? "text-win" : "text-loss"}`}>{fmt(eod.sameDay.totalPnl)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Avg PnL</p>
              <p className={`text-lg font-bold ${eod.sameDay.avgPnl >= 0 ? "text-win" : "text-loss"}`}>{fmt(eod.sameDay.avgPnl)}</p>
            </div>
          </div>
        </div>

        {/* Overnight card */}
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Moon size={18} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Overnight Holds</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted">Trades</p>
              <p className="text-lg font-bold text-foreground">{eod.overnight.count}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Win Rate</p>
              <p className="text-lg font-bold text-accent">{fmtPct!(eod.overnight.winRate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Total PnL</p>
              <p className={`text-lg font-bold ${eod.overnight.totalPnl >= 0 ? "text-win" : "text-loss"}`}>{fmt(eod.overnight.totalPnl)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Avg PnL</p>
              <p className={`text-lg font-bold ${eod.overnight.avgPnl >= 0 ? "text-win" : "text-loss"}`}>{fmt(eod.overnight.avgPnl)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison chart */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Same-Day vs Overnight Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="label" tick={{ fill: colors.tick, fontSize: 12 }} />
            <YAxis tick={{ fill: colors.tick, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value?: number) => [fmt(value ?? 0), "Avg PnL"]} />
            <Bar dataKey="avgPnl" radius={[6, 6, 0, 0]}>
              {comparisonData.map((entry, i) => (
                <Cell key={i} fill={entry.avgPnl >= 0 ? colors.win : colors.loss} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  EOD Exit Efficiency                                               */
/* ────────────────────────────────────────────────────────────────── */

function EodEfficiencyTab({ exits, colors, tooltipStyle, fmt, fmtPct }: TabProps) {
  const dayData = useMemo(() => exitByDayOfWeek(exits), [exits]);
  const bestDay = dayData.length > 0 ? dayData.reduce((best, d) => d.avgPnl > best.avgPnl ? d : best, dayData[0]) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBlock label="Best Exit Day" value={bestDay?.day ?? "—"} sub={bestDay ? `${fmt(bestDay.avgPnl)} avg` : undefined} icon={TrendingUp} color="text-win" />
        <StatBlock label="Days Traded" value={`${dayData.length}`} icon={Clock} color="text-accent" />
        <StatBlock label="Total Exits" value={`${exits.length}`} icon={Crosshair} color="text-foreground" />
      </div>

      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Avg PnL by Exit Day of Week</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={dayData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="day" tick={{ fill: colors.tick, fontSize: 12 }} />
            <YAxis tick={{ fill: colors.tick, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value?: number, name?: string) => [name === "avgPnl" ? fmt(value ?? 0) : name === "winRate" ? fmtPct!(value ?? 0) : `${value ?? 0}`, name === "avgPnl" ? "Avg PnL" : name === "winRate" ? "Win Rate" : "Trades"]} />
            <Bar dataKey="avgPnl" radius={[6, 6, 0, 0]}>
              {dayData.map((entry, i) => (
                <Cell key={i} fill={entry.avgPnl >= 0 ? colors.win : colors.loss} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day-by-day breakdown table */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Day-by-Day Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs border-b border-border/50">
                <th className="text-left py-2 px-3">Day</th>
                <th className="text-right py-2 px-3">Trades</th>
                <th className="text-right py-2 px-3">Win Rate</th>
                <th className="text-right py-2 px-3">Total PnL</th>
                <th className="text-right py-2 px-3">Avg PnL</th>
              </tr>
            </thead>
            <tbody>
              {dayData.map(d => (
                <tr key={d.day} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-foreground">{d.day}</td>
                  <td className="py-2.5 px-3 text-right text-muted">{d.count}</td>
                  <td className="py-2.5 px-3 text-right text-accent">{fmtPct!(d.winRate)}</td>
                  <td className={`py-2.5 px-3 text-right font-medium ${d.totalPnl >= 0 ? "text-win" : "text-loss"}`}>{fmt(d.totalPnl)}</td>
                  <td className={`py-2.5 px-3 text-right font-medium ${d.avgPnl >= 0 ? "text-win" : "text-loss"}`}>{fmt(d.avgPnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Multi-Timeframe                                                   */
/* ────────────────────────────────────────────────────────────────── */

function MultiTimeframeTab({ exits, colors, tooltipStyle, fmt, fmtPct }: TabProps) {
  const buckets = useMemo(() => holdDurationAnalysis(exits), [exits]);
  const bestBucket = buckets.length > 0 ? buckets.reduce((best, b) => b.avgPnl > best.avgPnl ? b : best, buckets[0]) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBlock label="Best Timeframe" value={bestBucket?.label ?? "—"} sub={bestBucket ? `${fmt(bestBucket.avgPnl)} avg` : undefined} icon={Layers} color="text-win" />
        <StatBlock label="Timeframes" value={`${buckets.length}`} icon={Clock} color="text-accent" />
        <StatBlock label="Total Exits" value={`${exits.length}`} icon={Crosshair} color="text-foreground" />
      </div>

      {/* PnL by hold duration chart */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Avg PnL by Hold Duration</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={buckets} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="label" tick={{ fill: colors.tick, fontSize: 11 }} />
            <YAxis tick={{ fill: colors.tick, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value?: number, name?: string) => [name === "avgPnl" ? fmt(value ?? 0) : `${value ?? 0}`, name === "avgPnl" ? "Avg PnL" : "Trades"]} />
            <Bar dataKey="avgPnl" radius={[6, 6, 0, 0]}>
              {buckets.map((entry, i) => (
                <Cell key={i} fill={entry.avgPnl >= 0 ? colors.win : colors.loss} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Win rate by hold duration */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Win Rate by Hold Duration</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={buckets} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="label" tick={{ fill: colors.tick, fontSize: 11 }} />
            <YAxis tick={{ fill: colors.tick, fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value?: number) => [fmtPct!(value ?? 0), "Win Rate"]} />
            <Bar dataKey="winRate" radius={[6, 6, 0, 0]} fill={colors.accent} fillOpacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown table */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Timeframe Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs border-b border-border/50">
                <th className="text-left py-2 px-3">Duration</th>
                <th className="text-right py-2 px-3">Trades</th>
                <th className="text-right py-2 px-3">Win Rate</th>
                <th className="text-right py-2 px-3">Total PnL</th>
                <th className="text-right py-2 px-3">Avg PnL</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map(b => (
                <tr key={b.label} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-foreground">{b.label}</td>
                  <td className="py-2.5 px-3 text-right text-muted">{b.count}</td>
                  <td className="py-2.5 px-3 text-right text-accent">{fmtPct!(b.winRate)}</td>
                  <td className={`py-2.5 px-3 text-right font-medium ${b.totalPnl >= 0 ? "text-win" : "text-loss"}`}>{fmt(b.totalPnl)}</td>
                  <td className={`py-2.5 px-3 text-right font-medium ${b.avgPnl >= 0 ? "text-win" : "text-loss"}`}>{fmt(b.avgPnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
