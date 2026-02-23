"use client";

import { useEffect, useState } from "react";

type Sentiment = "bullish" | "bearish" | "consolidation";
type ColorScheme = "trading" | "brand";

const COLOR_SCHEMES = {
  trading: {
    up: "34,197,94",     // green
    down: "239,68,68",   // red
    bodyUp: 0.30,
    bodyDown: 0.25,
    wickUp: 0.28,
    wickDown: 0.22,
    borderUp: 0.18,
    borderDown: 0.15,
  },
  brand: {
    up: "139,92,246",    // violet-500
    down: "167,139,250", // violet-400
    bodyUp: 0.50,
    bodyDown: 0.40,
    wickUp: 0.45,
    wickDown: 0.35,
    borderUp: 0.30,
    borderDown: 0.25,
  },
} as const;

const SPAWN_DIRECTIONS = ["candle-from-top", "candle-from-bottom", "candle-from-left", "candle-from-right"] as const;

// Deterministic pseudo-random based on seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Candle = {
  x: number;
  bodyTop: number;
  bodyHeight: number;
  wickTop: number;
  wickBottom: number;
  isGreen: boolean;
  animDuration: number;
  animDelay: number;
  drift: number;
  spawnAnim: string;
};

const CANDLE_COUNT = 38;
const WAVE_COUNT = 3;
const CANDLES_PER_WAVE = Math.ceil(CANDLE_COUNT / WAVE_COUNT);
const WAVE_DURATION = 22; // seconds per wave cycle
const SPAWN_INTERVAL = 0.5; // seconds between each candle spawn within a wave

function generateCandles(sentiment: Sentiment): Candle[] {
  const candles: Candle[] = [];
  const gap = 100 / CANDLE_COUNT;

  for (let i = 0; i < CANDLE_COUNT; i++) {
    const progress = i / CANDLE_COUNT;

    let baseY: number;
    if (sentiment === "bullish") {
      baseY = 80 - progress * 50;
    } else if (sentiment === "bearish") {
      baseY = 30 + progress * 50;
    } else {
      const mid = 50;
      const range = 25 * (1 - progress * 0.6);
      baseY = mid + (Math.sin(i * 1.3) * range);
    }

    const noise = (Math.sin(i * 7.3 + 2.1) * 0.5 + 0.5) * 12 - 6;
    baseY += noise;

    const bodyHeight = 3 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 5;
    const wickExtend = 1 + (Math.sin(i * 5.1) * 0.5 + 0.5) * 3;

    let greenChance: number;
    if (sentiment === "bullish") greenChance = 0.65;
    else if (sentiment === "bearish") greenChance = 0.3;
    else greenChance = 0.5;

    const isGreen = (Math.sin(i * 13.7 + 5.3) * 0.5 + 0.5) < greenChance;

    // Wave assignment — which wave does this candle belong to?
    const waveIndex = i % WAVE_COUNT;
    const posInWave = Math.floor(i / WAVE_COUNT);

    // Each wave starts offset by WAVE_DURATION / WAVE_COUNT
    const waveOffset = waveIndex * (WAVE_DURATION / WAVE_COUNT);
    // Within the wave, candles spawn sequentially
    const sequentialDelay = posInWave * SPAWN_INTERVAL;

    // Spawn direction — each wave has a dominant direction, with some randomness
    const waveDominant = waveIndex % SPAWN_DIRECTIONS.length;
    const rand = seededRandom(i * 3.7 + 11.3);
    // 60% chance of dominant direction, 40% random
    const dirIndex = rand < 0.6 ? waveDominant : Math.floor(seededRandom(i * 7.1 + 5.9) * SPAWN_DIRECTIONS.length);
    const spawnAnim = SPAWN_DIRECTIONS[dirIndex];

    candles.push({
      x: i * gap + gap * 0.3,
      bodyTop: baseY,
      bodyHeight,
      wickTop: baseY - wickExtend,
      wickBottom: baseY + bodyHeight + wickExtend,
      isGreen,
      animDuration: WAVE_DURATION + seededRandom(i * 2.3) * 6, // 22-28s
      animDelay: waveOffset + sequentialDelay,
      drift: sentiment === "bullish" ? -3 : sentiment === "bearish" ? 3 : 0,
      spawnAnim,
    });
  }

  return candles;
}

export function CandleBackground({
  sentiment: sentimentProp,
  colorScheme = "trading",
}: {
  sentiment?: Sentiment;
  colorScheme?: ColorScheme;
}) {
  const [sentiment, setSentiment] = useState<Sentiment>(sentimentProp ?? "consolidation");

  useEffect(() => {
    if (sentimentProp) {
      setSentiment(sentimentProp);
      return;
    }
    const stored = localStorage.getItem("stargate-candle-sentiment") as Sentiment | null;
    if (stored && ["bullish", "bearish", "consolidation"].includes(stored)) {
      setSentiment(stored);
    }
  }, [sentimentProp]);

  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    setCandles(generateCandles(sentiment));
  }, [sentiment]);

  const scheme = COLOR_SCHEMES[colorScheme];

  return (
    <div className="absolute inset-0">
      {/* Trend lines */}
      {sentiment === "consolidation" && (
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line
            x1="5%" y1="38%" x2="95%" y2="48%"
            stroke={`rgba(${scheme.up},0.05)`} strokeWidth="1" strokeDasharray="6 4"
          />
          <line
            x1="5%" y1="72%" x2="95%" y2="62%"
            stroke={`rgba(${scheme.down},0.05)`} strokeWidth="1" strokeDasharray="6 4"
          />
        </svg>
      )}
      {sentiment === "bullish" && (
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line
            x1="5%" y1="78%" x2="95%" y2="32%"
            stroke={`rgba(${scheme.up},0.08)`} strokeWidth="1.5" strokeDasharray="8 4"
          />
        </svg>
      )}
      {sentiment === "bearish" && (
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line
            x1="5%" y1="32%" x2="95%" y2="78%"
            stroke={`rgba(${scheme.down},0.08)`} strokeWidth="1.5" strokeDasharray="8 4"
          />
        </svg>
      )}

      {/* Candles — sequential wave spawning */}
      {candles.map((c, i) => (
        <div
          key={i}
          className="absolute candle-stick"
          style={{
            left: `${c.x}%`,
            top: `${c.wickTop}%`,
            height: `${c.wickBottom - c.wickTop}%`,
            width: "2.2%",
            animationDuration: `${c.animDuration}s`,
            animationDelay: `${c.animDelay}s`,
            ["--candle-drift" as string]: `${c.drift}%`,
            ["--candle-anim" as string]: c.spawnAnim,
          }}
        >
          {/* Upper wick */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: 0,
              width: "1px",
              height: `${((c.bodyTop - c.wickTop) / (c.wickBottom - c.wickTop)) * 100}%`,
              background: c.isGreen
                ? `rgba(${scheme.up},${scheme.wickUp})`
                : `rgba(${scheme.down},${scheme.wickDown})`,
            }}
          />
          {/* Body */}
          <div
            className="absolute left-0 right-0 rounded-[1px]"
            style={{
              top: `${((c.bodyTop - c.wickTop) / (c.wickBottom - c.wickTop)) * 100}%`,
              height: `${(c.bodyHeight / (c.wickBottom - c.wickTop)) * 100}%`,
              background: c.isGreen
                ? `rgba(${scheme.up},${scheme.bodyUp})`
                : `rgba(${scheme.down},${scheme.bodyDown})`,
              border: c.isGreen
                ? `1px solid rgba(${scheme.up},${scheme.borderUp})`
                : `1px solid rgba(${scheme.down},${scheme.borderDown})`,
            }}
          />
          {/* Lower wick */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0"
            style={{
              width: "1px",
              height: `${((c.wickBottom - c.bodyTop - c.bodyHeight) / (c.wickBottom - c.wickTop)) * 100}%`,
              background: c.isGreen
                ? `rgba(${scheme.up},${scheme.wickUp})`
                : `rgba(${scheme.down},${scheme.wickDown})`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
