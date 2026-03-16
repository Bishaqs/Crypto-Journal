# Satoshi Theme Background — Implementation Spec for Gemini

## Overview

Create a React component `SatoshiBackground` for the Stargate Journal app. This is the **level 500 prestige theme** — the rarest and most visually stunning background in the entire app. It must surpass all other theme backgrounds in animation quality and visual depth.

**File to create:** `src/components/satoshi-background.tsx`

## Technical Requirements

- **React** — `"use client"` component, TypeScript
- **Canvas API** — All animations on a single `<canvas>` element (plus static CSS gradient divs for base/vignette)
- **30fps cap** — Use `requestAnimationFrame` with frame throttling (`1000/30 = ~33ms` between draws)
- **Visibility pause** — Stop animation loop when `document.hidden` is true (save battery on tab switch). Resume on visibility change.
- **Reduced motion** — Accept `reducedMotion: boolean` prop. When true, render only static layers (gradients, static BTC logo) with zero animation.
- **Mobile performance** — Detect `window.innerWidth < 768` and reduce particle count to 60% of desktop values.
- **Cleanup** — Cancel `requestAnimationFrame` and remove event listeners in useEffect cleanup.
- **No external dependencies** — Pure React + Canvas. No GSAP, no Three.js, no libraries.

## Component Interface

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";

interface SatoshiBackgroundProps {
  reducedMotion: boolean;
}

export function SatoshiBackground({ reducedMotion }: SatoshiBackgroundProps) {
  // ... implementation
}
```

## Visual Layers (back to front)

### Layer 1: Base Gradient (CSS divs, static)

Two overlapping `<div>` elements behind the canvas:

```tsx
{/* Warm dark base */}
<div className="absolute inset-0" style={{
  background: "linear-gradient(180deg, #0a0806 0%, #0d0a05 50%, #0a0806 100%)"
}} />

{/* Central gold underglow from bottom */}
<div className="absolute inset-0" style={{
  background: "radial-gradient(ellipse at 50% 85%, rgba(247,147,26,0.08) 0%, rgba(191,120,10,0.04) 35%, transparent 65%)"
}} />
```

### Layer 2: Central BTC Logo (Canvas)

A large Bitcoin (₿) symbol centered on screen. This is the hero element.

**Specs:**
- Size: 35-40% of the smaller viewport dimension (`Math.min(width, height) * 0.38`)
- Position: Centered horizontally, vertically centered (slightly above center, at ~45% of height)
- Color: Gold `rgba(247, 147, 26, opacity)` with a subtle warm glow
- Opacity: Breathing animation between 0.03 and 0.07 (very subtle — it should feel like a watermark that's alive)
- Scale: Breathing between 0.97 and 1.03 (8 second cycle, sine wave)
- Draw method: **Canvas Path2D** — use the SVG path data below

**BTC Logo SVG Path (for Path2D):**
```javascript
// Bitcoin "B" symbol — centered on origin, scale to desired size
// This draws the classic ₿ symbol (uppercase B with two vertical strikes)
function createBTCPath(size) {
  const s = size / 32; // normalize to 32-unit grid
  const path = new Path2D();

  // Outer circle
  path.arc(16 * s, 16 * s, 15 * s, 0, Math.PI * 2);

  // Now the ₿ letter (drawn as subpath)
  // Use moveTo to start the B shape
  // Top vertical strike
  path.moveTo(14 * s, 5 * s);
  path.lineTo(14 * s, 8 * s);
  // Bottom vertical strike
  path.moveTo(14 * s, 24 * s);
  path.lineTo(14 * s, 27 * s);
  // Second top strike
  path.moveTo(18 * s, 5 * s);
  path.lineTo(18 * s, 8 * s);
  // Second bottom strike
  path.moveTo(18 * s, 24 * s);
  path.lineTo(18 * s, 27 * s);

  // B shape body
  path.moveTo(11 * s, 8 * s);
  path.lineTo(19 * s, 8 * s);
  path.bezierCurveTo(23 * s, 8 * s, 23 * s, 15.5 * s, 19 * s, 15.5 * s);
  path.lineTo(11 * s, 15.5 * s);
  path.closePath();

  path.moveTo(11 * s, 15.5 * s);
  path.lineTo(20 * s, 15.5 * s);
  path.bezierCurveTo(24.5 * s, 15.5 * s, 24.5 * s, 24 * s, 20 * s, 24 * s);
  path.lineTo(11 * s, 24 * s);
  path.closePath();

  return path;
}
```

> **NOTE to Gemini:** The path above is a starting sketch. Please refine it to produce a clean, recognizable Bitcoin ₿ logo. The key elements are: circle, B shape with serifs, two vertical lines extending above and below. Feel free to use a better path if you find one — the important thing is it must be drawn via `Path2D` on canvas (no images, no SVG elements).

**Rendering:**
```javascript
// Per frame:
const breathT = (Math.sin(time * 0.000785) + 1) / 2; // ~8s full cycle
const logoOpacity = 0.03 + breathT * 0.04; // 0.03 to 0.07
const logoScale = 0.97 + breathT * 0.06; // 0.97 to 1.03

ctx.save();
ctx.translate(centerX, centerY);
ctx.scale(logoScale, logoScale);
ctx.translate(-centerX, -centerY);

// Glow layer (drawn first, larger shadow)
ctx.shadowColor = "rgba(247, 147, 26, 0.3)";
ctx.shadowBlur = 40;
ctx.fillStyle = `rgba(247, 147, 26, ${logoOpacity * 0.5})`;
ctx.fill(btcPath);

// Main logo
ctx.shadowBlur = 0;
ctx.fillStyle = `rgba(247, 147, 26, ${logoOpacity})`;
ctx.fill(btcPath);
ctx.restore();
```

### Layer 3: Gold Particle System (Canvas)

Three particle classes on the same canvas:

#### 3a. Gold Dust (80 particles, 48 on mobile)
- Size: 0.6 - 2.5px radius
- Color: `hsla(35-50, 85%, 55-65%, opacity)` — gold spectrum
- Movement: Slow rise (vy: -0.05 to -0.25 px/frame), slight horizontal sway (sinusoidal, `vx = sin(time * freq) * amplitude`)
- Opacity lifecycle: fade in (0→max over 10% of life), sustain, fade out (max→0 over last 15% of life)
- Max opacity: 0.2 - 0.6
- Respawn: bottom of screen when life expires

#### 3b. Embers (25 particles, 15 on mobile)
- Size: 1.5 - 3.5px radius
- Color: Warmer gold `hsla(25-40, 90%, 60%, opacity)` — more orange
- Movement: Faster rise (vy: -0.15 to -0.4), slight drift
- **Trail:** Each ember draws 3-4 previous positions with decreasing opacity and size (store last 4 positions in array)
- Opacity: 0.15 - 0.45
- Glow: `ctx.shadowBlur = 8; ctx.shadowColor = "rgba(247,147,26,0.3)"`

#### 3c. Star Sparkles (8 particles, 5 on mobile)
- Size: 1 - 2px radius
- Color: Bright white-gold `hsla(45, 50%, 90%, opacity)`
- Movement: Very slow drift (barely moving)
- **Twinkle:** Opacity oscillates with a different frequency per sparkle (`sin(time * sparkleFreq)`)
- Effect: Draw as a small cross/plus shape (two perpendicular 6px lines) rather than a circle, for a star-like appearance

### Layer 4: Constellation Lines (Canvas)

Connect nearby gold dust particles with faint lines.

**Algorithm** (spatial grid for O(n*k) performance):
```javascript
const CELL_SIZE = 120; // px
const MAX_DIST = 110; // px connection distance

// Build grid
const cols = Math.ceil(width / CELL_SIZE);
const grid = new Array(cols * rows);

// For each particle, check 3x3 neighborhood
// Draw line if distance < MAX_DIST
```

**Line style:**
- Color: `rgba(247, 147, 26, 0.03 * proximity * minOpacity)` — very subtle
- Width: 0.4px

**Neural fire effect (optional enhancement):**
- Every 15-25 seconds, pick a random particle and "fire" a pulse along its connected lines
- The pulse is a brief brightening of lines (opacity * 3) that cascades to connected neighbors over ~0.5 seconds
- Creates a "synaptic firing" visual — like the Bitcoin network transmitting

### Layer 5: Mini BTC Logos (Canvas)

5 tiny floating Bitcoin symbols (3 on mobile).

**Specs:**
- Size: 12-20px each (much smaller than the central logo)
- Opacity: 0.02 - 0.05 (extremely ghostly)
- Position: Randomly distributed, avoiding the center 30% of viewport
- Movement: Glacial drift (0.02 px/frame in a random direction), change direction every 30-60 seconds
- Rotation: Very slow spin (full rotation over 60-120 seconds)
- Use the same `Path2D` BTC symbol, scaled down

### Layer 6: Golden Vignette (CSS div, static)

```tsx
<div className="absolute inset-0 pointer-events-none" style={{
  background: "radial-gradient(ellipse at center, transparent 40%, rgba(10, 8, 6, 0.4) 100%)"
}} />
```

### Layer 7: Halving Pulse Event (Canvas)

A rare, dramatic event that triggers every **90-120 seconds** (random interval). This is what makes the Satoshi theme memorable — a visual nod to Bitcoin's halving events.

**Sequence (total duration: ~3 seconds):**
1. **Flash** (0 - 0.3s): Screen briefly brightens — draw a full-canvas rectangle with opacity rising from 0 to 0.06 then back to 0 (warm gold `rgba(247, 147, 26, ...)`)
2. **Ring expansion** (0 - 2s): An expanding ring emanates from the center BTC logo
   - Start: radius = logo size, line width 3px, opacity 0.25
   - End: radius = viewport diagonal, line width 1px, opacity 0
   - Color: `rgba(247, 147, 26, ...)`
   - Use `ctx.arc` with `ctx.stroke` (not fill)
3. **Ember burst** (0.2 - 2.5s): Spawn 20 extra ember particles from the center, radiating outward in all directions
   - These extra particles have a short lifespan (~2 seconds) and higher initial velocity
   - They gradually slow down (friction 0.98 per frame) and fade out
4. **Logo flash** (0 - 0.5s): The central BTC logo briefly increases opacity to 0.15 and scale to 1.08, then eases back to normal

**State management:**
```javascript
const halvingRef = useRef({
  active: false,
  startTime: 0,
  nextTrigger: randomBetween(90000, 120000), // ms
  burstParticles: [] as BurstParticle[],
});
```

## Complete Component Structure

```tsx
export function SatoshiBackground({ reducedMotion }: SatoshiBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<DustParticle[]>([]);
  const embersRef = useRef<EmberParticle[]>([]);
  const sparklesRef = useRef<SparkleParticle[]>([]);
  const miniLogosRef = useRef<MiniLogo[]>([]);
  const halvingRef = useRef<HalvingState>({ ... });
  const btcPathRef = useRef<Path2D | null>(null);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const startTimeRef = useRef(0);

  // Initialize particles
  const initParticles = useCallback((w: number, h: number) => {
    const isMobile = window.innerWidth < 768;
    // ... create all particle arrays
  }, []);

  // Create BTC Path2D on mount
  useEffect(() => {
    btcPathRef.current = createBTCPath(/* ... */);
  }, []);

  // Main animation loop
  useEffect(() => {
    if (reducedMotion) return; // Skip animation setup entirely

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { /* ... */ };
    resize();
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) rafRef.current = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);

    let lastFrame = 0;
    const TARGET_INTERVAL = 1000 / 30;

    const draw = (now: number) => {
      if (pausedRef.current) return;
      rafRef.current = requestAnimationFrame(draw);
      if (now - lastFrame < TARGET_INTERVAL) return;
      lastFrame = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw central BTC logo (breathing)
      // 2. Draw constellation lines (spatial grid)
      // 3. Draw gold dust particles (update + render)
      // 4. Draw ember particles with trails
      // 5. Draw star sparkles (twinkle)
      // 6. Draw mini BTC logos (drift + rotate)
      // 7. Check & render halving pulse event
    };

    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, initParticles]);

  return (
    <div className="absolute inset-0">
      {/* Layer 1: Base gradient */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, #0a0806 0%, #0d0a05 50%, #0a0806 100%)"
      }} />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 85%, rgba(247,147,26,0.08) 0%, rgba(191,120,10,0.04) 35%, transparent 65%)"
      }} />

      {/* Layer 2-5,7: Canvas (all animated layers) */}
      {!reducedMotion && <canvas ref={canvasRef} className="absolute inset-0" />}

      {/* Reduced motion fallback: static BTC logo */}
      {reducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 32 32" className="w-[35vmin] h-[35vmin] opacity-[0.04]" fill="rgba(247,147,26,1)">
            {/* Static SVG BTC logo fallback */}
          </svg>
        </div>
      )}

      {/* Layer 6: Golden vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(10, 8, 6, 0.4) 100%)"
      }} />
    </div>
  );
}
```

## Color Palette Reference

| Element | Color | Opacity Range |
|---------|-------|---------------|
| Gold dust | `hsla(35-50, 85%, 55-65%)` | 0.2 - 0.6 |
| Embers | `hsla(25-40, 90%, 60%)` | 0.15 - 0.45 |
| Sparkles | `hsla(45, 50%, 90%)` | 0.3 - 0.8 (oscillating) |
| Central BTC logo | `rgba(247, 147, 26)` | 0.03 - 0.07 |
| Mini BTC logos | `rgba(247, 147, 26)` | 0.02 - 0.05 |
| Constellation lines | `rgba(247, 147, 26)` | 0.01 - 0.04 |
| Halving ring | `rgba(247, 147, 26)` | 0 - 0.25 |
| Halving flash | `rgba(247, 147, 26)` | 0 - 0.06 |

## Existing Code Reference (current SatoshiGoldBackground pattern)

This is the current implementation that this replaces. Match the same patterns (canvas ref, visibility handling, frame throttling, cleanup):

```tsx
function SatoshiGoldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<GoldParticle[]>([]);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);

  const initParticles = useCallback((w: number, h: number) => {
    const count = window.innerWidth < 768 ? 50 : 100;
    particlesRef.current = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: -(0.08 + Math.random() * 0.22),
      vx: (Math.random() - 0.5) * 0.12,
      size: 0.8 + Math.random() * 2.2,
      opacity: 0,
      maxOpacity: 0.3 + Math.random() * 0.5,
      hue: 35 + Math.random() * 15,
      life: Math.random(),
      lifeSpeed: 0.001 + Math.random() * 0.002,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) rafRef.current = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);

    let lastFrame = 0;
    const TARGET_INTERVAL = 1000 / 30;

    const draw = (now: number) => {
      if (pausedRef.current) return;
      rafRef.current = requestAnimationFrame(draw);
      if (now - lastFrame < TARGET_INTERVAL) return;
      lastFrame = now;
      // ... particle update + render
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initParticles]);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, #0a0806 0%, #0d0a05 50%, #0a0806 100%)"
      }} />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 85%, rgba(247,147,26,0.06) 0%, rgba(191,120,10,0.03) 35%, transparent 65%)"
      }} />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
```

## Quality Bar

This is the **mythic-tier, level 500** theme. The user has described it as "the most beautiful, most animated, and most clean theme a man has ever seen." Key qualities:

1. **Layered depth** — 7 distinct visual layers create parallax-like depth
2. **Subtlety** — Nothing should be garish or distracting. The BTC logo is barely visible. Particles drift gently. The overall feel is "luxurious calm."
3. **Surprise** — The halving pulse is the star. Users discover it organically. It should feel magical, not jarring.
4. **Polish** — Smooth easing on all animations. No jank. No hard cuts. Everything breathes.
5. **Performance** — 30fps capped, pauses when hidden, reduced particle count on mobile. This should never cause dropped frames.

## Deliverable

Please provide the complete `satoshi-background.tsx` file with all 7 layers implemented. The file should be production-ready — no TODO comments, no placeholders, no `// ...`. Every line of code should be real and working.
