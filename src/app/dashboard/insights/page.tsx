"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import {
  Trade,
  PsychologyProfile,
  BehavioralLog,
  DailyCheckin,
  SelfSabotageSignal,
  WealthThermostat,
  RiskHomeostasis,
  EndowmentEffect,
  PsychDevelopmentStage,
  AnchoringPattern,
  ExpertSessionLog,
} from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { useDateRange } from "@/lib/date-range-context";
import { useAccount } from "@/lib/account-context";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { PsychologyTierToggle } from "@/components/psychology-tier-toggle";
import { PsychologyProfileWizard } from "@/components/psychology-profile-wizard";
import { EmotionCheckIn } from "@/components/emotion-checkin";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";
import { RISK_PERSONALITIES, SELF_CONCEPT_IDENTITIES } from "@/lib/validators";
import {
  generateBehavioralInsights,
  getEmotionPnlData,
  getConfidencePnlData,
  getProcessScorePnlData,
  calculateTradePnl,
  detectTiltSignals,
  detectSelfSabotage,
  detectWealthThermostat,
  detectRiskHomeostasis,
  detectEndowmentEffect,
  calculatePsychDevelopmentStage,
  detectAnchoringPatterns,
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  ReferenceLine,
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
  Target,
  Flame,
  Activity,
  Plus,
  X,
} from "lucide-react";
import { Header } from "@/components/header";
import { BehavioralLogbook } from "@/components/dashboard/behavioral-logbook";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { InsightUnlockCard } from "@/components/dashboard/insight-unlock-card";


export default function InsightsPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { tier, isAdvanced, isExpert, profile, profileLoading, refreshProfile } = usePsychologyTier();
  const { filterTrades } = useDateRange();
  const { filterByAccount } = useAccount();
  const { theme, viewMode } = useTheme();
  const colors = getChartColors(theme);
  const chartTooltipStyle = {
    background: colors.tooltipBg, backdropFilter: "blur(16px)",
    border: colors.tooltipBorder,
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Psychology-specific data
  const [behavioralLogs, setBehavioralLogs] = useState<BehavioralLog[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [sessionLogs, setSessionLogs] = useState<ExpertSessionLog[]>([]);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    // Fetch trades (paginated, no 1000-row limit)
    const { data: tradeData, error } = await fetchAllTrades(supabase);
    if (error) {
      console.error("Failed to fetch trades:", error.message);
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
      setLoading(false);
      return;
    }
    const dbTrades = (tradeData as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }

    // Psychology data (behavioral logs, checkins, session logs)
    const [logsResult, checkinsResult, sessionResult] = await Promise.all([
      supabase.from("behavioral_logs").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("daily_checkins").select("*").order("date", { ascending: false }).limit(30),
      supabase.from("expert_session_logs").select("*").order("session_date", { ascending: false }).limit(50),
    ]);
    if (logsResult.data) setBehavioralLogs(logsResult.data as BehavioralLog[]);
    if (checkinsResult.data) setCheckins(checkinsResult.data as DailyCheckin[]);
    if (sessionResult.data) setSessionLogs(sessionResult.data as ExpertSessionLog[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Filtered trades ───
  const filtered = useMemo(() => filterByAccount(filterTrades(trades)), [trades, filterTrades, filterByAccount]);
  const closedTrades = useMemo(() => filtered.filter((t) => t.close_timestamp && t.pnl !== null), [filtered]);

  // ─── Insights computations ───
  const insights = useMemo(() => generateBehavioralInsights(filtered), [filtered]);
  const emotionData = useMemo(() => getEmotionPnlData(filtered), [filtered]);
  const confidenceData = useMemo(() => getConfidencePnlData(filtered), [filtered]);
  const processData = useMemo(() => getProcessScorePnlData(filtered), [filtered]);
  const tiltSignals = useMemo(() => detectTiltSignals(filtered), [filtered]);

  // ─── Psychology computations ───
  const selfSabotage = useMemo(() => detectSelfSabotage(closedTrades), [closedTrades]);
  const wealthThermostat = useMemo(() => detectWealthThermostat(closedTrades), [closedTrades]);
  const riskHomeostasis = useMemo(() => detectRiskHomeostasis(closedTrades), [closedTrades]);
  const endowmentEffect = useMemo(() => detectEndowmentEffect(closedTrades), [closedTrades]);
  const devStage = useMemo(() => calculatePsychDevelopmentStage(closedTrades, checkins, behavioralLogs), [closedTrades, checkins, behavioralLogs]);
  const anchoringPatterns = useMemo(() => detectAnchoringPatterns(closedTrades), [closedTrades]);

  // Money script radar data (Expert)
  const moneyScriptData = useMemo(() => {
    if (!profile) return [];
    return [
      { subject: "Avoidance", value: profile.money_avoidance ?? 0, fullMark: 5 },
      { subject: "Worship", value: profile.money_worship ?? 0, fullMark: 5 },
      { subject: "Status", value: profile.money_status ?? 0, fullMark: 5 },
      { subject: "Vigilance", value: profile.money_vigilance ?? 0, fullMark: 5 },
    ];
  }, [profile]);

  const riskInfo = useMemo(() => profile ? RISK_PERSONALITIES.find((r) => r.id === profile.risk_personality) : null, [profile]);
  const identityInfo = useMemo(() => profile ? SELF_CONCEPT_IDENTITIES.find((i) => i.id === profile.self_concept_identity) : null, [profile]);

  // Equity curve for wealth thermostat chart
  const equityCurve = useMemo(() => {
    let cum = 0;
    return [...closedTrades]
      .sort((a, b) => new Date(a.close_timestamp!).getTime() - new Date(b.close_timestamp!).getTime())
      .map((t) => { cum += t.pnl!; return { date: t.close_timestamp!.split("T")[0], pnl: cum }; });
  }, [closedTrades]);

  // Somatic area frequency from expert session logs
  const somaticFrequency = useMemo(() => {
    const freq = sessionLogs.reduce<Record<string, number>>((acc, log) => {
      for (const area of log.somatic_areas) {
        if (area !== "none") acc[area] = (acc[area] || 0) + 1;
      }
      return acc;
    }, {});
    return freq;
  }, [sessionLogs]);
  const maxSomaticCount = useMemo(() => Math.max(1, ...Object.values(somaticFrequency)), [somaticFrequency]);

  // ─── Insights-unique computations ───

  // Emotion-P&L correlation table (expert view mode)
  const emotionCorrelation = useMemo(() => {
    if (viewMode !== "expert") return [];
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

    let biggestLeak = "—";
    let worstCost = 0;
    for (const [emotion, data] of emotionMap) {
      if (data.total < worstCost) { biggestLeak = emotion; worstCost = data.total; }
    }

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

  // Dollar cost of emotions
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

  // Predictive tilt warning
  const predictiveTilt = useMemo(() => {
    const warnings: string[] = [];
    const today = new Date().toISOString().split("T")[0];
    const todayTrades = filtered.filter((t) => t.close_timestamp?.startsWith(today));
    const todayLosses = todayTrades.filter((t) => (t.pnl ?? calculateTradePnl(t) ?? 0) < 0);

    if (todayLosses.length >= 3) {
      warnings.push(
        `You've had ${todayLosses.length} losses today. Historical data shows your decisions get worse after 3+ consecutive losses.`
      );
    }

    const recentFomo = filtered.filter((t) => t.emotion === "FOMO" && t.close_timestamp).slice(0, 10);
    if (recentFomo.length >= 3) {
      const fomoAvgPnl = recentFomo.reduce((sum, t) => sum + (t.pnl ?? calculateTradePnl(t) ?? 0), 0) / recentFomo.length;
      if (fomoAvgPnl < 0) {
        warnings.push(`Your FOMO trades average $${Math.abs(fomoAvgPnl).toFixed(0)} loss each. Consider waiting for your setup.`);
      }
    }

    const recentRevenge = filtered.filter((t) => t.emotion === "Revenge" && t.close_timestamp).slice(0, 5);
    if (recentRevenge.length >= 2) {
      warnings.push("Revenge trading detected in recent trades. Take a break before your next entry.");
    }

    const recentClosed = [...filtered]
      .filter((t) => t.close_timestamp)
      .sort((a, b) => b.close_timestamp!.localeCompare(a.close_timestamp!))
      .slice(0, 10);
    if (recentClosed.length >= 4) {
      const lastFour = recentClosed.slice(0, 4);
      const firstTwo = lastFour.slice(0, 2);
      const lastTwo = lastFour.slice(2);
      const firstAvgQty = firstTwo.reduce((s, t) => s + t.quantity, 0) / firstTwo.length;
      const lastAvgQty = lastTwo.reduce((s, t) => s + t.quantity, 0) / lastTwo.length;
      const lastTwoPnl = lastTwo.reduce((s, t) => s + (t.pnl ?? calculateTradePnl(t) ?? 0), 0);
      if (lastTwoPnl < 0 && firstAvgQty > lastAvgQty * 1.5) {
        warnings.push("Your position size increased after recent losses — classic tilt pattern. Consider sizing down.");
      }
    }

    return warnings;
  }, [filtered]);

  // Cognitive bias detection
  const cognitiveBiases = useMemo(() => {
    const biases: { name: string; description: string; evidence: string; icon: string }[] = [];
    const closed = filtered.filter((t) => t.close_timestamp);
    if (closed.length < 10) return biases;

    const longs = closed.filter((t) => t.position === "long").length;
    const longPct = longs / closed.length;
    if (longPct > 0.8 || longPct < 0.2) {
      biases.push({
        name: "Confirmation Bias",
        description: "You may be seeking only trades that confirm your market view.",
        evidence: `${(Math.max(longPct, 1 - longPct) * 100).toFixed(0)}% of trades are ${longPct > 0.8 ? "long" : "short"}.`,
        icon: "\u{1F50D}",
      });
    }

    const sorted = [...closed].sort((a, b) => a.close_timestamp!.localeCompare(b.close_timestamp!));
    let sizeIncreaseAfterWin = 0;
    let winCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prevPnl = sorted[i - 1].pnl ?? calculateTradePnl(sorted[i - 1]) ?? 0;
      if (prevPnl > 0) {
        winCount++;
        if (sorted[i].quantity > sorted[i - 1].quantity * 1.3) sizeIncreaseAfterWin++;
      }
    }
    if (winCount >= 5 && sizeIncreaseAfterWin / winCount > 0.4) {
      biases.push({
        name: "Recency Bias",
        description: "You tend to increase size after wins, overweighting recent results.",
        evidence: `Position size increased after ${((sizeIncreaseAfterWin / winCount) * 100).toFixed(0)}% of winning trades.`,
        icon: "\u{1F4C8}",
      });
    }

    const holdTimes = closed.map((t) => {
      const ms = new Date(t.close_timestamp!).getTime() - new Date(t.open_timestamp).getTime();
      const hours = ms / (1000 * 60 * 60);
      const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
      return { hours, isWin: pnl > 0 };
    });
    const winHolds = holdTimes.filter((h) => h.isWin);
    const lossHolds = holdTimes.filter((h) => !h.isWin);
    if (winHolds.length >= 5 && lossHolds.length >= 5) {
      const avgWinHold = winHolds.reduce((s, h) => s + h.hours, 0) / winHolds.length;
      const avgLossHold = lossHolds.reduce((s, h) => s + h.hours, 0) / lossHolds.length;
      if (avgLossHold > avgWinHold * 1.8) {
        biases.push({
          name: "Sunk Cost Fallacy",
          description: "You hold losing trades significantly longer than winners, hoping they'll recover.",
          evidence: `Avg loss hold: ${avgLossHold.toFixed(1)}h vs avg win hold: ${avgWinHold.toFixed(1)}h.`,
          icon: "\u23F0",
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

  // ─── Loading / gating ───
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

  const closedCount = filtered.filter((t) => t.close_timestamp).length;
  const closedWithEmotionCount = filtered.filter((t) => t.close_timestamp && t.emotion).length;
  const closedWithChecklistCount = filtered.filter((t) => t.close_timestamp && t.checklist && Object.keys(t.checklist).length > 0).length;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 id="tour-insights-header" className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Brain size={24} className="text-accent" />
            Behavioral Insights
            <InfoTooltip text="AI-powered behavioral analysis of your trading patterns, emotional triggers, and psychology" articleId="an-insights" />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {usingDemo ? "Sample data" : viewMode === "beginner" ? "See how your emotions affect your trading" : "How your psychology impacts your trading performance"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {viewMode !== "beginner" && <PsychologyTierToggle onExpertFirstTime={() => setShowWizard(true)} />}
          {usingDemo && <DemoBanner feature="insights" />}
          <button
            onClick={() => setShowNoteEditor(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300"
          >
            <Plus size={18} />
            Check-In
          </button>
        </div>
      </div>

      {/* Check-In Modal */}
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

      {/* Expert Profile Wizard Modal */}
      {showWizard && (
        <PsychologyProfileWizard
          onComplete={() => { setShowWizard(false); refreshProfile(); }}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BEGINNER LAYOUT — simplified to 4 sections */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "beginner" && (
        <>
          {/* 1. Dollar Cost of Emotions */}
          {!emotionDollarCost && closedWithEmotionCount < 3 && (
            <InsightUnlockCard
              title="Dollar Cost of Emotions"
              description="Discover which emotions are costing you real money — and which ones are making you money."
              current={closedWithEmotionCount}
              required={3}
              unit="trades with emotions"
            />
          )}
          {emotionDollarCost && (
            <div id="tour-insights-emotion" className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {emotionDollarCost.worstEmotion && emotionDollarCost.worstEmotion[1] < 0 && (
                <div className="glass rounded-2xl border border-loss/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-loss" />
                    <span className="text-[10px] text-loss uppercase tracking-wider font-bold">Costing You Money</span>
                  </div>
                  <p className="text-2xl font-bold text-loss mb-1">
                    {EMOTION_CONFIG[emotionDollarCost.worstEmotion[0]]?.emoji}{" "}
                    {emotionDollarCost.worstEmotion[0]} cost you ${Math.abs(emotionDollarCost.worstEmotion[1]).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted">Total P&L from trades tagged with this emotion.</p>
                </div>
              )}
              {emotionDollarCost.bestEmotion && emotionDollarCost.bestEmotion[1] > 0 && (
                <div className="glass rounded-2xl border border-win/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-win" />
                    <span className="text-[10px] text-win uppercase tracking-wider font-bold">Making You Money</span>
                  </div>
                  <p className="text-2xl font-bold text-win mb-1">
                    {EMOTION_CONFIG[emotionDollarCost.bestEmotion[0]]?.emoji}{" "}
                    {emotionDollarCost.bestEmotion[0]} earned you ${emotionDollarCost.bestEmotion[1].toFixed(0)}
                  </p>
                  <p className="text-xs text-muted">Total P&L from trades tagged with this emotion.</p>
                </div>
              )}
            </div>
          )}

          {/* 2. Emotion Check-In */}
          <EmotionCheckIn mode="auto" context="standalone" embedded={false} />

          {/* 3. Trading DNA */}
          {!tradingDna && closedCount < 5 && (
            <InsightUnlockCard
              title="Your Trading DNA"
              description="Your personal trading fingerprint — best emotion, best time of day, best setup, biggest leak, and discipline score."
              current={closedCount}
              required={5}
            />
          )}
          {tradingDna && (
            <div id="tour-insights-discipline" className="bg-surface rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-glow)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Dna size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Your Trading DNA</h3>
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

          {/* 4. Psychological Development */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" />
              Your Growth
            </h2>
            <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full h-2 rounded-full transition-all ${
                      s <= devStage.stage ? "bg-accent" : "bg-border/30"
                    }`} />
                    <span className={`text-[8px] ${s === devStage.stage ? "text-accent font-bold" : "text-muted/50"}`}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-sm font-bold text-foreground">
                Stage {devStage.stage}: {devStage.label}
              </div>
              <p className="text-[10px] text-muted mt-1">{devStage.nextStageHint}</p>
              <div className="mt-3 space-y-1">
                {devStage.criteria.met.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-win">
                    <span>&#10003;</span> {c}
                  </div>
                ))}
                {devStage.criteria.unmet.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted/50">
                    <span>&#9675;</span> {c}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ADVANCED / EXPERT LAYOUT — full content */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode !== "beginner" && (<>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: PREDICTIVE TILT WARNINGS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: DOLLAR COST OF EMOTIONS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {!emotionDollarCost && closedWithEmotionCount < 3 && (
        <InsightUnlockCard
          title="Dollar Cost of Emotions"
          description="Discover which emotions are costing you real money — and which ones are making you money."
          current={closedWithEmotionCount}
          required={3}
          unit="trades with emotions"
        />
      )}
      {emotionDollarCost && (
        <div id="tour-insights-emotion" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {emotionDollarCost.worstEmotion && emotionDollarCost.worstEmotion[1] < 0 && (
            <div className="glass rounded-2xl border border-loss/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
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
            <div className="glass rounded-2xl border border-win/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: TRADING DNA */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {!tradingDna && closedCount < 5 && (
        <InsightUnlockCard
          title="Your Trading DNA"
          description="Your personal trading fingerprint — best emotion, best time of day, best setup, biggest leak, and discipline score."
          current={closedCount}
          required={5}
        />
      )}
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: COGNITIVE BIAS DETECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cognitiveBiases.length === 0 && closedCount < 10 && (
        <InsightUnlockCard
          title="Cognitive Bias Detection"
          description="AI-detected biases in your trading — confirmation bias, recency bias, sunk cost fallacy, and more."
          current={closedCount}
          required={10}
        />
      )}
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: BEHAVIORAL INSIGHT CARDS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: EMOTION CENTER (EmotionCheckIn + 3 charts) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity size={16} className="text-accent" />
          Emotion Center <InfoTooltip text="This section correlates your emotions with actual trading outcomes. It reveals which feelings make you money and which cost you." articleId="tj-emotions" />
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Emotion Check-In */}
          <EmotionCheckIn mode="auto" context="standalone" embedded={false} />

          {/* P&L by Emotion */}
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

          {/* Confidence vs P&L */}
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: TILT SIGNALS HISTORY */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: PERFORMANCE ANALYTICS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* Discipline trend + Emotion frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>

      {/* Time of day + Win/Loss streaks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Win/Loss Streaks */}
        {streakData.length === 0 && closedCount < 3 && (
          <InsightUnlockCard
            title="Win/Loss Streaks"
            description="Visualize your winning and losing streaks with emotional context — see patterns in your runs."
            current={closedCount}
            required={3}
          />
        )}
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
                    streak.type === "win" ? "bg-win/5 border-win/20" : "bg-loss/5 border-loss/20"
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
      </div>

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
                        <span className="text-muted/30">&mdash;</span>
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
      {!checklistImpact && closedWithChecklistCount < 4 && (
        <InsightUnlockCard
          title="Checklist Compliance Impact"
          description="See how following your pre-trade rules impacts your win rate and P&L — the data doesn't lie."
          current={closedWithChecklistCount}
          required={4}
          unit="trades with checklists"
        />
      )}
      {checklistImpact && (
        <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Checklist Compliance Impact</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: MIND-BODY LAB (Advanced+) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isAdvanced && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Eye size={16} className="text-accent" />
            Mind-Body Lab <InfoTooltip text="Advanced analytics showing how your physical and mental state affect trading. Sleep, biases, triggers — all quantified." articleId="tj-somatic-body-map" />
            <span className="text-[10px] text-accent/50 font-normal">Advanced</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sleep Quality Impact */}
            <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-muted mb-3">Sleep Quality Impact</h3>
              {checkins.filter((c) => c.sleep_quality).length > 3 ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const daysWithSleep = checkins.filter((c) => c.sleep_quality === level);
                    return (
                      <div key={level} className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-muted">Sleep {level}/5</span>
                        <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent/60 rounded-full"
                            style={{ width: `${(daysWithSleep.length / checkins.length) * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-muted">{daysWithSleep.length}d</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-12">Log sleep quality in daily check-ins to see impact</p>
              )}
            </div>

            {/* Bias Cost Calculator */}
            <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-muted mb-3">Bias Cost Calculator</h3>
              {behavioralLogs.length > 0 ? (
                <div className="space-y-2">
                  {(() => {
                    const biasCounts = behavioralLogs.reduce<Record<string, number>>((acc, log) => {
                      for (const bias of log.biases) {
                        acc[bias] = (acc[bias] || 0) + 1;
                      }
                      return acc;
                    }, {});
                    return Object.entries(biasCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([bias, count]) => (
                        <div key={bias} className="flex items-center justify-between text-xs">
                          <span className="text-loss">{bias}</span>
                          <span className="text-muted">{count} occurrences</span>
                        </div>
                      ));
                  })()}
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-12">Track biases in emotion check-ins to see their frequency</p>
              )}
            </div>

            {/* Daily Check-In Trend */}
            <div className="glass rounded-2xl border border-border/50 p-5 lg:col-span-2" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-muted mb-3">Daily Check-In Trend (Last 14 Days)</h3>
              {checkins.length > 3 ? (
                <div className="flex gap-1.5 overflow-x-auto pb-2">
                  {checkins.slice(0, 14).reverse().map((c) => (
                    <div key={c.id} className="flex flex-col items-center gap-1 min-w-[44px]">
                      <div className={`w-3 h-3 rounded-full ${
                        c.traffic_light === "green" ? "bg-win" : c.traffic_light === "yellow" ? "bg-yellow-400" : "bg-loss"
                      }`} />
                      <div className="text-[9px] text-muted">M{c.mood}</div>
                      {c.energy && <div className="text-[9px] text-muted">E{c.energy}</div>}
                      <div className="text-[8px] text-muted/50">{new Date(c.date).getDate()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-8">Complete daily check-ins to see trends</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 10: PATTERN DETECTION (Advanced+) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isAdvanced && (closedTrades.length >= 10) && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            Pattern Detection <InfoTooltip text="Algorithmic detection of unconscious patterns: self-sabotage, P&L ceilings, position sizing biases, and disposition effects." articleId="tj-cognitive-distortions" />
            <span className="text-[10px] text-accent/50 font-normal">Algorithmic</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Wealth Thermostat */}
            {wealthThermostat ? (
              <div className="glass rounded-2xl border border-loss/20 p-5 lg:col-span-2" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-loss mb-1">Wealth Thermostat Detected</h3>
                <p className="text-[10px] text-muted mb-3">
                  Your equity has bounced off ~${wealthThermostat.ceilingLevel.toLocaleString()} {wealthThermostat.peakCount} times, retracing an average of {wealthThermostat.avgRetracePercent}% each time.
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis dataKey="date" tick={{ fill: colors.tick, fontSize: 9 }} tickFormatter={(d: string) => d.slice(5)} />
                    <YAxis tick={{ fill: colors.tick, fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.grid}`, borderRadius: 8, fontSize: 11 }} />
                    <ReferenceLine y={wealthThermostat.ceilingLevel} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Ceiling: $${wealthThermostat.ceilingLevel}`, fill: "#ef4444", fontSize: 10 }} />
                    <Area type="monotone" dataKey="pnl" stroke={colors.accent} fill={colors.accent} fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : equityCurve.length > 20 && (
              <div className="glass rounded-2xl border border-win/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-win mb-1">No Wealth Thermostat</h3>
                <p className="text-[10px] text-muted">Your equity curve doesn&apos;t show a repeated ceiling pattern. This is healthy growth.</p>
              </div>
            )}

            {/* Risk Homeostasis */}
            {riskHomeostasis && (
              <div className="glass rounded-2xl border border-yellow-500/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-yellow-400 mb-2">Risk Homeostasis</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Avg size after win</span>
                    <span className="text-foreground font-bold">${riskHomeostasis.sizeAfterWin.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Avg size after loss</span>
                    <span className="text-foreground font-bold">${riskHomeostasis.sizeAfterLoss.toLocaleString()}</span>
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 ${riskHomeostasis.direction === "doubling_down" ? "text-loss" : "text-yellow-400"}`}>
                    {riskHomeostasis.direction === "doubling_down"
                      ? `You size up ${riskHomeostasis.changePercent}% after losses — doubling down`
                      : `You size down ${Math.abs(riskHomeostasis.changePercent)}% after losses — compensating`}
                  </div>
                </div>
              </div>
            )}

            {/* Self-Sabotage */}
            {selfSabotage.length > 0 && (
              <div className="glass rounded-2xl border border-loss/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-loss mb-2">Self-Sabotage Patterns</h3>
                {selfSabotage.map((sig, i) => (
                  <div key={i} className="mb-2">
                    <div className="text-[10px] text-foreground font-medium">
                      {sig.type === "process_break" ? "Process Breaks" : "Profit Givebacks"}: {sig.occurrences}x
                    </div>
                    <div className="text-[10px] text-muted">
                      {sig.type === "process_break"
                        ? "High-process streaks broken by sudden low-discipline trades"
                        : "Profitable weeks followed by overtrading that gives back gains"}
                    </div>
                    {sig.examples.slice(0, 2).map((ex, j) => (
                      <div key={j} className="text-[9px] text-muted/70 mt-0.5">
                        {ex.date}: ${ex.pnl.toFixed(0)} (process: {ex.processScore ?? "\u2014"})
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Endowment Effect */}
            {endowmentEffect.length > 0 && (
              <div className="glass rounded-2xl border border-yellow-500/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-yellow-400 mb-2">Disposition Effect by Symbol</h3>
                <p className="text-[10px] text-muted mb-2">You hold losing positions longer than winners on these symbols:</p>
                <div className="space-y-1.5">
                  {endowmentEffect.slice(0, 5).map((e) => (
                    <div key={e.symbol} className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium">{e.symbol}</span>
                      <div className="text-[10px] text-muted">
                        Win: {e.avgHoldWin.toFixed(1)}h | Loss: {e.avgHoldLoss.toFixed(1)}h |{" "}
                        <span className={e.ratio > 2 ? "text-loss font-bold" : "text-yellow-400"}>{e.ratio.toFixed(1)}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 11: DEEP PSYCHOLOGY (Expert) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isExpert && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            Deep Psychology <InfoTooltip text="Your complete psychological profile with personality assessment, money scripts, and growth tracking." articleId="tj-emotions" />
            <span className="text-[10px] text-accent/50 font-normal">Expert</span>
          </h2>

          {/* Profile Card */}
          {profile ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Risk Personality */}
              <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3 flex items-center gap-1.5">
                  <Shield size={14} className="text-accent" /> Risk Personality
                </h3>
                {riskInfo && (
                  <div>
                    <div className="text-2xl mb-1">{riskInfo.emoji}</div>
                    <div className="text-sm font-bold text-foreground">{riskInfo.label}</div>
                    <div className="text-[10px] text-muted mt-1">{riskInfo.description}</div>
                  </div>
                )}
              </div>

              {/* Self-Concept */}
              <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3 flex items-center gap-1.5">
                  <Target size={14} className="text-accent" /> Trading Identity
                </h3>
                {identityInfo && (
                  <div>
                    <div className="text-sm font-bold text-foreground">{identityInfo.label}</div>
                    <div className="text-[10px] text-muted mt-1">{identityInfo.description}</div>
                  </div>
                )}
                {profile.self_concept_text && (
                  <div className="mt-3 p-2 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-[10px] text-accent/80 italic">&quot;As a trader, I am {profile.self_concept_text}&quot;</p>
                  </div>
                )}
              </div>

              {/* Loss Aversion */}
              <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3 flex items-center gap-1.5">
                  <Flame size={14} className="text-accent" /> Loss Aversion
                </h3>
                <div className="text-3xl font-bold text-foreground">
                  {profile.loss_aversion_coefficient?.toFixed(1) ?? "\u2014"}x
                </div>
                <div className="text-[10px] text-muted mt-1">
                  Losses feel {profile.loss_aversion_coefficient?.toFixed(1) ?? "\u2014"}x more painful than equivalent gains
                </div>
                <div className="text-[9px] text-muted/50 mt-2">
                  Average: 2.0x | Your position attachment: {profile.position_attachment_score?.toFixed(1) ?? "\u2014"}/5
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-accent/20 p-8 text-center">
              <Sparkles className="mx-auto text-accent mb-3" size={32} />
              <h3 className="text-sm font-bold text-foreground mb-1">Complete Your Psychology Profile</h3>
              <p className="text-xs text-muted mb-4">A 5-minute assessment to unlock personalized AI coaching and deep pattern detection.</p>
              <button
                onClick={() => setShowWizard(true)}
                className="px-6 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all"
              >
                Start Assessment
              </button>
            </div>
          )}

          {/* Money Script Radar */}
          {profile && moneyScriptData.length > 0 && (
            <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-muted mb-3">Money Script Profile</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={moneyScriptData}>
                  <PolarGrid stroke={colors.grid} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: colors.tick, fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fill: colors.tick, fontSize: 9 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke={colors.accent}
                    fill={colors.accent}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {moneyScriptData.map((d) => (
                  <div key={d.subject} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{d.subject}</span>
                    <span className={`font-bold ${d.value > 3.5 ? "text-loss" : d.value > 2.5 ? "text-yellow-400" : "text-win"}`}>
                      {d.value.toFixed(1)}/5
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Style + Reassessment */}
          {profile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3">Decision Style</h3>
                <div className="text-lg font-bold text-foreground capitalize">{profile.decision_style ?? "Unknown"}</div>
                <div className="text-[10px] text-muted mt-1">
                  {profile.decision_style === "intuitive" && "You rely on gut feelings and pattern recognition"}
                  {profile.decision_style === "analytical" && "You prefer data-driven, rule-based decisions"}
                  {profile.decision_style === "hybrid" && "You balance intuition with systematic analysis"}
                </div>
              </div>

              <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3">Profile Health</h3>
                {profile.reassess_after && (
                  <div>
                    <div className="text-xs text-foreground">
                      Reassessment: <span className="font-bold">{new Date(profile.reassess_after).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[10px] text-muted mt-1">
                      Quarterly reassessment tracks your psychological growth
                    </div>
                    {new Date(profile.reassess_after) <= new Date() && (
                      <button
                        onClick={() => setShowWizard(true)}
                        className="mt-3 px-4 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-medium hover:bg-accent/20 transition-all"
                      >
                        Retake Assessment
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Somatic Heatmap */}
          {Object.keys(somaticFrequency).length > 0 && (
            <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-muted mb-3">Somatic Tension Map</h3>
              <p className="text-[10px] text-muted mb-3">Body areas you report tension in most frequently across {sessionLogs.length} sessions:</p>
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 100 200" className="w-28 h-auto">
                  <circle cx="50" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <line x1="50" y1="27" x2="50" y2="35" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <path d="M 30 35 L 70 35 L 65 110 L 35 110 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <path d="M 30 35 L 15 80 L 12 120" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <path d="M 70 35 L 85 80 L 88 120" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <path d="M 35 110 L 30 170 L 25 195" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <path d="M 65 110 L 70 170 L 75 195" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />

                  {[
                    { area: "jaw", cx: 50, cy: 22 },
                    { area: "shoulders", cx: 50, cy: 52 },
                    { area: "chest", cx: 50, cy: 72 },
                    { area: "stomach", cx: 50, cy: 95 },
                    { area: "hands", cx: 50, cy: 130 },
                  ].map(({ area, cx, cy }) => {
                    const count = somaticFrequency[area] ?? 0;
                    if (count === 0) return null;
                    const intensity = count / maxSomaticCount;
                    return (
                      <circle
                        key={area}
                        cx={cx}
                        cy={cy}
                        r={6 + intensity * 8}
                        fill={`rgba(239, 68, 68, ${0.2 + intensity * 0.4})`}
                        stroke={`rgba(239, 68, 68, ${0.4 + intensity * 0.3})`}
                        strokeWidth="1"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {Object.entries(somaticFrequency).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
                  <span key={area} className="text-[10px] text-muted">
                    {area}: <span className="text-loss font-bold">{count}x</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Anchoring Patterns */}
          {anchoringPatterns.length > 0 && (
            <div className="glass rounded-2xl border border-yellow-500/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-yellow-400 mb-2">Anchoring Patterns</h3>
              <p className="text-[10px] text-muted mb-2">Entry prices clustering near specific levels — possible unconscious anchoring:</p>
              <div className="space-y-1.5">
                {anchoringPatterns.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{a.symbol}</span>
                    <div className="text-[10px] text-muted">
                      {a.tradeCount} entries near{" "}
                      <span className="text-yellow-400 font-bold">
                        ${a.anchorPrice.toLocaleString()}
                      </span>{" "}
                      ({a.pattern === "round_number" ? "round number" : "previous price"})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 12: PSYCHOLOGICAL DEVELOPMENT (All tiers) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          Psychological Development <InfoTooltip text="Tracks your progression through 5 stages of trading psychology mastery. Each stage has specific criteria based on your actual data." articleId="tj-emotions" />
        </h2>

        <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-2 rounded-full transition-all ${
                  s <= devStage.stage ? "bg-accent" : "bg-border/30"
                }`} />
                <span className={`text-[8px] ${s === devStage.stage ? "text-accent font-bold" : "text-muted/50"}`}>
                  {s}
                </span>
              </div>
            ))}
          </div>

          <div className="text-sm font-bold text-foreground">
            Stage {devStage.stage}: {devStage.label}
          </div>
          <p className="text-[10px] text-muted mt-1">{devStage.nextStageHint}</p>

          <div className="mt-3 space-y-1">
            {devStage.criteria.met.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-win">
                <span>&#10003;</span> {c}
              </div>
            ))}
            {devStage.criteria.unmet.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted/50">
                <span>&#9675;</span> {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 13: EMOTION-P&L CORRELATION TABLE (Expert viewMode) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode !== "advanced" && emotionCorrelation.length > 0 && (
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
                          <span>{config?.emoji ?? "\u2753"}</span>
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

      {/* ─── Tier upgrade prompts ─── */}
      {tier === "simple" && (
        <div className="glass rounded-2xl border border-border/30 p-5 text-center">
          <p className="text-xs text-muted">
            Switch to <span className="text-accent font-semibold">Advanced</span> to track sleep, cognitive load, expanded biases, and 20+ trigger types.
          </p>
        </div>
      )}
      {tier === "advanced" && (
        <div className="glass rounded-2xl border border-accent/10 p-5 text-center">
          <p className="text-xs text-muted">
            Switch to <span className="text-accent font-semibold">Expert</span> for psychological profiling, cognitive distortion tracking, somatic body mapping, and AI-adapted coaching.
          </p>
        </div>
      )}

      </>)}
    </div>
  );
}
