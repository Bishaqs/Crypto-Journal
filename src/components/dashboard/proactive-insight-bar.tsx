"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Trade } from "@/lib/types";
import { TiltSignal, generateBehavioralInsights } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, AlertCircle, Brain, Flame, Sun, ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { useAiEnhancedInsights, fetchAiInsight } from "@/lib/ai-insights";
import { useDismissedTilt } from "@/lib/use-dismissed-tilt";

type InsightItem = {
  id: string;
  priority: number; // lower = higher priority
  text: string;
  type: "danger" | "warning" | "coaching" | "motivation" | "nudge";
  icon: React.ElementType;
};

const TYPE_STYLES: Record<InsightItem["type"], { border: string; bg: string; iconColor: string }> = {
  danger: { border: "border-l-red-500", bg: "bg-red-500/5", iconColor: "text-red-400" },
  warning: { border: "border-l-amber-500", bg: "bg-amber-500/5", iconColor: "text-amber-400" },
  coaching: { border: "border-l-accent", bg: "bg-accent/5", iconColor: "text-accent" },
  motivation: { border: "border-l-emerald-500", bg: "bg-emerald-500/5", iconColor: "text-emerald-400" },
  nudge: { border: "border-l-border", bg: "bg-surface", iconColor: "text-muted" },
};

export function ProactiveInsightBar({
  trades,
  tiltSignals,
}: {
  trades: Trade[];
  tiltSignals: TiltSignal[];
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { isDismissed: isTiltDismissed, dismiss: dismissTilt } = useDismissedTilt();
  const [activeIndex, setActiveIndex] = useState(0);
  const [trafficLight, setTrafficLight] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);
  const [hasCheckin, setHasCheckin] = useState<boolean | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const supabase = createClient();
  const { isEnabled, apiKey, provider } = useAiEnhancedInsights();

  // Fetch today's check-in and streak data
  const fetchContextData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    // Daily check-in
    const { data: checkinData } = await supabase
      .from("daily_checkins")
      .select("traffic_light")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (checkinData && checkinData.length > 0) {
      setTrafficLight(checkinData[0].traffic_light);
      setHasCheckin(true);
    } else {
      setHasCheckin(false);
    }

    // Streak
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("current_streak")
      .limit(1)
      .maybeSingle();

    if (streakData) {
      setCurrentStreak(streakData.current_streak);
    }
  }, [supabase]);

  useEffect(() => {
    fetchContextData();
  }, [fetchContextData]);

  // AI enhancement
  useEffect(() => {
    if (!isEnabled || !apiKey || trades.length === 0) return;
    const closed = trades.filter((t) => t.close_timestamp !== null);
    if (closed.length === 0) return;
    const recentTrades = closed.slice(0, 20).map((t) => ({
      symbol: t.symbol,
      position: t.position,
      pnl: t.pnl,
      emotion: t.emotion,
    }));
    fetchAiInsight(
      recentTrades,
      "Proactive insight bar — generate one actionable coaching tip based on the trader's recent patterns",
      apiKey,
      provider,
    ).then((result) => setAiInsight(result));
  }, [isEnabled, apiKey, provider, trades]);

  const behavioralInsights = useMemo(() => generateBehavioralInsights(trades), [trades]);

  // Build prioritized insight list
  const insights = useMemo(() => {
    const items: InsightItem[] = [];

    // Priority 1: Tilt signals (danger)
    for (const signal of tiltSignals) {
      items.push({
        id: `tilt-${signal.type}`,
        priority: signal.severity === "danger" ? 1 : 2,
        text: signal.message,
        type: signal.severity === "danger" ? "danger" : "warning",
        icon: AlertTriangle,
      });
    }

    // Priority 2: Traffic light warning
    if (trafficLight === "red") {
      items.push({
        id: "traffic-red",
        priority: 2,
        text: "You checked in as Red today — consider sitting out or trading small.",
        type: "warning",
        icon: AlertCircle,
      });
    } else if (trafficLight === "yellow") {
      items.push({
        id: "traffic-yellow",
        priority: 3,
        text: "You checked in as Yellow — proceed with caution, stick to A+ setups only.",
        type: "warning",
        icon: AlertCircle,
      });
    }

    // Priority 3: Behavioral coaching
    if (behavioralInsights.length > 0) {
      const top = behavioralInsights[0];
      items.push({
        id: `coaching-${top.label}`,
        priority: 4,
        text: `${top.label}: ${top.description}`,
        type: "coaching",
        icon: Brain,
      });
    }

    // Priority 4: Streak motivation
    if (currentStreak !== null) {
      const milestones = [7, 14, 30, 60, 90, 180, 365];
      const nextMilestone = milestones.find((m) => m > currentStreak);
      if (nextMilestone && nextMilestone - currentStreak <= 3) {
        items.push({
          id: `streak-${nextMilestone}`,
          priority: 5,
          text: `${nextMilestone - currentStreak} more day${nextMilestone - currentStreak !== 1 ? "s" : ""} to your ${nextMilestone}-day streak milestone!`,
          type: "motivation",
          icon: Flame,
        });
      }
    }

    // Priority 5: No check-in nudge
    if (hasCheckin === false) {
      items.push({
        id: "nudge-checkin",
        priority: 6,
        text: "Start your day right — do your Daily Check-In before trading.",
        type: "nudge",
        icon: Sun,
      });
    }

    // Priority 6: AI-generated coaching (lowest priority)
    if (aiInsight) {
      items.push({
        id: "ai-coaching",
        priority: 7,
        text: aiInsight,
        type: "coaching",
        icon: Sparkles,
      });
    }

    return items
      .filter((item) => {
        if (item.id.startsWith("tilt-")) {
          return !isTiltDismissed(item.id.replace("tilt-", ""));
        }
        return !dismissed.has(item.id);
      })
      .sort((a, b) => a.priority - b.priority);
  }, [tiltSignals, trafficLight, behavioralInsights, currentStreak, hasCheckin, dismissed, isTiltDismissed, aiInsight]);

  // Auto-rotate
  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % insights.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [insights.length]);

  // Clamp active index
  useEffect(() => {
    if (activeIndex >= insights.length) setActiveIndex(0);
  }, [insights.length, activeIndex]);

  if (insights.length === 0) return null;

  const current = insights[activeIndex] || insights[0];
  if (!current) return null;

  const style = TYPE_STYLES[current.type];
  const Icon = current.icon;

  return (
    <div className={`rounded-xl border border-border/30 ${style.bg} border-l-4 ${style.border} px-4 py-2.5 flex items-center gap-3`}>
      <Icon size={14} className={`shrink-0 ${style.iconColor}`} />
      <p className="flex-1 text-xs text-foreground/80 leading-snug">{current.text}</p>

      {/* Navigation */}
      {insights.length > 1 && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveIndex((prev) => (prev - 1 + insights.length) % insights.length)}
            className="p-0.5 text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={12} />
          </button>
          <div className="flex gap-1">
            {insights.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-colors ${
                  i === activeIndex ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % insights.length)}
            className="p-0.5 text-muted hover:text-foreground transition-colors"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* Dismiss */}
      <button
        onClick={() => {
          if (current.id.startsWith("tilt-")) {
            dismissTilt(current.id.replace("tilt-", ""));
          } else {
            setDismissed((prev) => new Set(prev).add(current.id));
          }
        }}
        className="p-1 text-muted hover:text-foreground transition-colors shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}
