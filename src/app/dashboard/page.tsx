"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { Trade } from "@/lib/types";
import { useDateRange } from "@/lib/date-range-context";
import { useAccount } from "@/lib/account-context";
import {
  calculateStats,
  calculateDailyPnl,
  buildEquityCurve,
  detectTiltSignals,
  calculateAdvancedStats,
} from "@/lib/calculations";
import { useTheme, ViewMode } from "@/lib/theme-context";
import dynamic from "next/dynamic";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { TradesTable } from "@/components/dashboard/trades-table";
import { TradeForm } from "@/components/trade-form";
import { TiltWarnings } from "@/components/dashboard/tilt-warnings";
import { StreakWidget } from "@/components/dashboard/streak-widget";
import { XPBar } from "@/components/dashboard/xp-bar";
import { Header } from "@/components/header";
import { getDailyGreeting, getDisplayName } from "@/lib/greetings";
import { Plus, Sparkles, Download, Upload, Activity, Dices, Calculator, Bitcoin, Shield } from "lucide-react";
import { PreTradeReadiness } from "@/components/pre-trade-readiness";
import Link from "next/link";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { CSVImportModal } from "@/components/csv-import-modal";
import { GettingStartedCard } from "@/components/getting-started";
import { DEMO_TRADES } from "@/lib/demo-data";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { ProactiveInsightBar } from "@/components/dashboard/proactive-insight-bar";
import { PostTradePrompt } from "@/components/post-trade-prompt";
import { LowContrastWarning } from "@/components/low-contrast-warning";
import { PsychologyProfileBanner } from "@/components/psychology-profile-banner";
import { DeleteTradeConfirmation } from "@/components/delete-trade-confirmation";

// Lazy-load heavy below-fold components (Recharts, AI, News)
const EquityCurve = dynamic(() => import("@/components/dashboard/equity-curve").then(m => ({ default: m.EquityCurve })));
const PnlChart = dynamic(() => import("@/components/dashboard/pnl-chart").then(m => ({ default: m.PnlChart })));
const CalendarHeatmap = dynamic(() => import("@/components/dashboard/calendar-heatmap").then(m => ({ default: m.CalendarHeatmap })));
const ExpandableChart = dynamic(() => import("@/components/dashboard/expandable-chart/expandable-chart").then(m => ({ default: m.ExpandableChart })));
const AISummaryWidget = dynamic(() => import("@/components/dashboard/ai-summary-widget").then(m => ({ default: m.AISummaryWidget })));
const NewsWidget = dynamic(() => import("@/components/news/news-widget").then(m => ({ default: m.NewsWidget })));
import { useI18n } from "@/lib/i18n";
import { useCosmetics } from "@/lib/cosmetics";
import type { CosmeticRarity, UnlockCondition } from "@/lib/cosmetics/types";

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [advMetricsOpen, setAdvMetricsOpen] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [postTradeData, setPostTradeData] = useState<{ id: string; symbol: string; pnl: number } | null>(null);
  const [deletingTrade, setDeletingTrade] = useState<Trade | null>(null);
  const [showReadiness, setShowReadiness] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { filterTrades } = useDateRange();
  const { filterByAccount } = useAccount();
  const { viewMode, setViewModeTo } = useTheme();
  const { t } = useI18n();
  const { equipped, definitions, getDefinition } = useCosmetics();
  const supabase = createClient();

  // Resolve equipped cosmetic CSS classes
  const bannerCss = useMemo(() => {
    if (!equipped.banner) return null;
    return getDefinition(equipped.banner)?.css_class ?? null;
  }, [equipped.banner, getDefinition]);

  const nameStyleCss = useMemo(() => {
    if (!equipped.name_style) return null;
    return getDefinition(equipped.name_style)?.css_class ?? null;
  }, [equipped.name_style, getDefinition]);

  const equippedTitle = useMemo(() => {
    if (!equipped.title_badge) return null;
    const def = definitions.find((d) => d.id === equipped.title_badge);
    if (!def) return null;
    return { name: def.name, rarity: def.rarity };
  }, [equipped.title_badge, definitions]);

  const fetchTrades = useCallback(async () => {
    const { data, error } = await fetchAllTrades(supabase);

    if (error) {
      console.error("[Dashboard] fetchTrades error:", error.message);
      setFetchError("Failed to load trades. Please refresh the page.");
      setLoading(false);
      return;
    }

    const dbTrades = (data as Trade[]) ?? [];

    if (dbTrades.length === 0) {
      // Show demo data during tour so users see real-looking stats
      const tourActive = typeof sessionStorage !== "undefined" && sessionStorage.getItem("stargate-tour-active");
      setTrades(tourActive ? DEMO_TRADES : []);
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

  const filteredTrades = useMemo(() => filterByAccount(filterTrades(trades)), [trades, filterTrades, filterByAccount]);

  const stats = useMemo(() => calculateStats(filteredTrades), [filteredTrades]);
  const dailyPnl = useMemo(() => calculateDailyPnl(filteredTrades), [filteredTrades]);
  const equityData = useMemo(() => buildEquityCurve(dailyPnl), [dailyPnl]);
  const tiltSignals = useMemo(() => detectTiltSignals(filteredTrades, { excludeImported: true }), [filteredTrades]);
  const adv = useMemo(() => filteredTrades.length >= 2 ? calculateAdvancedStats(filteredTrades) : null, [filteredTrades]);


  // Save sentiment for light theme candle background
  useEffect(() => {
    const sentiment = stats.closedPnl > 100 ? "bullish"
      : stats.closedPnl < -100 ? "bearish"
      : "consolidation";
    localStorage.setItem("stargate-candle-sentiment", sentiment);
  }, [stats.closedPnl]);

  // Export trades as CSV
  function exportCSV() {
    const headers = [
      "symbol", "position", "entry_price", "exit_price", "quantity", "fees",
      "open_timestamp", "close_timestamp", "pnl", "tags", "notes",
      "emotion", "confidence", "setup_type", "process_score",
      "trade_source", "chain", "dex_protocol", "tx_hash", "wallet_address",
      "gas_fee", "gas_fee_native",
    ];
    const realTrades = trades.filter((t) => !t.id.startsWith("demo-"));
    if (realTrades.length === 0) return;
    const rows = realTrades.map((t) =>
      headers.map((h) => {
        const val = t[h as keyof Trade];
        if (Array.isArray(val)) return `"${val.join(";")}"`;
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") ? `"${str}"` : str;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traverse-trades-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {fetchError}
        </div>
      )}

      {/* Asset Identity Badge */}
      <div className="flex items-center justify-center py-1">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20">
          <Bitcoin size={18} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Crypto</span>
        </div>
      </div>

      {!usingDemo && viewMode !== "beginner" && <ProactiveInsightBar trades={filteredTrades} tiltSignals={tiltSignals} />}

      {/* Welcome greeting */}
      <div className="relative glass rounded-2xl border border-border/50 p-4 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {bannerCss && (
          <div className={`absolute inset-0 ${bannerCss} opacity-20 pointer-events-none`} style={{ mixBlendMode: "color" }} />
        )}
        <div className="relative z-10">
          <p className="text-xs text-muted/60 uppercase tracking-widest font-semibold mb-1">
            {t("dashboard.gm")}, <span className={`text-foreground ${nameStyleCss ?? ""}`}>{getDisplayName()}</span>
            {equippedTitle && (
              <span className={`ml-2 text-[10px] font-bold ${
                ({ common: "text-gray-400", uncommon: "text-emerald-400", rare: "text-blue-400", epic: "text-purple-400", legendary: "text-amber-400", mythic: "text-red-400" } as Record<CosmeticRarity, string>)[equippedTitle.rarity]
              }`}>
                {equippedTitle.name}
              </span>
            )}
          </p>
          <p className="text-base md:text-lg font-medium text-accent italic">
            &ldquo;{getDailyGreeting()}&rdquo;
          </p>
        </div>
      </div>

      <LowContrastWarning />

      {!usingDemo && viewMode !== "beginner" && <WeeklySummaryCard trades={trades} />}

      {usingDemo && (
        <GettingStartedCard
          onLogTrade={() => { setEditTrade(null); setShowForm(true); }}
          onImport={() => setShowImport(true)}
        />
      )}

      <PsychologyProfileBanner />

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {t("dashboard.overview")}
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {usingDemo ? (
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-accent" />
                {t("dashboard.sampleData")}
              </span>
            ) : (
              t("dashboard.positionsInRange", { count: filteredTrades.length })
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle removed — accessible in Settings only */}
          <button
            onClick={() => setShowImport(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-muted text-xs font-medium hover:text-foreground hover:border-accent/30 transition-all"
          >
            <Upload size={14} />
            {t("common.import")}
          </button>
          <button
            onClick={exportCSV}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-muted text-xs font-medium hover:text-foreground hover:border-accent/30 transition-all"
          >
            <Download size={14} />
            {t("common.export")}
          </button>
          <button
            onClick={() => setShowReadiness(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all shadow-[0_0_12px_rgba(0,180,216,0.15)]"
            title="Pre-Trade Readiness Check"
          >
            <Shield size={16} />
            Readiness Check
          </button>
          <div id="tour-log-trade">
            <button
              onClick={() => {
                setEditTrade(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300 animate-[cosmic-pulse_3s_ease-in-out_infinite]"
            >
              <Plus size={18} />
              {t("dashboard.logTrade")}
            </button>
          </div>
        </div>
      </div>

      <div id="tour-stats">
        <StatsCards stats={stats} advancedStats={adv} viewMode={viewMode} />
      </div>
      {viewMode !== "beginner" && <TiltWarnings signals={tiltSignals} />}

      {/* Advanced metrics — collapsible panel */}
      {viewMode !== "beginner" && adv && (
        <div>
          <button
            onClick={() => setAdvMetricsOpen((prev) => !prev)}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors py-1"
          >
            <Activity size={14} className="text-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">{t("dashboard.advancedMetrics")}</span>
            <svg className={`w-3 h-3 transition-transform ${advMetricsOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            advMetricsOpen ? "max-h-[800px] opacity-100 mt-3" : "max-h-0 opacity-0"
          }`}>
            <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">Sharpe Ratio <InfoTooltip text="Risk-adjusted return metric. Measures excess return per unit of volatility. Above 1.0 = good, above 2.0 = excellent." size={11} articleId="an2-sharpe-ratio" /></p>
                <p className={`text-lg font-bold ${adv.sharpeRatio >= 1 ? "text-win" : adv.sharpeRatio >= 0 ? "text-foreground" : "text-loss"}`}>
                  {adv.sharpeRatio.toFixed(2)}
                </p>
              </div>
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">Expectancy <InfoTooltip text="Average profit per unit of risk. Positive = your system has an edge over time." size={11} articleId="an-expectancy" /></p>
                <p className={`text-lg font-bold ${adv.expectancy >= 0 ? "text-win" : "text-loss"}`}>
                  {adv.expectancy >= 0 ? "+" : ""}${adv.expectancy.toFixed(2)}
                </p>
              </div>
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">Profit Factor <InfoTooltip text="Gross wins divided by gross losses. Above 1.0 = net positive edge." size={11} articleId="an-profit-factor" /></p>
                <p className={`text-lg font-bold ${adv.profitFactor >= 1.5 ? "text-win" : adv.profitFactor >= 1 ? "text-foreground" : "text-loss"}`}>
                  {adv.profitFactor === Infinity ? "∞" : adv.profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">Max Drawdown <InfoTooltip text="Largest peak-to-trough decline in your equity curve. Lower is better." size={11} articleId="rm-max-drawdown" /></p>
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
                    <span className="text-xs font-semibold text-foreground">{t("dashboard.positionSizing")}</span>
                    <span className="text-[9px] text-muted/50 ml-auto">{t("dashboard.basedOnKelly")}</span>
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
                    {t("dashboard.stressTest")}
                  </Link>
                </div>
              );
            })()}

          </div>
          </div>
        </div>
      )}

      {/* ── Beginner layout ────────────────────────── */}
      {viewMode === "beginner" && (
        <>
          {/* Equity Curve + Daily P&L */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpandableChart
              id="tour-equity"
              title="Equity Curve"
              titleExtra={
                equityData.length > 0 ? (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${equityData[equityData.length - 1].equity >= 0 ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
                    {equityData[equityData.length - 1].equity >= 0 ? "+" : ""}${equityData[equityData.length - 1].equity.toFixed(2)}
                  </span>
                ) : undefined
              }
              capabilities={{ zoom: true, chartSwitch: true, dataView: true, saveImage: true, defaultVariant: "area" }}
              data={equityData}
              columns={[
                { key: "date", label: "Date" },
                { key: "equity", label: "Equity", format: (v) => `$${Number(v).toFixed(2)}` },
              ]}
            >
              {({ height, variant, zoomedData, isExpanded, zoomHandlers }) => (
                <EquityCurve
                  data={(zoomedData as { date: string; equity: number }[]) ?? equityData}
                  height={height}
                  variant={variant}
                  showCard={!isExpanded}
                  zoomHandlers={zoomHandlers}
                />
              )}
            </ExpandableChart>
            <ExpandableChart
              id="tour-pnl-chart"
              title="Daily P&L"
              capabilities={{ zoom: true, chartSwitch: true, dataView: true, saveImage: true, defaultVariant: "bar" }}
              data={dailyPnl}
              columns={[
                { key: "date", label: "Date" },
                { key: "pnl", label: "P&L", format: (v) => `$${Number(v).toFixed(2)}` },
                { key: "tradeCount", label: "Trades" },
              ]}
            >
              {({ height, variant, zoomedData, isExpanded, zoomHandlers }) => (
                <PnlChart
                  data={(zoomedData as typeof dailyPnl) ?? dailyPnl}
                  height={height}
                  variant={variant}
                  showCard={!isExpanded}
                  zoomHandlers={zoomHandlers}
                />
              )}
            </ExpandableChart>
          </div>

          {/* Recent Trades (3 max) + Streak */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TradesTable
                trades={filteredTrades.slice(0, 3)}
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
            <div>
              <div id="tour-streak"><StreakWidget /></div>
              <XPBar />
            </div>
          </div>
        </>
      )}

      {/* ── Advanced/Expert layout ──────────────────── */}
      {viewMode !== "beginner" && (
        <>
          <div id="tour-ai-summary">
            <AISummaryWidget trades={filteredTrades} />
          </div>
          {viewMode === "expert" && (
            <Link href="/dashboard/simulations" className="glass rounded-xl border border-border/50 p-4 hover:border-accent/30 transition-all group block" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Dices size={14} className="text-accent" />
                <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">{t("sidebar.simulations")}</span>
              </div>
              <p className="text-[10px] text-muted">{t("dashboard.stressTestEdge")}</p>
            </Link>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpandableChart
              id="tour-equity"
              title="Equity Curve"
              titleExtra={
                equityData.length > 0 ? (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${equityData[equityData.length - 1].equity >= 0 ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
                    {equityData[equityData.length - 1].equity >= 0 ? "+" : ""}${equityData[equityData.length - 1].equity.toFixed(2)}
                  </span>
                ) : undefined
              }
              capabilities={{ zoom: true, chartSwitch: true, dataView: true, saveImage: true, defaultVariant: "area" }}
              data={equityData}
              columns={[
                { key: "date", label: "Date" },
                { key: "equity", label: "Equity", format: (v) => `$${Number(v).toFixed(2)}` },
              ]}
            >
              {({ height, variant, zoomedData, isExpanded, zoomHandlers }) => (
                <EquityCurve
                  data={(zoomedData as { date: string; equity: number }[]) ?? equityData}
                  height={height}
                  variant={variant}
                  showCard={!isExpanded}
                  zoomHandlers={zoomHandlers}
                />
              )}
            </ExpandableChart>
            <ExpandableChart
              id="tour-pnl-chart"
              title="Daily P&L"
              capabilities={{ zoom: true, chartSwitch: true, dataView: true, saveImage: true, defaultVariant: "bar" }}
              data={dailyPnl}
              columns={[
                { key: "date", label: "Date" },
                { key: "pnl", label: "P&L", format: (v) => `$${Number(v).toFixed(2)}` },
                { key: "tradeCount", label: "Trades" },
              ]}
            >
              {({ height, variant, zoomedData, isExpanded, zoomHandlers }) => (
                <PnlChart
                  data={(zoomedData as typeof dailyPnl) ?? dailyPnl}
                  height={height}
                  variant={variant}
                  showCard={!isExpanded}
                  zoomHandlers={zoomHandlers}
                />
              )}
            </ExpandableChart>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div id="tour-trades-table" className="lg:col-span-2 space-y-6">
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
              <div id="tour-streak"><StreakWidget /></div>
              <XPBar />
              <ExpandableChart
                id="tour-heatmap-mini"
                title="Calendar"
                capabilities={{ zoom: false, chartSwitch: false, dataView: true, saveImage: true, defaultVariant: "bar" }}
                data={dailyPnl}
                columns={[
                  { key: "date", label: "Date" },
                  { key: "pnl", label: "P&L", format: (v) => `$${Number(v).toFixed(2)}` },
                  { key: "tradeCount", label: "Trades" },
                ]}
              >
                {({ isExpanded }) => (
                  <CalendarHeatmap dailyPnl={dailyPnl} showCard={!isExpanded} />
                )}
              </ExpandableChart>
            </div>
          </div>

          <NewsWidget asset="crypto" />
        </>
      )}

      {showForm && (
        <TradeForm
          onClose={() => {
            setShowForm(false);
            setEditTrade(null);
          }}
          onSaved={fetchTrades}
          editTrade={editTrade}
          onTradeCompleted={(trade) => {
            setShowForm(false);
            setEditTrade(null);
            setPostTradeData({ id: trade.id, symbol: trade.symbol, pnl: trade.pnl });
          }}
          onDelete={editTrade ? () => {
            const trade = editTrade;
            setShowForm(false);
            setEditTrade(null);
            setDeletingTrade(trade);
          } : undefined}
        />
      )}

      {deletingTrade && (
        <DeleteTradeConfirmation
          symbol={deletingTrade.symbol}
          onConfirm={async () => {
            const { error } = await supabase
              .from("trades")
              .delete()
              .eq("id", deletingTrade.id);
            if (error) {
              console.error("[Dashboard] delete error:", error.message);
            }
            setDeletingTrade(null);
            fetchTrades();
          }}
          onCancel={() => setDeletingTrade(null)}
        />
      )}

      {postTradeData && (
        <PostTradePrompt
          tradeId={postTradeData.id}
          symbol={postTradeData.symbol}
          pnl={postTradeData.pnl}
          onClose={() => {
            setPostTradeData(null);
            fetchTrades(); // Refresh to show updated psychology data
          }}
        />
      )}

      {showImport && (
        <CSVImportModal
          onClose={() => setShowImport(false)}
          onImported={fetchTrades}
        />
      )}

      <PreTradeReadiness
        open={showReadiness}
        onClose={() => setShowReadiness(false)}
      />
    </div>
  );
}
