"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { useDateRange } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  generateBehavioralInsights,
  getEmotionPnlData,
  getConfidencePnlData,
  getProcessScorePnlData,
  calculateTradePnl,
  detectTiltSignals,
} from "@/lib/calculations";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  Clock,
  Heart,
  Zap,
  CheckCircle,
  XCircle,
  Dna,
  Table2,
  Shield,
  DollarSign,
  Eye,
} from "lucide-react";
import { Header } from "@/components/header";
import { BehavioralLogbook } from "@/components/dashboard/behavioral-logbook";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";
import { Plus, X } from "lucide-react";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";


export default function InsightsPage() {
  usePageTour("insights-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const { filterTrades } = useDateRange();
  const { theme, viewMode } = useTheme();
  const colors = getChartColors(theme);
  const chartTooltipStyle = {
    background: colors.tooltipBg, backdropFilter: "blur(16px)",
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };
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
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const filtered = useMemo(() => filterTrades(trades), [trades, filterTrades]);
  const insights = useMemo(() => generateBehavioralInsights(filtered), [filtered]);
  const emotionData = useMemo(() => getEmotionPnlData(filtered), [filtered]);
  const confidenceData = useMemo(() => getConfidencePnlData(filtered), [filtered]);
  const processData = useMemo(() => getProcessScorePnlData(filtered), [filtered]);
  const tiltSignals = useMemo(() => detectTiltSignals(filtered), [filtered]);

  // Emotion-P&L correlation table (advanced mode)
  const emotionCorrelation = useMemo(() => {
    if (viewMode !== "advanced") return [];
    const closed = filtered.filter((t) => t.close_timestamp && t.emotion);
    const map = new Map<string, { count: number; wins: number; pnl: number; holdTimeSum: number }>();
    for (const t of closed) {
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      const holdMs = t.close_timestamp && t.open_timestamp
        ? new Date(t.close_timestamp).getTime() - new Date(t.open_timestamp).getTime()
        : 0;
      const holdHours = holdMs / (1000 * 60 * 60);
      const e = map.get(t.emotion!) ?? { count: 0, wins: 0, pnl: 0, holdTimeSum: 0 };
      map.set(t.emotion!, {
        count: e.count + 1,
        wins: e.wins + (p > 0 ? 1 : 0),
        pnl: e.pnl + p,
        holdTimeSum: e.holdTimeSum + holdHours,
      });
    }
    return Array.from(map.entries())
      .map(([emotion, d]) => ({
        emotion,
        count: d.count,
        avgPnl: d.count > 0 ? d.pnl / d.count : 0,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        avgHoldTime: d.count > 0 ? d.holdTimeSum / d.count : 0,
        totalPnl: d.pnl,
      }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [filtered, viewMode]);

  // Discipline trend: process score by week
  const disciplineTrend = useMemo(() => {
    const closed = [...filtered]
      .filter((t) => t.close_timestamp && t.process_score !== null)
      .sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    const map = new Map<string, { total: number; count: number }>();
    for (const t of closed) {
      const d = new Date(t.close_timestamp!);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().split("T")[0];
      const e = map.get(key) ?? { total: 0, count: 0 };
      map.set(key, { total: e.total + t.process_score!, count: e.count + 1 });
    }
    return Array.from(map.entries())
      .map(([week, d]) => ({ week, avgScore: d.total / d.count }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered]);

  // Emotion frequency
  const emotionFrequency = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filtered) {
      if (!t.emotion) continue;
      map.set(t.emotion, (map.get(t.emotion) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  // Time-of-day analysis
  const timeOfDay = useMemo(() => {
    const map = new Map<number, { pnl: number; wins: number; count: number }>();
    for (const t of filtered.filter((t) => t.close_timestamp)) {
      const hour = new Date(t.open_timestamp).getHours();
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      const e = map.get(hour) ?? { pnl: 0, wins: 0, count: 0 };
      map.set(hour, { pnl: e.pnl + p, wins: e.wins + (p > 0 ? 1 : 0), count: e.count + 1 });
    }
    return Array.from(map.entries())
      .map(([hour, d]) => ({
        hour,
        label: `${hour}:00`,
        pnl: d.pnl,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        count: d.count,
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [filtered]);

  // Trading DNA summary
  const tradingDna = useMemo(() => {
    const closed = filtered.filter((t) => t.close_timestamp);
    if (closed.length < 5) return null;

    // Best emotion
    let bestEmotion = { name: "—", avgPnl: -Infinity };
    const emotionMap = new Map<string, { total: number; count: number }>();
    for (const t of closed) {
      if (!t.emotion) continue;
      const e = emotionMap.get(t.emotion) ?? { total: 0, count: 0 };
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      emotionMap.set(t.emotion, { total: e.total + p, count: e.count + 1 });
    }
    for (const [emotion, data] of emotionMap) {
      if (data.count >= 2 && data.total / data.count > bestEmotion.avgPnl) {
        bestEmotion = { name: emotion, avgPnl: data.total / data.count };
      }
    }

    // Best time
    const hourMap = new Map<number, { total: number; count: number }>();
    for (const t of closed) {
      const h = new Date(t.open_timestamp).getHours();
      const e = hourMap.get(h) ?? { total: 0, count: 0 };
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      hourMap.set(h, { total: e.total + p, count: e.count + 1 });
    }
    let bestHour = { hour: 0, avgPnl: -Infinity };
    for (const [hour, data] of hourMap) {
      if (data.count >= 2 && data.total / data.count > bestHour.avgPnl) {
        bestHour = { hour, avgPnl: data.total / data.count };
      }
    }

    // Best setup
    const setupMap = new Map<string, { total: number; count: number; wins: number }>();
    for (const t of closed) {
      if (!t.setup_type) continue;
      const e = setupMap.get(t.setup_type) ?? { total: 0, count: 0, wins: 0 };
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      setupMap.set(t.setup_type, { total: e.total + p, count: e.count + 1, wins: e.wins + (p > 0 ? 1 : 0) });
    }
    let bestSetup = { name: "—", winRate: 0 };
    for (const [name, data] of setupMap) {
      const wr = data.count >= 2 ? (data.wins / data.count) * 100 : 0;
      if (wr > bestSetup.winRate) bestSetup = { name, winRate: wr };
    }

    // Biggest leak (worst emotion)
    let biggestLeak = "—";
    let worstCost = 0;
    for (const [emotion, data] of emotionMap) {
      if (data.total < worstCost) { biggestLeak = emotion; worstCost = data.total; }
    }

    // Discipline score
    const processScores = closed.filter((t) => t.process_score !== null).map((t) => t.process_score!);
    const discipline = processScores.length > 0
      ? processScores.reduce((a, b) => a + b, 0) / processScores.length
      : 0;

    return {
      bestEmotion: bestEmotion.name,
      bestTime: `${bestHour.hour}:00`,
      bestSetup: bestSetup.name,
      biggestLeak,
      discipline: discipline.toFixed(1),
    };
  }, [filtered]);

  // Win/Loss streaks
  const streakData = useMemo(() => {
    const closed = [...filtered]
      .filter((t) => t.close_timestamp)
      .sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    if (closed.length < 3) return [];

    const streaks: { type: "win" | "loss"; length: number; pnl: number; emotion: string; endDate: string }[] = [];
    let currentType: "win" | "loss" | null = null;
    let currentLength = 0;
    let currentPnl = 0;
    let lastEmotion = "";
    let lastDate = "";

    for (const t of closed) {
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      const type = p >= 0 ? "win" : "loss";

      if (type === currentType) {
        currentLength++;
        currentPnl += p;
        lastEmotion = t.emotion ?? "";
        lastDate = t.close_timestamp!.split("T")[0];
      } else {
        if (currentType && currentLength >= 2) {
          streaks.push({ type: currentType, length: currentLength, pnl: currentPnl, emotion: lastEmotion, endDate: lastDate });
        }
        currentType = type;
        currentLength = 1;
        currentPnl = p;
        lastEmotion = t.emotion ?? "";
        lastDate = t.close_timestamp!.split("T")[0];
      }
    }
    if (currentType && currentLength >= 2) {
      streaks.push({ type: currentType, length: currentLength, pnl: currentPnl, emotion: lastEmotion, endDate: lastDate });
    }
    return streaks.slice(-10);
  }, [filtered]);

  // Setup type performance table
  const setupPerformance = useMemo(() => {
    const closed = filtered.filter((t) => t.close_timestamp && t.setup_type);
    const map = new Map<string, { count: number; wins: number; pnl: number; best: number; worst: number; processSum: number; processCount: number }>();

    for (const t of closed) {
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      const e = map.get(t.setup_type!) ?? { count: 0, wins: 0, pnl: 0, best: -Infinity, worst: Infinity, processSum: 0, processCount: 0 };
      map.set(t.setup_type!, {
        count: e.count + 1,
        wins: e.wins + (p > 0 ? 1 : 0),
        pnl: e.pnl + p,
        best: Math.max(e.best, p),
        worst: Math.min(e.worst, p),
        processSum: e.processSum + (t.process_score ?? 0),
        processCount: e.processCount + (t.process_score !== null ? 1 : 0),
      });
    }

    return Array.from(map.entries())
      .map(([setup, d]) => ({
        setup,
        count: d.count,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        avgPnl: d.count > 0 ? d.pnl / d.count : 0,
        totalPnl: d.pnl,
        best: d.best === -Infinity ? 0 : d.best,
        worst: d.worst === Infinity ? 0 : d.worst,
        avgProcess: d.processCount > 0 ? d.processSum / d.processCount : null,
      }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [filtered]);

  // C2: Dollar cost of emotions — the #1 unique feature
  const emotionDollarCost = useMemo(() => {
    const closed = filtered.filter((t) => t.close_timestamp && t.emotion);
    if (closed.length < 3) return null;
    const map = new Map<string, number>();
    for (const t of closed) {
      const p = t.pnl ?? calculateTradePnl(t) ?? 0;
      map.set(t.emotion!, (map.get(t.emotion!) ?? 0) + p);
    }
    const sorted = Array.from(map.entries()).sort((a, b) => a[1] - b[1]);
    const worstEmotion = sorted[0];
    const bestEmotion = sorted[sorted.length - 1];
    return { worstEmotion, bestEmotion };
  }, [filtered]);

  // C3: Predictive tilt warning — proactive, not reactive
  const predictiveTilt = useMemo(() => {
    const warnings: string[] = [];
    const today = new Date().toISOString().split("T")[0];
    const todayTrades = filtered.filter((t) =>
      t.close_timestamp?.startsWith(today)
    );
    const todayLosses = todayTrades.filter(
      (t) => (t.pnl ?? calculateTradePnl(t) ?? 0) < 0
    );

    if (todayLosses.length >= 3) {
      warnings.push(
        `You've had ${todayLosses.length} losses today. Historical data shows your decisions get worse after 3+ consecutive losses.`
      );
    }

    // Check for FOMO pattern: multiple trades with FOMO emotion in recent period
    const recentFomo = filtered
      .filter((t) => t.emotion === "FOMO" && t.close_timestamp)
      .slice(0, 10);
    if (recentFomo.length >= 3) {
      const fomoAvgPnl =
        recentFomo.reduce(
          (sum, t) => sum + (t.pnl ?? calculateTradePnl(t) ?? 0),
          0
        ) / recentFomo.length;
      if (fomoAvgPnl < 0) {
        warnings.push(
          `Your FOMO trades average $${Math.abs(fomoAvgPnl).toFixed(0)} loss each. Consider waiting for your setup.`
        );
      }
    }

    // Check for revenge trading pattern
    const recentRevenge = filtered
      .filter((t) => t.emotion === "Revenge" && t.close_timestamp)
      .slice(0, 5);
    if (recentRevenge.length >= 2) {
      warnings.push(
        "Revenge trading detected in recent trades. Take a break before your next entry."
      );
    }

    // Check for oversizing after losses
    const recentClosed = [...filtered]
      .filter((t) => t.close_timestamp)
      .sort((a, b) => b.close_timestamp!.localeCompare(a.close_timestamp!))
      .slice(0, 10);
    if (recentClosed.length >= 4) {
      const lastFour = recentClosed.slice(0, 4);
      const firstTwo = lastFour.slice(0, 2);
      const lastTwo = lastFour.slice(2);
      const firstAvgQty =
        firstTwo.reduce((s, t) => s + t.quantity, 0) / firstTwo.length;
      const lastAvgQty =
        lastTwo.reduce((s, t) => s + t.quantity, 0) / lastTwo.length;
      const lastTwoPnl = lastTwo.reduce(
        (s, t) => s + (t.pnl ?? calculateTradePnl(t) ?? 0),
        0
      );
      if (lastTwoPnl < 0 && firstAvgQty > lastAvgQty * 1.5) {
        warnings.push(
          "Your position size increased after recent losses — classic tilt pattern. Consider sizing down."
        );
      }
    }

    return warnings;
  }, [filtered]);

  // C4: Cognitive bias detection
  const cognitiveBiases = useMemo(() => {
    const biases: {
      name: string;
      description: string;
      evidence: string;
      icon: string;
    }[] = [];

    const closed = filtered.filter((t) => t.close_timestamp);
    if (closed.length < 10) return biases;

    // Confirmation bias: >75% trades in one direction
    const longs = closed.filter((t) => t.position === "long").length;
    const shorts = closed.filter((t) => t.position === "short").length;
    const longPct = longs / closed.length;
    if (longPct > 0.8 || longPct < 0.2) {
      biases.push({
        name: "Confirmation Bias",
        description:
          "You may be seeking only trades that confirm your market view.",
        evidence: `${(Math.max(longPct, 1 - longPct) * 100).toFixed(0)}% of trades are ${longPct > 0.8 ? "long" : "short"}.`,
        icon: "🔍",
      });
    }

    // Recency bias: position size increases after wins
    const sorted = [...closed].sort((a, b) =>
      a.close_timestamp!.localeCompare(b.close_timestamp!)
    );
    let sizeIncreaseAfterWin = 0;
    let winCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prevPnl = sorted[i - 1].pnl ?? calculateTradePnl(sorted[i - 1]) ?? 0;
      if (prevPnl > 0) {
        winCount++;
        if (sorted[i].quantity > sorted[i - 1].quantity * 1.3) {
          sizeIncreaseAfterWin++;
        }
      }
    }
    if (winCount >= 5 && sizeIncreaseAfterWin / winCount > 0.4) {
      biases.push({
        name: "Recency Bias",
        description:
          "You tend to increase size after wins, overweighting recent results.",
        evidence: `Position size increased after ${((sizeIncreaseAfterWin / winCount) * 100).toFixed(0)}% of winning trades.`,
        icon: "📈",
      });
    }

    // Sunk cost: holding losers longer than winners
    const holdTimes = closed.map((t) => {
      const ms =
        new Date(t.close_timestamp!).getTime() -
        new Date(t.open_timestamp).getTime();
      const hours = ms / (1000 * 60 * 60);
      const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
      return { hours, isWin: pnl > 0 };
    });
    const winHolds = holdTimes.filter((h) => h.isWin);
    const lossHolds = holdTimes.filter((h) => !h.isWin);
    if (winHolds.length >= 5 && lossHolds.length >= 5) {
      const avgWinHold =
        winHolds.reduce((s, h) => s + h.hours, 0) / winHolds.length;
      const avgLossHold =
        lossHolds.reduce((s, h) => s + h.hours, 0) / lossHolds.length;
      if (avgLossHold > avgWinHold * 1.8) {
        biases.push({
          name: "Sunk Cost Fallacy",
          description:
            "You hold losing trades significantly longer than winners, hoping they'll recover.",
          evidence: `Avg loss hold: ${avgLossHold.toFixed(1)}h vs avg win hold: ${avgWinHold.toFixed(1)}h.`,
          icon: "⏰",
        });
      }
    }

    return biases;
  }, [filtered]);

  // Checklist compliance impact
  const checklistImpact = useMemo(() => {
    const closed = filtered.filter((t) => t.close_timestamp && t.checklist && Object.keys(t.checklist).length > 0);
    if (closed.length < 4) return null;

    const full = closed.filter((t) => Object.values(t.checklist!).every(Boolean));
    const partial = closed.filter((t) => !Object.values(t.checklist!).every(Boolean));

    if (full.length < 2 || partial.length < 2) return null;

    const fullPnls = full.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);
    const partialPnls = partial.map((t) => t.pnl ?? calculateTradePnl(t) ?? 0);

    const fullWinRate = (fullPnls.filter((p) => p > 0).length / fullPnls.length) * 100;
    const partialWinRate = (partialPnls.filter((p) => p > 0).length / partialPnls.length) * 100;
    const fullAvg = fullPnls.reduce((a, b) => a + b, 0) / fullPnls.length;
    const partialAvg = partialPnls.reduce((a, b) => a + b, 0) / partialPnls.length;
    const fullTotal = fullPnls.reduce((a, b) => a + b, 0);
    const partialTotal = partialPnls.reduce((a, b) => a + b, 0);

    return {
      full: { count: full.length, winRate: fullWinRate, avgPnl: fullAvg, totalPnl: fullTotal },
      partial: { count: partial.length, winRate: partialWinRate, avgPnl: partialAvg, totalPnl: partialTotal },
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  const hasEmotionData = emotionData.length > 0;
  const hasConfidenceData = confidenceData.length >= 3;
  const hasProcessData = processData.length >= 3;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      <div className="flex items-center justify-between">
        <div>
          <h2 id="tour-insights-header" className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Brain size={24} className="text-accent" />
            Behavioral Insights
            <PageInfoButton tourName="insights-page" />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {usingDemo ? "Sample data" : "How your psychology impacts your trading performance"}
          </p>
        </div>
        {usingDemo && <DemoBanner feature="insights" />}
        <button
          onClick={() => setShowNoteEditor(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300"
        >
          <Plus size={18} />
          Check-In
        </button>
      </div>

      {showNoteEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNoteEditor(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-2">
            <button
              onClick={() => setShowNoteEditor(false)}
              className="absolute top-0 right-0 z-10 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-accent/30 transition-all"
            >
              <X size={14} />
            </button>
            <BehavioralLogbook />
          </div>
        </div>
      )}

      {/* C2: Dollar Cost of Emotions — the #1 headline feature */}
      {emotionDollarCost && (
        <div id="tour-insights-emotion" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {emotionDollarCost.worstEmotion && emotionDollarCost.worstEmotion[1] < 0 && (
            <div className="rounded-2xl border border-loss/20 bg-loss/5 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-loss" />
                <span className="text-[10px] text-loss uppercase tracking-wider font-bold">Costing You Money</span>
              </div>
              <p className="text-2xl font-bold text-loss mb-1">
                {EMOTION_CONFIG[emotionDollarCost.worstEmotion[0]]?.emoji}{" "}
                {emotionDollarCost.worstEmotion[0]} cost you ${Math.abs(emotionDollarCost.worstEmotion[1]).toFixed(0)}
              </p>
              <p className="text-xs text-muted">Total P&L from trades tagged with this emotion in your selected period.</p>
            </div>
          )}
          {emotionDollarCost.bestEmotion && emotionDollarCost.bestEmotion[1] > 0 && (
            <div className="rounded-2xl border border-win/20 bg-win/5 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-win" />
                <span className="text-[10px] text-win uppercase tracking-wider font-bold">Making You Money</span>
              </div>
              <p className="text-2xl font-bold text-win mb-1">
                {EMOTION_CONFIG[emotionDollarCost.bestEmotion[0]]?.emoji}{" "}
                {emotionDollarCost.bestEmotion[0]} earned you ${emotionDollarCost.bestEmotion[1].toFixed(0)}
              </p>
              <p className="text-xs text-muted">Total P&L from trades tagged with this emotion in your selected period.</p>
            </div>
          )}
        </div>
      )}

      {/* C3: Predictive Tilt Warnings — proactive alerts */}
      {predictiveTilt.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-amber-400">Tilt Warning — Take Action Now</h3>
          </div>
          <div className="space-y-2">
            {predictiveTilt.map((warning, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-amber-300/90 px-3 py-2.5 rounded-lg bg-amber-500/5">
                <Eye size={12} className="shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C4: Cognitive Bias Detection */}
      {cognitiveBiases.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Cognitive Biases Detected</h3>
            <span className="text-[10px] text-muted/60 ml-auto">Based on your trading patterns</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cognitiveBiases.map((bias) => (
              <div key={bias.name} className="rounded-xl border border-accent/15 bg-accent/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{bias.icon}</span>
                  <h4 className="text-xs font-bold text-foreground">{bias.name}</h4>
                </div>
                <p className="text-[11px] text-muted leading-relaxed mb-2">{bias.description}</p>
                <p className="text-[10px] text-accent font-medium">{bias.evidence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, i) => {
            const sentimentColors = {
              positive: { border: "border-win/20", bg: "bg-win/5", text: "text-win", Icon: TrendingUp },
              negative: { border: "border-loss/20", bg: "bg-loss/5", text: "text-loss", Icon: TrendingDown },
              neutral: { border: "border-border", bg: "bg-surface", text: "text-muted", Icon: AlertCircle },
            };
            const c = sentimentColors[insight.sentiment];
            return (
              <div key={i} className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <c.Icon size={14} className={c.text} />
                      <span className="text-xs font-semibold text-foreground truncate">{insight.label}</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">{insight.description}</p>
                  </div>
                  <span className={`text-sm font-bold ${c.text} whitespace-nowrap`}>{insight.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trading DNA summary */}
      {tradingDna && (
        <div id="tour-insights-discipline" className="bg-surface rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-glow)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Dna size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Your Trading DNA</h3>
            <span className="text-[10px] text-muted/60 ml-auto">Algorithmically generated profile</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Best Emotion", value: tradingDna.bestEmotion, icon: Heart, color: "text-win" },
              { label: "Best Time", value: tradingDna.bestTime, icon: Clock, color: "text-accent" },
              { label: "Best Setup", value: tradingDna.bestSetup, icon: TrendingUp, color: "text-accent" },
              { label: "Biggest Leak", value: tradingDna.biggestLeak, icon: AlertTriangle, color: "text-loss" },
              { label: "Discipline", value: `${tradingDna.discipline}/10`, icon: Shield, color: "text-amber-400" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <item.icon size={16} className={`${item.color} mx-auto mb-1.5`} />
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-0.5">{item.label}</p>
                <p className={`text-sm font-bold ${item.color} truncate`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tilt warnings history */}
      {tiltSignals.length > 0 && (
        <div className="bg-surface rounded-2xl border border-amber-500/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Tilt Signals Detected</h3>
          </div>
          <div className="space-y-2">
            {tiltSignals.map((signal, i) => (
              <div key={i} className={`flex items-center gap-3 text-xs px-3 py-2 rounded-lg ${
                signal.severity === "danger" ? "bg-loss/5 text-loss" : "bg-amber-500/5 text-amber-500"
              }`}>
                <AlertTriangle size={12} />
                <span>{signal.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion → P&L */}
        {hasEmotionData && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">P&L by Emotion</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={emotionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="emotion" tick={{ fontSize: 11, fill: colors.tick }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "Total P&L"]} />
                <Bar dataKey="pnl" radius={[0, 6, 6, 0]}>
                  {emotionData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Confidence vs P&L scatter */}
        {hasConfidenceData && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Confidence vs P&L</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis type="number" dataKey="confidence" domain={[0, 10]} tick={{ fontSize: 10, fill: colors.tick }} axisLine={{ stroke: colors.grid }} tickLine={false} label={{ value: "Confidence", position: "bottom", fontSize: 10, fill: colors.tick, offset: -5 }} />
                <YAxis type="number" dataKey="pnl" tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]} />
                <Scatter data={confidenceData} fill={colors.accent} fillOpacity={0.7}>
                  {confidenceData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Process Score vs Avg P&L */}
        {hasProcessData && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Process Score vs Avg P&L</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={processData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="score" tick={{ fontSize: 11, fill: colors.tick }} axisLine={{ stroke: colors.grid }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(v) => `Score: ${v}`} formatter={(value) => [`$${Number(value).toFixed(2)}`, "Avg P&L"]} />
                <Bar dataKey="avgPnl" radius={[6, 6, 0, 0]}>
                  {processData.map((entry, i) => (
                    <Cell key={i} fill={entry.avgPnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Discipline trend over time */}
        {disciplineTrend.length >= 2 && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Discipline Trend</h3>
              <span className="text-[10px] text-muted">Weekly avg process score</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={disciplineTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [Number(value).toFixed(1), "Avg Process Score"]} />
                <Line type="monotone" dataKey="avgScore" stroke={colors.accent} strokeWidth={2} dot={{ fill: colors.accent, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion frequency */}
        {emotionFrequency.length > 0 && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Heart size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Emotion Frequency</h3>
            </div>
            <div className="space-y-2">
              {emotionFrequency.map((e) => {
                const max = emotionFrequency[0].count;
                const pct = (e.count / max) * 100;
                return (
                  <div key={e.emotion} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-foreground w-20 truncate">{e.emotion}</span>
                    <div className="flex-1 h-5 bg-background rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-accent/30 rounded-lg flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${pct}%` }}
                      >
                        <span className="text-[10px] font-semibold text-accent">{e.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time of day analysis */}
        {timeOfDay.length > 0 && (
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">P&L by Time of Day</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timeOfDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value, name) => {
                  if (name === "pnl") return [`$${Number(value).toFixed(2)}`, "P&L"];
                  return [value, name];
                }} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {timeOfDay.map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? colors.win : colors.loss} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Win/Loss Streaks Timeline */}
      {streakData.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Win/Loss Streaks</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {streakData.map((streak, i) => (
              <div
                key={i}
                className={`shrink-0 rounded-xl border p-3 min-w-[120px] ${
                  streak.type === "win"
                    ? "bg-win/5 border-win/20"
                    : "bg-loss/5 border-loss/20"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {streak.type === "win" ? (
                    <TrendingUp size={12} className="text-win" />
                  ) : (
                    <TrendingDown size={12} className="text-loss" />
                  )}
                  <span className={`text-xs font-bold ${streak.type === "win" ? "text-win" : "text-loss"}`}>
                    {streak.length} {streak.type === "win" ? "Wins" : "Losses"}
                  </span>
                </div>
                <p className={`text-sm font-bold ${streak.type === "win" ? "text-win" : "text-loss"}`}>
                  ${streak.pnl.toFixed(0)}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted/60">{streak.endDate}</span>
                  {streak.emotion && (
                    <span className="text-[10px] text-muted/40">{streak.emotion}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Type Performance Table */}
      {setupPerformance.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Table2 size={14} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Setup Type Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Setup", "Trades", "Win Rate", "Avg P&L", "Total P&L", "Best", "Worst", "Avg Process"].map((h) => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {setupPerformance.map((s) => (
                  <tr key={s.setup} className="border-b border-border/30 hover:bg-surface-hover transition-colors">
                    <td className="px-3 py-2 font-semibold text-foreground">{s.setup}</td>
                    <td className="px-3 py-2 text-muted">{s.count}</td>
                    <td className="px-3 py-2">
                      <span className={s.winRate >= 50 ? "text-win" : "text-loss"}>{s.winRate.toFixed(0)}%</span>
                    </td>
                    <td className={`px-3 py-2 font-medium ${s.avgPnl >= 0 ? "text-win" : "text-loss"}`}>
                      ${s.avgPnl.toFixed(0)}
                    </td>
                    <td className={`px-3 py-2 font-bold ${s.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                      ${s.totalPnl.toFixed(0)}
                    </td>
                    <td className="px-3 py-2 text-win">${s.best.toFixed(0)}</td>
                    <td className="px-3 py-2 text-loss">${s.worst.toFixed(0)}</td>
                    <td className="px-3 py-2">
                      {s.avgProcess !== null ? (
                        <span className={s.avgProcess >= 7 ? "text-win" : s.avgProcess >= 4 ? "text-amber-400" : "text-loss"}>
                          {s.avgProcess.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checklist Compliance Impact */}
      {checklistImpact && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Checklist Compliance Impact</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full compliance */}
            <div className="rounded-xl border border-win/20 bg-win/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-win" />
                <span className="text-xs font-semibold text-win uppercase tracking-wider">Full Checklist</span>
                <span className="text-[10px] text-muted/60 ml-auto">{checklistImpact.full.count} trades</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-muted/60 mb-0.5">Win Rate</p>
                  <p className="text-lg font-bold text-win">{checklistImpact.full.winRate.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted/60 mb-0.5">Avg P&L</p>
                  <p className={`text-lg font-bold ${checklistImpact.full.avgPnl >= 0 ? "text-win" : "text-loss"}`}>
                    ${checklistImpact.full.avgPnl.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted/60 mb-0.5">Total P&L</p>
                  <p className={`text-lg font-bold ${checklistImpact.full.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                    ${checklistImpact.full.totalPnl.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Partial compliance */}
            <div className="rounded-xl border border-loss/20 bg-loss/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={14} className="text-loss" />
                <span className="text-xs font-semibold text-loss uppercase tracking-wider">Skipped Items</span>
                <span className="text-[10px] text-muted/60 ml-auto">{checklistImpact.partial.count} trades</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-muted/60 mb-0.5">Win Rate</p>
                  <p className="text-lg font-bold text-loss">{checklistImpact.partial.winRate.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted/60 mb-0.5">Avg P&L</p>
                  <p className={`text-lg font-bold ${checklistImpact.partial.avgPnl >= 0 ? "text-win" : "text-loss"}`}>
                    ${checklistImpact.partial.avgPnl.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted/60 mb-0.5">Total P&L</p>
                  <p className={`text-lg font-bold ${checklistImpact.partial.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                    ${checklistImpact.partial.totalPnl.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emotion-P&L Correlation Table (Advanced Mode) */}
      {viewMode === "advanced" && emotionCorrelation.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={14} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Emotion-P&L Correlation</h3>
            <span className="text-[9px] text-muted/50 ml-auto">Advanced</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Emotion", "Trades", "Win Rate", "Avg P&L", "Total P&L", "Avg Hold"].map((h) => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold px-3 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emotionCorrelation.map((row) => {
                  const config = EMOTION_CONFIG[row.emotion];
                  return (
                    <tr key={row.emotion} className="border-b border-border/30 hover:bg-surface-hover transition-colors">
                      <td className="px-3 py-2 font-semibold text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{config?.emoji ?? "❓"}</span>
                          {row.emotion}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted">{row.count}</td>
                      <td className="px-3 py-2">
                        <span className={row.winRate >= 50 ? "text-win" : "text-loss"}>{row.winRate.toFixed(0)}%</span>
                      </td>
                      <td className={`px-3 py-2 font-medium ${row.avgPnl >= 0 ? "text-win" : "text-loss"}`}>
                        ${row.avgPnl.toFixed(0)}
                      </td>
                      <td className={`px-3 py-2 font-bold ${row.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                        ${row.totalPnl.toFixed(0)}
                      </td>
                      <td className="px-3 py-2 text-muted">
                        {row.avgHoldTime < 1
                          ? `${(row.avgHoldTime * 60).toFixed(0)}m`
                          : row.avgHoldTime < 24
                            ? `${row.avgHoldTime.toFixed(1)}h`
                            : `${(row.avgHoldTime / 24).toFixed(1)}d`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
