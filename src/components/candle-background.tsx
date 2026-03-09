"use client";

import { useEffect, useState, useRef } from "react";

type Sentiment = "bullish" | "bearish" | "consolidation";

type Candle = {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
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

  let price = 50; // Start at middle of viewport

  for (let i = 0; i < CANDLE_COUNT; i++) {
    const open = price;

    let greenChance = 0.5;
    if (sentiment === "bullish") greenChance = 0.65;
    else if (sentiment === "bearish") greenChance = 0.3;

    const isGreen = seededRandom(i * 13.7 + seed * 2.3) < greenChance;

    // Body size: random between 1.5-5% of viewport height
    const bodySize = 1.5 + seededRandom(i * 3.7 + seed) * 3.5;

    // Y-axis is inverted: price going UP = lower Y value
    let close = isGreen ? open - bodySize : open + bodySize;

    // Apply sentiment trend drift
    if (sentiment === "bullish") close -= 0.5;
    if (sentiment === "bearish") close += 0.5;

    // Clamp close to keep within visible range
    close = Math.max(15, Math.min(85, close));

    // Wicks extend beyond body
    const high = Math.min(open, close) - (0.5 + seededRandom(i * 5.1 + seed) * 2);
    const low = Math.max(open, close) + (0.5 + seededRandom(i * 7.3 + seed) * 2);

    // Provide exact continuity to next candle
    price = close;

    candles.push({
      x: i * gap + gap * 0.15,
      open,
      close,
      high,
      low,
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

      // Total draw ~21.6s + Hold chart 10s = 31.6s visible time
      timerRef.current = setTimeout(() => {
        setVisible(false);
        // After fade-out (2s) + pause (1s) = 3s to next chart
        timerRef.current = setTimeout(showNewChart, 3000);
      }, 31600);
    }

    showNewChart();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sentiment]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {candles.map((c, i) => {
          const bodyTop = Math.min(c.open, c.close);
          const bodyHeight = Math.abs(c.open - c.close);
          const topWickHeight = bodyTop - c.high;
          const bottomWickHeight = c.low - Math.max(c.open, c.close);

          // Stagger delays per candle
          const staggerDelay = i * 0.6;
          const wickDelay = staggerDelay + 0.3;

          const colorVar = c.isGreen ? "var(--win)" : "var(--loss)";
          const glowVar = c.isGreen ? "var(--win-glow)" : "var(--loss-glow)";

          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: "0",
                height: "100%",
                width: "2%",
              }}
            >
              {/* Thin open line at exact `open` Y coordinate */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: `${c.open}%`,
                  height: "1px",
                  background: colorVar,
                  opacity: 0,
                  animation: `candle-open-line 0.1s ease-out ${staggerDelay}s forwards`,
                }}
              />

              {/* Body */}
              <div
                className="absolute left-0 right-0 rounded-sm"
                style={{
                  top: `${bodyTop}%`,
                  height: `${bodyHeight}%`,
                  background: colorVar,
                  boxShadow: `0 0 8px ${glowVar}`,
                  opacity: 0,
                  transformOrigin: c.isGreen ? "bottom" : "top",
                  animation: `candle-body-grow 0.7s ease-out ${staggerDelay}s forwards`,
                }}
              />

              {/* Upper wick (extends up from top of body) */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: `${c.high}%`,
                  height: `${topWickHeight}%`,
                  width: "1px",
                  background: colorVar,
                  opacity: 0,
                  transformOrigin: "bottom",
                  animation: `candle-wick-grow 0.5s ease-out ${wickDelay}s forwards`,
                }}
              />

              {/* Lower wick (extends down from bottom of body) */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: `${Math.max(c.open, c.close)}%`,
                  height: `${bottomWickHeight}%`,
                  width: "1px",
                  background: colorVar,
                  opacity: 0,
                  transformOrigin: "top",
                  animation: `candle-wick-grow 0.5s ease-out ${wickDelay}s forwards`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
