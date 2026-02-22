"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { Trade } from "@/lib/types";

type Level = {
  label: string;
  color: string;
  bg: string;
  min: number;
  max: number;
};

const LEVELS: Level[] = [
  { label: "Extreme Fear", color: "text-loss", bg: "bg-loss", min: 0, max: 25 },
  { label: "Fear", color: "text-orange-400", bg: "bg-orange-400", min: 25, max: 45 },
  { label: "Neutral", color: "text-yellow-400", bg: "bg-yellow-400", min: 45, max: 55 },
  { label: "Greed", color: "text-emerald-400", bg: "bg-emerald-400", min: 55, max: 75 },
  { label: "Extreme Greed", color: "text-win", bg: "bg-win", min: 75, max: 100 },
];

function getLevel(score: number): Level {
  return LEVELS.find((l) => score >= l.min && score < l.max) ?? LEVELS[2];
}

function calculateFearGreedIndex(trades: Trade[]): {
  score: number;
  factors: { name: string; value: number; signal: string }[];
} {
  if (trades.length < 5) {
    return {
      score: 50,
      factors: [
        { name: "Insufficient data", value: 50, signal: "neutral" },
      ],
    };
  }

  const recentTrades = trades.slice(-20);
  const allSizes = trades.map((t) => Math.abs(t.pnl ?? 0));
  const avgSize = allSizes.reduce((a, b) => a + b, 0) / allSizes.length || 1;

  // Factor 1: Position size vs average (oversizing = greed)
  const recentSizes = recentTrades.map((t) => Math.abs(t.pnl ?? 0));
  const recentAvgSize = recentSizes.reduce((a, b) => a + b, 0) / recentSizes.length || 1;
  const sizeRatio = recentAvgSize / avgSize;
  const sizingScore = Math.min(100, Math.max(0, 50 + (sizeRatio - 1) * 50));

  // Factor 2: Trade frequency (more trades = greed)
  const recentDays = new Set(recentTrades.map((t) => t.open_timestamp?.slice(0, 10))).size || 1;
  const tradesPerDay = recentTrades.length / recentDays;
  const allDays = new Set(trades.map((t) => t.open_timestamp?.slice(0, 10))).size || 1;
  const avgTradesPerDay = trades.length / allDays;
  const freqRatio = tradesPerDay / (avgTradesPerDay || 1);
  const frequencyScore = Math.min(100, Math.max(0, 50 + (freqRatio - 1) * 40));

  // Factor 3: Win/loss streak reaction (quick re-entry after win = greed)
  let streakScore = 50;
  const lastFive = recentTrades.slice(-5);
  const wins = lastFive.filter((t) => (t.pnl ?? 0) > 0).length;
  if (wins >= 4) streakScore = 75; // winning streak → possible overconfidence
  if (wins <= 1) streakScore = 25; // losing streak → possible fear

  // Factor 4: Confidence levels (high average = greed)
  const confTrades = recentTrades.filter((t) => t.confidence != null);
  const avgConfidence = confTrades.length > 0
    ? confTrades.reduce((a, t) => a + (t.confidence ?? 5), 0) / confTrades.length
    : 5;
  const confidenceScore = Math.min(100, Math.max(0, avgConfidence * 10));

  // Composite: weighted average
  const score = Math.round(
    sizingScore * 0.3 +
    frequencyScore * 0.25 +
    streakScore * 0.25 +
    confidenceScore * 0.2
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    factors: [
      {
        name: "Position Sizing",
        value: Math.round(sizingScore),
        signal: sizingScore > 60 ? "greed" : sizingScore < 40 ? "fear" : "neutral",
      },
      {
        name: "Trade Frequency",
        value: Math.round(frequencyScore),
        signal: frequencyScore > 60 ? "greed" : frequencyScore < 40 ? "fear" : "neutral",
      },
      {
        name: "Streak Reaction",
        value: Math.round(streakScore),
        signal: streakScore > 60 ? "greed" : streakScore < 40 ? "fear" : "neutral",
      },
      {
        name: "Confidence Level",
        value: Math.round(confidenceScore),
        signal: confidenceScore > 60 ? "greed" : confidenceScore < 40 ? "fear" : "neutral",
      },
    ],
  };
}

// Demo data for when no trades
const DEMO_RESULT = {
  score: 62,
  factors: [
    { name: "Position Sizing", value: 68, signal: "greed" },
    { name: "Trade Frequency", value: 55, signal: "neutral" },
    { name: "Streak Reaction", value: 72, signal: "greed" },
    { name: "Confidence Level", value: 53, signal: "neutral" },
  ],
};

export function FearGreedGauge({ trades }: { trades?: Trade[] }) {
  const result = useMemo(() => {
    if (!trades || trades.length < 5) return DEMO_RESULT;
    return calculateFearGreedIndex(trades);
  }, [trades]);

  const level = getLevel(result.score);

  // Needle angle: 0 = left (fear), 180 = right (greed)
  const needleAngle = -90 + (result.score / 100) * 180;

  return (
    <div className="rounded-2xl border border-border glass p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Fear & Greed Index
        </h3>
        <span className="text-[10px] text-muted">Personal</span>
      </div>

      {/* Gauge */}
      <div className="flex justify-center mb-4">
        <div className="relative w-48 h-24 overflow-hidden">
          {/* Semicircle background segments */}
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {/* Background arc segments */}
            <path
              d="M 10 100 A 90 90 0 0 1 46 28"
              fill="none"
              stroke="rgba(239,68,68,0.3)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 46 28 A 90 90 0 0 1 82 8"
              fill="none"
              stroke="rgba(251,146,60,0.3)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 82 8 A 90 90 0 0 1 118 8"
              fill="none"
              stroke="rgba(250,204,21,0.3)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 118 8 A 90 90 0 0 1 154 28"
              fill="none"
              stroke="rgba(52,211,153,0.3)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 154 28 A 90 90 0 0 1 190 100"
              fill="none"
              stroke="rgba(34,197,94,0.3)"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Needle */}
            <line
              x1="100"
              y1="100"
              x2={100 + 70 * Math.cos((needleAngle * Math.PI) / 180)}
              y2={100 + 70 * Math.sin((needleAngle * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-foreground"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="4" className="fill-foreground" />
          </svg>

          {/* Labels */}
          <span className="absolute bottom-0 left-0 text-[9px] text-loss font-medium">
            Fear
          </span>
          <span className="absolute bottom-0 right-0 text-[9px] text-win font-medium">
            Greed
          </span>
        </div>
      </div>

      {/* Score + Label */}
      <div className="text-center mb-4">
        <span className={`text-3xl font-bold ${level.color}`}>
          {result.score}
        </span>
        <p className={`text-sm font-medium ${level.color} mt-0.5`}>
          {level.label}
        </p>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2">
        {result.factors.map((f) => (
          <div key={f.name} className="flex items-center gap-2">
            <span className="text-[10px] text-muted w-28 shrink-0">
              {f.name}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  f.value > 60
                    ? "bg-win"
                    : f.value < 40
                      ? "bg-loss"
                      : "bg-yellow-400"
                }`}
                style={{ width: `${f.value}%` }}
              />
            </div>
            <div className="w-5 flex justify-center">
              {f.signal === "greed" ? (
                <TrendingUp size={10} className="text-win" />
              ) : f.signal === "fear" ? (
                <TrendingDown size={10} className="text-loss" />
              ) : (
                <Minus size={10} className="text-yellow-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
