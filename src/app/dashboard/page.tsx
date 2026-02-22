"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useDateRange } from "@/lib/date-range-context";
import {
  calculateStats,
  calculateDailyPnl,
  buildEquityCurve,
  detectTiltSignals,
  calculateAdvancedStats,
} from "@/lib/calculations";
import { useTheme } from "@/lib/theme-context";
import { calculateTaxReport } from "@/lib/tax-calculator";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TradesTable } from "@/components/dashboard/trades-table";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { PnlChart } from "@/components/dashboard/pnl-chart";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { TradeForm } from "@/components/trade-form";
import { TiltWarnings } from "@/components/dashboard/tilt-warnings";
import { StreakWidget } from "@/components/dashboard/streak-widget";
import { AISummaryWidget } from "@/components/dashboard/ai-summary-widget";
import { Header } from "@/components/header";
import { getDailyGreeting, getDisplayName } from "@/lib/greetings";
import { Plus, Sparkles, Download, Upload, Activity, Dices, Receipt, TrendingUp, Calculator } from "lucide-react";
import Link from "next/link";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const { filterTrades } = useDateRange();
  const { viewMode } = useTheme();
  const supabase = createClient();

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });

    const dbTrades = (data as Trade[]) ?? [];

    if (dbTrades.length === 0) {
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
      setUsingDemo(false);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const filteredTrades = useMemo(() => filterTrades(trades), [trades, filterTrades]);

  const stats = useMemo(() => calculateStats(filteredTrades), [filteredTrades]);
  const dailyPnl = useMemo(() => calculateDailyPnl(filteredTrades), [filteredTrades]);
  const equityData = useMemo(() => buildEquityCurve(dailyPnl), [dailyPnl]);
  const tiltSignals = useMemo(() => detectTiltSignals(filteredTrades), [filteredTrades]);
  const adv = useMemo(() => viewMode === "advanced" ? calculateAdvancedStats(filteredTrades) : null, [viewMode, filteredTrades]);
  const taxReport = useMemo(() => viewMode === "advanced" ? calculateTaxReport(trades, new Date().getFullYear()) : null, [viewMode, trades]);

  // Save sentiment for light theme candle background
  useEffect(() => {
    const sentiment = stats.closedPnl > 100 ? "bullish"
      : stats.closedPnl < -100 ? "bearish"
      : "consolidation";
    localStorage.setItem("stargate-candle-sentiment", sentiment);
  }, [stats.closedPnl]);

  // Export trades as CSV
  function exportCSV() {
    const headers = ["symbol", "position", "entry_price", "exit_price", "quantity", "fees", "open_timestamp", "close_timestamp", "pnl", "tags", "notes"];
    const rows = trades
      .filter((t) => !t.id.startsWith("demo-"))
      .map((t) =>
        headers.map((h) => {
          const val = t[h as keyof Trade];
          if (Array.isArray(val)) return val.join(";");
          if (val === null || val === undefined) return "";
          return String(val);
        }).join(",")
      );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stargate-trades-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import trades from CSV
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",");

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => (row[h.trim()] = values[idx]?.trim() ?? ""));

        await supabase.from("trades").insert({
          symbol: row.symbol,
          position: row.position,
          entry_price: parseFloat(row.entry_price) || 0,
          exit_price: row.exit_price ? parseFloat(row.exit_price) : null,
          quantity: parseFloat(row.quantity) || 0,
          fees: parseFloat(row.fees) || 0,
          open_timestamp: row.open_timestamp,
          close_timestamp: row.close_timestamp || null,
          pnl: row.pnl ? parseFloat(row.pnl) : null,
          tags: row.tags ? row.tags.split(";") : [],
          notes: row.notes || null,
        });
      }
      fetchTrades();
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Welcome greeting */}
      <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="text-xs text-muted/60 uppercase tracking-widest font-semibold mb-1">
          gm, <span className="text-foreground">{getDisplayName()}</span>
        </p>
        <p className="text-base md:text-lg font-medium text-accent italic">
          &ldquo;{getDailyGreeting()}&rdquo;
        </p>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Overview
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {usingDemo ? (
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-accent" />
                Sample data — log a trade to begin
              </span>
            ) : (
              `${filteredTrades.length} positions in range`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-muted text-xs font-medium cursor-pointer hover:text-foreground hover:border-accent/30 transition-all">
            <Upload size={14} />
            Import
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={exportCSV}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-muted text-xs font-medium hover:text-foreground hover:border-accent/30 transition-all"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => {
              setEditTrade(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300 animate-[cosmic-pulse_3s_ease-in-out_infinite]"
          >
            <Plus size={18} />
            Log Trade
          </button>
        </div>
      </div>

      <TiltWarnings signals={tiltSignals} />
      <StatsCards stats={stats} />

      {/* Advanced mode stats — appears right below basic stats with smooth animation */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
        viewMode === "advanced" && adv ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
      }`}>
        {adv && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-accent" />
              <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">Advanced Metrics</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">Sharpe Ratio <InfoTooltip text="Risk-adjusted return metric. Measures excess return per unit of volatility. Above 1.0 = good, above 2.0 = excellent." size={11} /></p>
                <p className={`text-lg font-bold ${adv.sharpeRatio >= 1 ? "text-win" : adv.sharpeRatio >= 0 ? "text-foreground" : "text-loss"}`}>
                  {adv.sharpeRatio.toFixed(2)}
                </p>
              </div>
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">Expectancy <InfoTooltip text="Average profit per unit of risk. Positive = your system has an edge over time." size={11} /></p>
                <p className={`text-lg font-bold ${adv.expectancy >= 0 ? "text-win" : "text-loss"}`}>
                  {adv.expectancy >= 0 ? "+" : ""}${adv.expectancy.toFixed(2)}
                </p>
              </div>
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">Profit Factor</p>
                <p className={`text-lg font-bold ${adv.profitFactor >= 1.5 ? "text-win" : adv.profitFactor >= 1 ? "text-foreground" : "text-loss"}`}>
                  {adv.profitFactor === Infinity ? "∞" : adv.profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">Max Drawdown</p>
                <p className="text-lg font-bold text-loss">{adv.maxDrawdownPct.toFixed(1)}%</p>
              </div>
            </div>

            {/* Position Sizing Recommendation */}
            {(() => {
              const winRate = stats.winRate / 100;
              const avgWin = adv.avgWinner;
              const avgLoss = Math.abs(adv.avgLoser);
              const rr = avgLoss > 0 ? avgWin / avgLoss : 0;
              const kelly = rr > 0 ? (winRate * rr - (1 - winRate)) / rr : 0;
              const halfKelly = kelly / 2;
              const showKelly = kelly > 0 && kelly < 1;
              return (
                <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator size={14} className="text-accent" />
                    <span className="text-xs font-semibold text-foreground">Position Sizing</span>
                    <span className="text-[9px] text-muted/50 ml-auto">Based on Kelly Criterion</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-0.5">R:R Ratio</p>
                      <p className="text-lg font-bold text-foreground">{rr.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-0.5">Full Kelly</p>
                      <p className={`text-lg font-bold ${showKelly ? "text-win" : "text-loss"}`}>
                        {showKelly ? `${(kelly * 100).toFixed(1)}%` : "N/A"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-0.5">Half Kelly</p>
                      <p className={`text-lg font-bold ${showKelly ? "text-accent" : "text-loss"}`}>
                        {showKelly ? `${(halfKelly * 100).toFixed(1)}%` : "N/A"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-0.5">Suggested</p>
                      <p className="text-lg font-bold text-accent">
                        {showKelly ? `${Math.min(halfKelly * 100, 5).toFixed(1)}%` : "1-2%"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/simulations"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/15 transition-all"
                  >
                    <Dices size={12} />
                    Stress-test in Monte Carlo
                  </Link>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityCurve data={equityData} />
        <PnlChart data={dailyPnl} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TradesTable
            trades={filteredTrades}
            onEdit={
              usingDemo
                ? undefined
                : (trade) => {
                    setEditTrade(trade);
                    setShowForm(true);
                  }
            }
          />
        </div>
        <div className="space-y-6">
          <StreakWidget />
          <CalendarHeatmap dailyPnl={dailyPnl} />
          <AISummaryWidget trades={filteredTrades} />
          {/* Advanced mode links — in sidebar, visible immediately */}
          {viewMode === "advanced" && taxReport && (
            <div className="space-y-3">
              <Link href="/dashboard/simulations" className="glass rounded-xl border border-border/50 p-4 hover:border-accent/30 transition-all group block" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Dices size={14} className="text-accent" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Simulations</span>
                </div>
                <p className="text-[10px] text-muted">Stress-test your edge</p>
              </Link>
              <Link href="/dashboard/taxes" className="glass rounded-xl border border-border/50 p-4 hover:border-accent/30 transition-all group block" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Receipt size={14} className="text-accent" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Tax {new Date().getFullYear()}</span>
                </div>
                <p className={`text-sm font-bold ${taxReport.netGainLoss >= 0 ? "text-win" : "text-loss"}`}>
                  {taxReport.netGainLoss >= 0 ? "+" : "-"}${Math.abs(taxReport.netGainLoss).toFixed(2)}
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <TradeForm
          onClose={() => {
            setShowForm(false);
            setEditTrade(null);
          }}
          onSaved={fetchTrades}
          editTrade={editTrade}
        />
      )}
    </div>
  );
}
