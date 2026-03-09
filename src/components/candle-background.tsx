"use client";

import { useEffect, useState, useRef } from "react";

type Sentiment = "bullish" | "bearish" | "consolidation";

type Candle = {
  x: number;
  bodyTop: number;
  bodyHeight: number;
  wickTop: number;
  wickBottom: number;
  isGreen: boolean;
};

const CANDLE_COUNT = 36;

// Deterministic pseudo-random based on seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function generateCandles(sentiment: Sentiment, seed: number): Candle[] {
  const candles: Candle[] = [];
  const gap = 100 / CANDLE_COUNT;

  for (let i = 0; i < CANDLE_COUNT; i++) {
    const progress = i / CANDLE_COUNT;

    // Base price level driven by sentiment
    let baseY: number;
    if (sentiment === "bullish") {
      // Trend upward: start low (~70%), end high (~25%)
      baseY = 70 - progress * 45;
    } else if (sentiment === "bearish") {
      // Trend downward: start high (~25%), end low (~70%)
      baseY = 25 + progress * 45;
    } else {
      // Consolidation: hover around 50% with gentle sine oscillation
      baseY = 48 + Math.sin(i * 0.6 + seed) * 12;
    }

    // Add natural-looking noise (smaller than trend movement)
    const noise = seededRandom(i * 7.3 + seed * 3.1) * 10 - 5;
    baseY += noise;

    // Clamp to keep candles in visible area
    baseY = Math.max(15, Math.min(80, baseY));

    const bodyHeight = 2 + seededRandom(i * 3.7 + seed) * 4;
    const wickExtend = 1 + seededRandom(i * 5.1 + seed) * 2.5;

    // Green/red probability based on sentiment
    let greenChance: number;
    if (sentiment === "bullish") greenChance = 0.65;
    else if (sentiment === "bearish") greenChance = 0.3;
    else greenChance = 0.5;

    const isGreen = seededRandom(i * 13.7 + seed * 2.3) < greenChance;

    candles.push({
      x: i * gap + gap * 0.3,
      bodyTop: baseY,
      bodyHeight,
      wickTop: baseY - wickExtend,
      wickBottom: baseY + bodyHeight + wickExtend,
      isGreen,
    });
  }

  return candles;
}

export function CandleBackground({
  sentiment: sentimentProp,
}: {
  sentiment?: Sentiment;
}) {
  const [sentiment, setSentiment] = useState<Sentiment>(sentimentProp ?? "consolidation");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [visible, setVisible] = useState(false);
  const seedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Generate and cycle candle charts
  useEffect(() => {
    function showNewChart() {
      seedRef.current += 1;
      setCandles(generateCandles(sentiment, seedRef.current));
      setVisible(true);

      // Hold visible for ~12s, then fade out
      timerRef.current = setTimeout(() => {
        setVisible(false);
        // After fade-out (1.5s), generate next chart
        timerRef.current = setTimeout(showNewChart, 1500);
      }, 12000);
    }

    showNewChart();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sentiment]);

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {candles.map((c, i) => {
          const totalHeight = c.wickBottom - c.wickTop;
          const bodyOffset = ((c.bodyTop - c.wickTop) / totalHeight) * 100;
          const bodyPct = (c.bodyHeight / totalHeight) * 100;
          const lowerWickPct = ((c.wickBottom - c.bodyTop - c.bodyHeight) / totalHeight) * 100;

          // Stagger: each candle fades in 0.08s after the previous
          const staggerDelay = i * 0.08;

          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: `${c.wickTop}%`,
                height: `${totalHeight}%`,
                width: "2%",
                opacity: 0,
                animation: `candle-appear 0.4s ease-out ${staggerDelay}s forwards`,
              }}
            >
              {/* Upper wick */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: 0,
                  width: "1px",
                  height: `${bodyOffset}%`,
                  background: c.isGreen
                    ? "rgba(34,197,94,0.18)"
                    : "rgba(239,68,68,0.15)",
                }}
              />
              {/* Body */}
              <div
                className="absolute left-0 right-0 rounded-sm"
                style={{
                  top: `${bodyOffset}%`,
                  height: `${bodyPct}%`,
                  background: c.isGreen
                    ? "rgba(34,197,94,0.22)"
                    : "rgba(239,68,68,0.18)",
                  boxShadow: c.isGreen
                    ? "0 0 6px rgba(34,197,94,0.08)"
                    : "0 0 6px rgba(239,68,68,0.06)",
                }}
              />
              {/* Lower wick */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-0"
                style={{
                  width: "1px",
                  height: `${lowerWickPct}%`,
                  background: c.isGreen
                    ? "rgba(34,197,94,0.18)"
                    : "rgba(239,68,68,0.15)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
