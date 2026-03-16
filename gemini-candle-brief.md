# Gemini Design Brief: Candle Background Animation Rewrite

## Your Role

You are redesigning the animated candlestick background for a crypto trading journal app. This is a **decorative background element** — subtle, low-opacity candles that create ambient atmosphere behind the dashboard UI.

## Problems with Current Implementation

1. **Too fast**: 36 candles appear in ~3 seconds (80ms stagger). Feels rushed, not meditative.
2. **Candles aren't connected**: Each candle's vertical position is independently generated. In a real candlestick chart, the **close price of candle N = the open price of candle N+1**. Currently there's no price continuity — candles look scattered.
3. **Abrupt lifecycle**: All candles fade out simultaneously, then a completely new set pops in. There's no sense of "watching a chart being drawn."

## Desired Behavior

### Connected OHLC Data
Generate synthetic price data where each candle has Open, High, Low, Close values and:
- `close[i]` becomes `open[i+1]` (exact continuity)
- Green candle: close > open (body fills upward)
- Red candle: close < open (body fills downward)
- Wicks extend above (to high) and below (to low) the body

### Sequential Drawing Animation
Each candle should animate as if being "drawn" in real-time:
1. A thin horizontal line appears at the **open price** level
2. The **body grows** vertically from open toward close (~0.6-1.0s)
3. The **wicks extend** to high and low (during or slightly after body growth)
4. The candle "settles" — it's now complete
5. The **next candle begins** drawing from its open (= previous close)

### Full Lifecycle
1. **Draw phase**: Candles appear one-by-one, left to right (~15-25s total)
2. **Hold phase**: Complete chart stays visible (~8-12s)
3. **Fade-out phase**: Entire chart fades out together (~2s)
4. **Reset**: New seed, new candle data, cycle restarts from step 1

### Sentiment Modes
Three modes that affect the trend direction:
- **Bullish**: Price trends upward overall (more green candles, ~65%)
- **Bearish**: Price trends downward overall (more red candles, ~70%)
- **Consolidation**: Price oscillates sideways (50/50 green/red)

## Current Code

### `candle-background.tsx` (full file — replace entirely)
```tsx
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
```

### CSS keyframe in `globals.css`
```css
@keyframes candle-appear {
  0% { opacity: 0; transform: scaleY(0.6); }
  100% { opacity: 1; transform: scaleY(1); }
}
```

## Technical Constraints

1. **React client component** — must start with `"use client"`
2. **Same API**: `export function CandleBackground({ sentiment?: Sentiment }: { sentiment?: Sentiment })`
3. **Sentiment type**: `type Sentiment = "bullish" | "bearish" | "consolidation"`
4. **Keep seeded randomness** — deterministic pseudo-random using `seededRandom()` so same seed = same pattern
5. **CSS animations only** — no framer-motion or other animation libraries. Use CSS `@keyframes`, `transition`, and `animation` properties
6. **Use CSS variables for colors** — NOT hardcoded RGBA. Use `var(--win)` for green candles, `var(--loss)` for red candles. Apply opacity via the alpha channel or `opacity` property. The app has these CSS variables available:
   - `--win` (green color, e.g. `#34d399` on dark, `#059669` on light)
   - `--loss` (red color, e.g. `#fb7185` on dark, `#dc2626` on light)
   - `--win-glow` (green glow with alpha)
   - `--loss-glow` (red glow with alpha)
7. **Keep localStorage sentiment persistence**: read from `localStorage.getItem("stargate-candle-sentiment")`
8. **Low opacity / decorative** — this is a background element. Candle bodies should be ~0.15-0.25 opacity, wicks ~0.12-0.18. Glow/shadows very subtle
9. **Cleanup timers on unmount** — use `useRef` for timers, clear in cleanup function
10. **Reduce candle count** — use 20-24 candles instead of 36 for more deliberate pacing

## Design Direction

### OHLC Generation Algorithm
```
price = startPrice (e.g. 50 for middle of viewport)

for each candle:
  open = price  (= previous close, or startPrice for first candle)

  // Determine direction based on sentiment + randomness
  isGreen = random < greenChance  (0.65 bullish, 0.30 bearish, 0.50 consolidation)

  // Body size: random between 1.5-5% of viewport height
  bodySize = 1.5 + random * 3.5

  if isGreen:
    close = open - bodySize  (price goes UP = lower Y value)
  else:
    close = open + bodySize  (price goes DOWN = higher Y value)

  // Wicks extend beyond body
  high = min(open, close) - (0.5 + random * 2)  // above body
  low = max(open, close) + (0.5 + random * 2)   // below body

  // Apply sentiment trend bias
  if bullish: add slight upward drift (-0.5 per candle)
  if bearish: add slight downward drift (+0.5 per candle)

  price = close  // next candle opens here

  // Clamp to keep in visible range (15%-85%)
```

### Animation Sequence (Per Candle)
1. **t=0**: Thin line appears at open price Y position (opacity 0 → 0.2, width = full candle width, height = 1px)
2. **t=0 to t=0.7s**: Body grows from open toward close. Use CSS `transform: scaleY()` with `transform-origin` at the open edge
3. **t=0.3s to t=0.8s**: Wicks extend simultaneously (slight overlap with body growth)
4. **t=0.8s**: Candle complete. Next candle begins at t=0.9s (0.1s gap)

### Timing Summary
- Per candle: ~0.8s draw + ~0.1s gap = ~0.9s per candle
- 24 candles: ~21.6s total draw time
- Hold complete chart: ~10s
- Fade out: ~2s
- Brief pause: ~1s
- **Total cycle: ~35s**

## Output Format

Please provide your output in exactly these two sections:

### Section 1: `candle-background.tsx` (complete file replacement)
```tsx
// Your complete component code here
```

### Section 2: CSS keyframes for `globals.css`
```css
/* Replace the existing candle-appear keyframe and add any new ones */
```

Do NOT include any Google Drive/Cloud upload instructions. Provide the code inline.
