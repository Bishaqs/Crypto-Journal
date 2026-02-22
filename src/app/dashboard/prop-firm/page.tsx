"use client";

import { useMemo, useState, useEffect } from "react";
import { useTheme } from "@/lib/theme-context";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Circle,
  DollarSign,
  Activity,
  Target,
  Flame,
  Info,
} from "lucide-react";
import { Header } from "@/components/header";

// ─── Firm Presets ────────────────────────────────────────────────────────────

type FirmPreset = {
  name: string;
  dailyLoss: number;
  maxDrawdown: number;
  profitTarget: number;
  minDays: number;
  maxDays: number | null;
};

const FIRM_PRESETS: Record<string, FirmPreset> = {
  FTMO: {
    name: "FTMO",
    dailyLoss: 5,
    maxDrawdown: 10,
    profitTarget: 10,
    minDays: 4,
    maxDays: 30,
  },
  TopStep: {
    name: "TopStep",
    dailyLoss: 4.5,
    maxDrawdown: 5,
    profitTarget: 6,
    minDays: 5,
    maxDays: null,
  },
  The5ers: {
    name: "The5ers",
    dailyLoss: 3,
    maxDrawdown: 6,
    profitTarget: 8,
    minDays: 3,
    maxDays: null,
  },
  "Funded Next": {
    name: "Funded Next",
    dailyLoss: 5,
    maxDrawdown: 10,
    profitTarget: 10,
    minDays: 5,
    maxDays: 30,
  },
  MyFundedFX: {
    name: "MyFundedFX",
    dailyLoss: 5,
    maxDrawdown: 8,
    profitTarget: 8,
    minDays: 5,
    maxDays: 60,
  },
  Custom: {
    name: "Custom",
    dailyLoss: 5,
    maxDrawdown: 10,
    profitTarget: 10,
    minDays: 4,
    maxDays: 30,
  },
};

const ACCOUNT_SIZES = [10_000, 25_000, 50_000, 100_000, 200_000];

// ─── Demo Trades ─────────────────────────────────────────────────────────────

type DemoTrade = {
  date: string;
  symbol: string;
  pnl: number;
};

const DEMO_TRADES: DemoTrade[] = [
  { date: "2026-02-03", symbol: "BTC/USDT", pnl: 320 },
  { date: "2026-02-04", symbol: "ETH/USDT", pnl: -180 },
  { date: "2026-02-05", symbol: "BTC/USDT", pnl: 450 },
  { date: "2026-02-06", symbol: "SOL/USDT", pnl: 120 },
  { date: "2026-02-07", symbol: "ETH/USDT", pnl: -90 },
  { date: "2026-02-10", symbol: "BTC/USDT", pnl: 280 },
  { date: "2026-02-10", symbol: "SOL/USDT", pnl: -200 },
  { date: "2026-02-11", symbol: "BTC/USDT", pnl: 510 },
  { date: "2026-02-12", symbol: "ETH/USDT", pnl: 170 },
  { date: "2026-02-13", symbol: "AVAX/USDT", pnl: -340 },
  { date: "2026-02-14", symbol: "BTC/USDT", pnl: 390 },
  { date: "2026-02-17", symbol: "SOL/USDT", pnl: 210 },
  { date: "2026-02-18", symbol: "BTC/USDT", pnl: -150 },
  { date: "2026-02-19", symbol: "ETH/USDT", pnl: 260 },
  { date: "2026-02-20", symbol: "BTC/USDT", pnl: 180 },
];

// ─── Config Type ─────────────────────────────────────────────────────────────

type PropFirmConfig = {
  firm: string;
  accountSize: number;
  dailyLoss: number;
  maxDrawdown: number;
  profitTarget: number;
  minDays: number;
  maxDays: number | null;
  currentPhase: number;
};

const STORAGE_KEY = "stargate-propfirm-config";

function loadConfig(): PropFirmConfig {
  if (typeof window === "undefined") return getDefaultConfig();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return getDefaultConfig();
}

function getDefaultConfig(): PropFirmConfig {
  const preset = FIRM_PRESETS.FTMO;
  return {
    firm: "FTMO",
    accountSize: 50_000,
    dailyLoss: preset.dailyLoss,
    maxDrawdown: preset.maxDrawdown,
    profitTarget: preset.profitTarget,
    minDays: preset.minDays,
    maxDays: preset.maxDays,
    currentPhase: 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusColor(percent: number): string {
  if (percent >= 90) return "text-loss";
  if (percent >= 80) return "text-amber-400";
  return "text-win";
}

function getBarColor(percent: number): string {
  if (percent >= 90) return "bg-loss";
  if (percent >= 80) return "bg-amber-400";
  return "bg-win";
}

function getBarGradient(percent: number): string {
  if (percent >= 90) return "from-loss/80 to-loss";
  if (percent >= 80) return "from-amber-400/80 to-amber-400";
  return "from-emerald-500/80 to-emerald-400";
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PropFirmPage() {
  const { viewMode } = useTheme();
  const [config, setConfig] = useState<PropFirmConfig>(getDefaultConfig);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setConfig(loadConfig());
    setMounted(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config, mounted]);

  function selectFirm(firmName: string) {
    const preset = FIRM_PRESETS[firmName];
    if (!preset) return;
    setConfig((prev) => ({
      ...prev,
      firm: firmName,
      dailyLoss: preset.dailyLoss,
      maxDrawdown: preset.maxDrawdown,
      profitTarget: preset.profitTarget,
      minDays: preset.minDays,
      maxDays: preset.maxDays,
    }));
  }

  function selectAccountSize(size: number) {
    setConfig((prev) => ({ ...prev, accountSize: size }));
  }

  function updateField(field: keyof PropFirmConfig, value: number | null) {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }

  // ─── Calculations ──────────────────────────────────────────────────────────

  const calculations = useMemo(() => {
    const totalPnl = DEMO_TRADES.reduce((sum, t) => sum + t.pnl, 0);

    // Calculate running drawdown (peak-to-trough)
    let peak = 0;
    let maxDD = 0;
    let running = 0;
    for (const t of DEMO_TRADES) {
      running += t.pnl;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) maxDD = dd;
    }

    // Today's P&L
    const today = "2026-02-20";
    const todayPnl = DEMO_TRADES.filter((t) => t.date === today).reduce(
      (sum, t) => sum + t.pnl,
      0
    );

    // Unique trading days
    const uniqueDays = new Set(DEMO_TRADES.map((t) => t.date));
    const tradingDays = uniqueDays.size;

    // Dollar amounts from percentages
    const dailyLossLimit = (config.dailyLoss / 100) * config.accountSize;
    const maxDrawdownLimit = (config.maxDrawdown / 100) * config.accountSize;
    const profitTargetDollars = (config.profitTarget / 100) * config.accountSize;

    // Percentages of limits used
    const profitPercent =
      profitTargetDollars > 0
        ? Math.min((totalPnl / profitTargetDollars) * 100, 100)
        : 0;
    const drawdownPercent =
      maxDrawdownLimit > 0
        ? Math.min((maxDD / maxDrawdownLimit) * 100, 100)
        : 0;
    const dailyLossPercent =
      dailyLossLimit > 0
        ? Math.min((Math.abs(Math.min(todayPnl, 0)) / dailyLossLimit) * 100, 100)
        : 0;

    return {
      totalPnl,
      maxDD,
      todayPnl,
      tradingDays,
      dailyLossLimit,
      maxDrawdownLimit,
      profitTargetDollars,
      profitPercent,
      drawdownPercent,
      dailyLossPercent,
    };
  }, [config.accountSize, config.dailyLoss, config.maxDrawdown, config.profitTarget]);

  // ─── Alerts ────────────────────────────────────────────────────────────────

  const alerts = useMemo(() => {
    const items: { level: "warning" | "danger"; message: string }[] = [];

    if (calculations.drawdownPercent >= 90) {
      items.push({
        level: "danger",
        message: `CRITICAL: Max drawdown at ${calculations.drawdownPercent.toFixed(0)}% of limit ($${calculations.maxDD.toFixed(0)} / $${calculations.maxDrawdownLimit.toFixed(0)})`,
      });
    } else if (calculations.drawdownPercent >= 80) {
      items.push({
        level: "warning",
        message: `Warning: Max drawdown approaching limit at ${calculations.drawdownPercent.toFixed(0)}% ($${calculations.maxDD.toFixed(0)} / $${calculations.maxDrawdownLimit.toFixed(0)})`,
      });
    }

    if (calculations.dailyLossPercent >= 90) {
      items.push({
        level: "danger",
        message: `CRITICAL: Daily loss at ${calculations.dailyLossPercent.toFixed(0)}% of limit`,
      });
    } else if (calculations.dailyLossPercent >= 80) {
      items.push({
        level: "warning",
        message: `Warning: Daily loss approaching limit at ${calculations.dailyLossPercent.toFixed(0)}%`,
      });
    }

    if (config.maxDays !== null && calculations.tradingDays >= config.maxDays * 0.9) {
      items.push({
        level: "warning",
        message: `${calculations.tradingDays} of ${config.maxDays} max trading days used`,
      });
    }

    return items;
  }, [calculations, config.maxDays]);

  // ─── Phase Tracker ─────────────────────────────────────────────────────────

  const phases = [
    {
      label: "Evaluation",
      description:
        "Prove consistency by hitting the profit target while staying within risk limits. Most firms require minimum trading days.",
    },
    {
      label: "Verification",
      description:
        "Confirm your results with a second round of trading, typically with a lower profit target and the same drawdown rules.",
    },
    {
      label: "Funded",
      description:
        "Trade with real capital. Profit splits typically range from 70-90%. Drawdown rules still apply to protect the account.",
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Shield size={24} className="text-accent" />
          Prop Firm Tracker
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Monitor your evaluation progress and stay within firm risk limits
        </p>
      </div>

      {/* Alert banners */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-medium ${
            alert.level === "danger"
              ? "bg-loss/8 border-loss/25 text-loss"
              : "bg-amber-400/8 border-amber-400/25 text-amber-400"
          }`}
        >
          {alert.level === "danger" ? (
            <Flame size={18} className="shrink-0" />
          ) : (
            <AlertTriangle size={18} className="shrink-0" />
          )}
          {alert.message}
        </div>
      ))}

      {/* ─── Firm Selection + Config ──────────────────────────────────────── */}
      <div
        className="glass rounded-2xl border border-border/50 p-6 space-y-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Firm & Account Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Firm selector */}
          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Prop Firm
            </label>
            <select
              value={config.firm}
              onChange={(e) => selectFirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer"
            >
              {Object.keys(FIRM_PRESETS).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Account size selector */}
          <div>
            <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Account Size
            </label>
            <div className="flex gap-2 flex-wrap">
              {ACCOUNT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => selectAccountSize(size)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    config.accountSize === size
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "bg-background border border-border text-muted hover:text-foreground"
                  }`}
                >
                  ${(size / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editable rule fields */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
              Daily Loss (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={config.dailyLoss}
              onChange={(e) => updateField("dailyLoss", Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
              Max Drawdown (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={config.maxDrawdown}
              onChange={(e) => updateField("maxDrawdown", Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
              Profit Target (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={config.profitTarget}
              onChange={(e) => updateField("profitTarget", Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
              Min Trading Days
            </label>
            <input
              type="number"
              value={config.minDays}
              onChange={(e) => updateField("minDays", Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
              Max Days
            </label>
            <input
              type="number"
              value={config.maxDays ?? ""}
              placeholder="No limit"
              onChange={(e) =>
                updateField(
                  "maxDays",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all placeholder:text-muted/30"
            />
          </div>
        </div>
      </div>

      {/* ─── Live Dashboard Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profit Progress */}
        <div
          className="glass rounded-2xl border border-border/50 p-5 space-y-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-win" />
              <h3 className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                Profit Progress
              </h3>
            </div>
            <div className="p-1.5 rounded-lg bg-win/8">
              <Target size={14} className="text-win" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold ${
                calculations.totalPnl >= 0 ? "text-win" : "text-loss"
              }`}
            >
              ${calculations.totalPnl.toLocaleString()}
            </span>
            <span className="text-xs text-muted">
              / ${calculations.profitTargetDollars.toLocaleString()}
            </span>
          </div>

          <div className="h-2.5 rounded-full bg-border/50 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-400 transition-all duration-700`}
              style={{ width: `${Math.max(calculations.profitPercent, 0)}%` }}
            />
          </div>

          <p className="text-[10px] text-muted/60">
            {calculations.profitPercent.toFixed(1)}% of target reached
            {calculations.profitPercent >= 100 && (
              <span className="text-win font-semibold ml-1">-- Target met!</span>
            )}
          </p>
        </div>

        {/* Max Drawdown */}
        <div
          className="glass rounded-2xl border border-border/50 p-5 space-y-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-loss" />
              <h3 className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                Max Drawdown
              </h3>
            </div>
            <div className="p-1.5 rounded-lg bg-loss/8">
              <Activity size={14} className="text-loss" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${getStatusColor(calculations.drawdownPercent)}`}>
              ${calculations.maxDD.toLocaleString()}
            </span>
            <span className="text-xs text-muted">
              / ${calculations.maxDrawdownLimit.toLocaleString()}
            </span>
          </div>

          <div className="h-2.5 rounded-full bg-border/50 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getBarGradient(calculations.drawdownPercent)} transition-all duration-700`}
              style={{ width: `${calculations.drawdownPercent}%` }}
            />
          </div>

          <p className="text-[10px] text-muted/60">
            {calculations.drawdownPercent.toFixed(1)}% of limit used
            {calculations.drawdownPercent >= 80 && (
              <span
                className={`font-semibold ml-1 ${
                  calculations.drawdownPercent >= 90 ? "text-loss" : "text-amber-400"
                }`}
              >
                -- {calculations.drawdownPercent >= 90 ? "DANGER" : "Caution"}
              </span>
            )}
          </p>
        </div>

        {/* Daily Loss */}
        <div
          className="glass rounded-2xl border border-border/50 p-5 space-y-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-amber-400" />
              <h3 className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                Daily Loss
              </h3>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-400/8">
              <AlertTriangle size={14} className="text-amber-400" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold ${
                calculations.todayPnl >= 0
                  ? "text-win"
                  : getStatusColor(calculations.dailyLossPercent)
              }`}
            >
              {calculations.todayPnl >= 0 ? "+" : ""}${calculations.todayPnl.toLocaleString()}
            </span>
            <span className="text-xs text-muted">
              limit: ${calculations.dailyLossLimit.toLocaleString()}
            </span>
          </div>

          <div className="h-2.5 rounded-full bg-border/50 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${
                calculations.todayPnl >= 0
                  ? "from-emerald-500/80 to-emerald-400"
                  : getBarGradient(calculations.dailyLossPercent)
              } transition-all duration-700`}
              style={{
                width: `${
                  calculations.todayPnl >= 0
                    ? 0
                    : calculations.dailyLossPercent
                }%`,
              }}
            />
          </div>

          <p className="text-[10px] text-muted/60">
            {calculations.todayPnl >= 0
              ? "No daily loss today"
              : `${calculations.dailyLossPercent.toFixed(1)}% of daily limit used`}
            {calculations.dailyLossPercent >= 80 && calculations.todayPnl < 0 && (
              <span
                className={`font-semibold ml-1 ${
                  calculations.dailyLossPercent >= 90 ? "text-loss" : "text-amber-400"
                }`}
              >
                -- {calculations.dailyLossPercent >= 90 ? "STOP TRADING" : "Caution"}
              </span>
            )}
          </p>
        </div>

        {/* Trading Days */}
        <div
          className="glass rounded-2xl border border-border/50 p-5 space-y-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-accent" />
              <h3 className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                Trading Days
              </h3>
            </div>
            <div className="p-1.5 rounded-lg bg-accent/8">
              <Info size={14} className="text-accent" />
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">
              {calculations.tradingDays}
            </span>
            <span className="text-sm text-muted">
              / {config.minDays} min
              {config.maxDays !== null && ` — ${config.maxDays} max`}
            </span>
          </div>

          {/* Mini calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const tradingDates = new Set(DEMO_TRADES.map((t) => t.date));
              const days: { date: string; traded: boolean; day: number }[] = [];
              for (let d = 1; d <= 28; d++) {
                const dateStr = `2026-02-${String(d).padStart(2, "0")}`;
                days.push({
                  date: dateStr,
                  traded: tradingDates.has(dateStr),
                  day: d,
                });
              }
              return days.map((d) => (
                <div
                  key={d.date}
                  className={`w-full aspect-square rounded-md flex items-center justify-center text-[8px] font-bold ${
                    d.traded
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-background text-muted/30"
                  }`}
                >
                  {d.day}
                </div>
              ));
            })()}
          </div>

          <p className="text-[10px] text-muted/60">
            {calculations.tradingDays >= config.minDays
              ? "Minimum trading days met"
              : `${config.minDays - calculations.tradingDays} more days needed`}
          </p>
        </div>
      </div>

      {/* ─── Phase Tracker ────────────────────────────────────────────────── */}
      <div
        className="glass rounded-2xl border border-border/50 p-6 space-y-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Phase Tracker
        </h3>

        {/* Phase steps */}
        <div className="flex items-center gap-0">
          {phases.map((phase, i) => (
            <div key={phase.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, currentPhase: i }))}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < config.currentPhase
                      ? "bg-win text-white"
                      : i === config.currentPhase
                        ? "bg-accent text-white ring-4 ring-accent/20"
                        : "bg-background border-2 border-border text-muted"
                  }`}
                >
                  {i < config.currentPhase ? (
                    <CheckCircle2 size={20} />
                  ) : i === config.currentPhase ? (
                    <Circle size={20} className="fill-current" />
                  ) : (
                    i + 1
                  )}
                </button>
                <span
                  className={`text-xs font-semibold mt-2 ${
                    i === config.currentPhase ? "text-accent" : "text-muted"
                  }`}
                >
                  {phase.label}
                </span>
              </div>
              {i < phases.length - 1 && (
                <div
                  className={`h-0.5 flex-1 -mt-5 mx-1 rounded-full transition-all duration-500 ${
                    i < config.currentPhase ? "bg-win" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current phase description */}
        <div className="bg-background rounded-xl border border-border/50 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10 mt-0.5">
              <ChevronRight size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Phase {config.currentPhase + 1}: {phases[config.currentPhase].label}
              </p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {phases[config.currentPhase].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Trade Log Preview ────────────────────────────────────────────── */}
      {viewMode === "advanced" && (
        <div
          className="glass rounded-2xl border border-border/50 p-6 space-y-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Recent Trades
          </h3>
          <div className="space-y-1.5">
            {DEMO_TRADES.slice(-8)
              .reverse()
              .map((trade, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-background hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted font-medium w-20">
                      {trade.date}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {trade.symbol}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      trade.pnl >= 0 ? "text-win" : "text-loss"
                    }`}
                  >
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─── Account Summary ──────────────────────────────────────────────── */}
      <div
        className="glass rounded-2xl border border-border/50 p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Account Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-[10px] text-muted/60 uppercase tracking-wider mb-1">
              Starting Balance
            </p>
            <p className="text-lg font-bold text-foreground">
              ${config.accountSize.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted/60 uppercase tracking-wider mb-1">
              Current Balance
            </p>
            <p className="text-lg font-bold text-foreground">
              ${(config.accountSize + calculations.totalPnl).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted/60 uppercase tracking-wider mb-1">
              Total P&L
            </p>
            <p
              className={`text-lg font-bold ${
                calculations.totalPnl >= 0 ? "text-win" : "text-loss"
              }`}
            >
              {calculations.totalPnl >= 0 ? "+" : ""}$
              {calculations.totalPnl.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted/60 uppercase tracking-wider mb-1">
              Remaining to Target
            </p>
            <p
              className={`text-lg font-bold ${
                calculations.profitTargetDollars - calculations.totalPnl <= 0
                  ? "text-win"
                  : "text-accent"
              }`}
            >
              {calculations.profitTargetDollars - calculations.totalPnl <= 0
                ? "Target Met"
                : `$${(calculations.profitTargetDollars - calculations.totalPnl).toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
