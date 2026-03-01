"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { CalendarDays, Search, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";

interface MonthlyReturn {
  month: string;
  avgReturn: number;
  count: number;
}

interface DayOfWeekReturn {
  day: string;
  avgReturn: number;
  count: number;
}

interface SeasonalityData {
  monthly: MonthlyReturn[];
  dayOfWeek: DayOfWeekReturn[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function StatBlock({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function SeasonalityPage() {
  usePageTour("seasonality-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [symbol, setSymbol] = useState("BTC");
  const [inputValue, setInputValue] = useState("BTC");
  const [data, setData] = useState<SeasonalityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeasonality = useCallback(async (sym: string) => {
    if (!sym.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/seasonality?symbol=${encodeURIComponent(sym)}&days=365`);
      if (!res.ok) throw new Error("Failed to fetch seasonality data");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Could not load seasonality data. Try a different symbol.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasonality(symbol);
  }, [symbol, fetchSeasonality]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed && trimmed !== symbol) {
      setSymbol(trimmed);
    }
  }

  const bestMonth = data?.monthly.reduce((best, m) => (m.avgReturn > best.avgReturn ? m : best), data.monthly[0]);
  const worstMonth = data?.monthly.reduce((worst, m) => (m.avgReturn < worst.avgReturn ? m : worst), data.monthly[0]);
  const bestDay = data?.dayOfWeek.reduce((best, d) => (d.avgReturn > best.avgReturn ? d : best), data.dayOfWeek[0]);
  const avgMonthlyReturn = data?.monthly.length
    ? data.monthly.reduce((sum, m) => sum + m.avgReturn, 0) / data.monthly.length
    : 0;

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <CalendarDays size={24} className="text-accent" />
          Seasonality Analysis
          <PageInfoButton tourName="seasonality-page" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Historical monthly and day-of-week return patterns
        </p>
      </div>

      {/* Symbol Search */}
      <form onSubmit={handleSearch} className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            placeholder="Enter symbol (BTC, ETH, SOL...)"
            className="w-full px-4 py-3 pl-9 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
        >
          Analyze
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      )}

      {!loading && !data && !error && (
        <div
          className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <CalendarDays size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Seasonality Data</h3>
          <p className="text-sm text-muted max-w-xs">
            Enter a symbol above to analyze historical return patterns by month and day of week.
          </p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBlock
              label="Best Month"
              value={bestMonth ? `${bestMonth.month} (${bestMonth.avgReturn >= 0 ? "+" : ""}${bestMonth.avgReturn.toFixed(2)}%)` : "N/A"}
              color="text-win"
            />
            <StatBlock
              label="Worst Month"
              value={worstMonth ? `${worstMonth.month} (${worstMonth.avgReturn >= 0 ? "+" : ""}${worstMonth.avgReturn.toFixed(2)}%)` : "N/A"}
              color="text-loss"
            />
            <StatBlock
              label="Best Day"
              value={bestDay ? `${bestDay.day} (${bestDay.avgReturn >= 0 ? "+" : ""}${bestDay.avgReturn.toFixed(2)}%)` : "N/A"}
              color="text-win"
            />
            <StatBlock
              label="Avg Monthly Return"
              value={`${avgMonthlyReturn >= 0 ? "+" : ""}${avgMonthlyReturn.toFixed(2)}%`}
              color={avgMonthlyReturn >= 0 ? "text-win" : "text-loss"}
            />
          </div>

          {/* Monthly Returns Chart */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Monthly Average Returns - {symbol}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: colors.tick }}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.tooltipBg,
                    backdropFilter: "blur(16px)",
                    border: colors.tooltipBorder,
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  formatter={(value) => { const v = Number(value ?? 0); return [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, "Avg Return"]; }}
                  labelFormatter={(label) => `${label}`}
                />
                <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
                <Bar dataKey="avgReturn" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {data.monthly.map((entry, index) => (
                    <Cell
                      key={`monthly-${index}`}
                      fill={entry.avgReturn >= 0 ? colors.win : colors.loss}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Day of Week Chart */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Day-of-Week Average Returns - {symbol}
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.dayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: colors.tick }}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.tooltipBg,
                    backdropFilter: "blur(16px)",
                    border: colors.tooltipBorder,
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  formatter={(value) => { const v = Number(value ?? 0); return [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, "Avg Return"]; }}
                  labelFormatter={(label) => `${label}`}
                />
                <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
                <Bar dataKey="avgReturn" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {data.dayOfWeek.map((entry, index) => (
                    <Cell
                      key={`dow-${index}`}
                      fill={entry.avgReturn >= 0 ? colors.win : colors.loss}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Data Table */}
          <div className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Detailed Monthly Breakdown
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Month</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Avg Return</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Data Points</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((m) => (
                  <tr key={m.month} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">{m.month}</td>
                    <td className={`px-4 py-3 text-xs font-bold tabular-nums ${m.avgReturn >= 0 ? "text-win" : "text-loss"}`}>
                      {m.avgReturn >= 0 ? "+" : ""}{m.avgReturn.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-xs text-muted tabular-nums">{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
