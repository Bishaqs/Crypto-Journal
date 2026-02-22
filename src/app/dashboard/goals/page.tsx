"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { calculateStats, calculateAdvancedStats } from "@/lib/calculations";
import { Target, Trophy, TrendingDown, Percent, Brain, Hash, Save, RotateCcw, Sparkles } from "lucide-react";
import { Header } from "@/components/header";

type Goal = {
  label: string;
  key: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  suffix: string;
  defaultValue: number;
  color: string;
};

const GOAL_DEFINITIONS: Goal[] = [
  { label: "Monthly P&L Target", key: "pnl_target", icon: Trophy, suffix: "$", defaultValue: 500, color: "text-win" },
  { label: "Max Drawdown Limit", key: "max_drawdown", icon: TrendingDown, suffix: "$", defaultValue: 200, color: "text-loss" },
  { label: "Win Rate Target", key: "win_rate", icon: Percent, suffix: "%", defaultValue: 55, color: "text-accent" },
  { label: "Avg Process Score", key: "process_score", icon: Brain, suffix: "/10", defaultValue: 7, color: "text-amber-400" },
  { label: "Trade Count Target", key: "trade_count", icon: Hash, suffix: " trades", defaultValue: 30, color: "text-foreground" },
];

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMonthTrades(trades: Trade[]): Trade[] {
  const monthKey = getMonthKey();
  return trades.filter((t) => {
    if (!t.close_timestamp) return false;
    const tradeMonth = t.close_timestamp.slice(0, 7);
    return tradeMonth === monthKey;
  });
}

type GoalValues = Record<string, number>;

export default function GoalsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [goals, setGoals] = useState<GoalValues>({});
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<GoalValues>({});
  const supabase = createClient();

  // Load goals from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("stargate-goals");
    if (stored) {
      setGoals(JSON.parse(stored));
    } else {
      const defaults: GoalValues = {};
      GOAL_DEFINITIONS.forEach((g) => { defaults[g.key] = g.defaultValue; });
      setGoals(defaults);
    }
  }, []);

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase.from("trades").select("*").order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const monthTrades = useMemo(() => getMonthTrades(trades), [trades]);
  const stats = useMemo(() => calculateStats(monthTrades), [monthTrades]);
  const advanced = useMemo(() => calculateAdvancedStats(monthTrades), [monthTrades]);

  // Calculate current values for each goal
  const currentValues = useMemo(() => {
    const processScores = monthTrades
      .filter((t) => t.process_score !== null && t.close_timestamp)
      .map((t) => t.process_score!);
    const avgProcess = processScores.length > 0
      ? processScores.reduce((a, b) => a + b, 0) / processScores.length
      : 0;

    return {
      pnl_target: stats.closedPnl,
      max_drawdown: advanced.maxDrawdown,
      win_rate: stats.winRate,
      process_score: avgProcess,
      trade_count: stats.totalTrades,
    } as GoalValues;
  }, [stats, advanced, monthTrades]);

  function startEditing() {
    setEditValues({ ...goals });
    setEditing(true);
  }

  function saveGoals() {
    setGoals(editValues);
    localStorage.setItem("stargate-goals", JSON.stringify(editValues));
    setEditing(false);
  }

  function resetDefaults() {
    const defaults: GoalValues = {};
    GOAL_DEFINITIONS.forEach((g) => { defaults[g.key] = g.defaultValue; });
    setEditValues(defaults);
  }

  function getProgress(goal: Goal): { percent: number; current: number; target: number; status: "on_track" | "behind" | "exceeded" | "danger" } {
    const target = goals[goal.key] ?? goal.defaultValue;
    const current = currentValues[goal.key] ?? 0;

    if (goal.key === "max_drawdown") {
      // Drawdown: lower is better, exceeded target = bad
      const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      const status = current > target ? "danger" : current > target * 0.75 ? "behind" : "on_track";
      return { percent, current, target, status };
    }

    const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const status = percent >= 100 ? "exceeded" : percent >= 60 ? "on_track" : "behind";
    return { percent, current, target, status };
  }

  function formatValue(goal: Goal, value: number): string {
    if (goal.suffix === "$") return `$${value.toFixed(0)}`;
    if (goal.suffix === "%") return `${value.toFixed(1)}%`;
    if (goal.suffix === "/10") return value.toFixed(1);
    return `${Math.round(value)}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const monthProgress = (currentDay / daysInMonth) * 100;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Target size={24} className="text-accent" />
            Monthly Goals
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {usingDemo ? (
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-accent" />
                Sample data — {getMonthLabel()}
              </span>
            ) : (
              `${getMonthLabel()} — Day ${currentDay} of ${daysInMonth}`
            )}
          </p>
        </div>
        {!editing ? (
          <button
            onClick={startEditing}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
          >
            Edit Goals
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={resetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-muted hover:text-foreground transition-all"
            >
              <RotateCcw size={12} />
              Defaults
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-muted hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveGoals}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-all"
            >
              <Save size={12} />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Month progress bar */}
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted/60 uppercase tracking-wider">Month Progress</span>
          <span className="text-xs font-bold text-foreground">{monthProgress.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-border/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent/40 transition-all duration-500"
            style={{ width: `${monthProgress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted/60 mt-1.5">
          {daysInMonth - currentDay} days remaining
        </p>
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GOAL_DEFINITIONS.map((goal) => {
          const progress = getProgress(goal);
          const isDrawdown = goal.key === "max_drawdown";

          const barColor =
            progress.status === "exceeded" ? "bg-win"
            : progress.status === "danger" ? "bg-loss"
            : progress.status === "on_track" ? "bg-accent"
            : "bg-amber-400";

          const statusLabel =
            progress.status === "exceeded" ? "Goal Met!"
            : progress.status === "danger" ? "Over Limit"
            : progress.status === "on_track" ? "On Track"
            : "Behind Pace";

          const statusColor =
            progress.status === "exceeded" ? "text-win"
            : progress.status === "danger" ? "text-loss"
            : progress.status === "on_track" ? "text-accent"
            : "text-amber-400";

          return (
            <div
              key={goal.key}
              className="glass rounded-2xl border border-border/50 p-5 space-y-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <goal.icon size={16} className={goal.color} />
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{goal.label}</h3>
                </div>
                <span className={`text-[10px] font-bold ${statusColor} uppercase`}>{statusLabel}</span>
              </div>

              {editing ? (
                <div>
                  <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1 block">
                    Target {goal.suffix === "$" ? "($)" : goal.suffix === "%" ? "(%)" : ""}
                  </label>
                  <input
                    type="number"
                    value={editValues[goal.key] ?? goal.defaultValue}
                    onChange={(e) => setEditValues({ ...editValues, [goal.key]: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-2xl font-bold ${isDrawdown ? (progress.status === "danger" ? "text-loss" : "text-foreground") : goal.color}`}>
                      {formatValue(goal, progress.current)}
                    </span>
                    <span className="text-xs text-muted">
                      / {formatValue(goal, progress.target)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-border/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-muted/60">
                    {isDrawdown
                      ? progress.current > 0
                        ? `$${(progress.target - progress.current).toFixed(0)} buffer remaining`
                        : "No drawdown yet"
                      : `${progress.percent.toFixed(0)}% of target`
                    }
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary card */}
      {!editing && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Month Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider mb-1">Total Trades</p>
              <p className="text-lg font-bold text-foreground">{stats.totalTrades}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider mb-1">Win/Loss</p>
              <p className="text-lg font-bold">
                <span className="text-win">{stats.wins}</span>
                <span className="text-muted/40"> / </span>
                <span className="text-loss">{stats.losses}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider mb-1">Avg P&L/Trade</p>
              <p className={`text-lg font-bold ${stats.avgTradePnl >= 0 ? "text-win" : "text-loss"}`}>
                ${stats.avgTradePnl.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted/60 uppercase tracking-wider mb-1">Profit Factor</p>
              <p className={`text-lg font-bold ${stats.profitFactor >= 1.5 ? "text-win" : stats.profitFactor >= 1 ? "text-foreground" : "text-loss"}`}>
                {stats.profitFactor.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
