# Triton Theme Upgrade: Bioluminescent Deep Ocean Abyss

> **For Gemini**: Read this entire document. Then write the complete code and paste it directly into your response (two code blocks). Do NOT upload to Google Drive or any cloud service.

---

## 1. What You're Building

You are upgrading the **Triton** underwater theme for **Stargate Journal**, a crypto trading journal built with Next.js 16 + React 19 + TypeScript 5 + GSAP 3.14. The current implementation uses basic CSS-only animations. You are replacing it with a **Canvas + GSAP cinematic experience** — the most beautiful, most clean, and most animated underwater theme ever built.

Think: **deep ocean abyss**, bioluminescent creatures pulsing in the dark, hydrothermal vents bubbling, volumetric god rays filtering from the surface, a rare angler fish drifting through the void. This is not a cartoon ocean — it's the Mariana Trench at midnight.

---

## 2. Architecture (How Themes Work)

- Themes are CSS classes on `<html>` (e.g., `<html class="triton">`)
- CSS custom properties (`--background`, `--accent`, etc.) define the color palette
- Background animations render via a React function component called `OceanBackground()`
- `OceanBackground()` is conditionally rendered inside `<Starfield />` when `theme === "triton"`:

```tsx
// In Starfield component (starfield.tsx)
if (theme === "triton") {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <OceanBackground />
    </div>
  );
}
```

- `<Starfield />` is lazy-loaded via Next.js `dynamic()` in dashboard layout
- The component file is a `"use client"` component

### Available Imports (already in the file)

```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
```

`useReducedMotion()` returns a `boolean` — `true` when the user has enabled reduced motion (either OS-level or in-app toggle). Heavy animations must be disabled when this is `true`.

---

## 3. Triton Color Palette (DO NOT CHANGE)

These CSS custom properties are defined elsewhere and must NOT be redefined in your output. Use these color values in your Canvas rendering and SVG fills:

```
Background:    #020817          (deep navy-black)
Surface:       rgba(4, 14, 30, 0.85)
Accent:        #0ea5e9          (ocean blue)
Accent hover:  #38bdf8          (lighter blue)
Foreground:    #d0e8f0          (ice blue text)
Muted:         #4a7a9a          (subdued blue)
Win:           #7dd3fc          (sky blue)
Loss:          #ef4444          (red)
Accent RGB:    14, 165, 233
```

### Bioluminescent Color Palette (for particles, jellyfish, creatures)

```
Cyan:      rgba(100, 220, 255, ...)   shadow: rgba(14, 165, 233, ...)
Purple:    rgba(200, 120, 255, ...)   shadow: rgba(168, 85, 247, ...)
Pink:      rgba(255, 130, 200, ...)   shadow: rgba(236, 72, 153, ...)
Teal:      rgba(100, 255, 218, ...)   shadow: rgba(45, 212, 191, ...)
Amber:     rgba(255, 200, 100, ...)   shadow: rgba(251, 191, 36, ...)
Ice blue:  rgba(180, 240, 255, ...)   shadow: rgba(125, 211, 252, ...)
```

---

## 4. Current Implementation (What You're Replacing)

### Constants (lines 976-978 of starfield.tsx)

```tsx
const BIO_DOT_COUNT = 30;
const JELLYFISH_COUNT = 3;
const SMALL_FISH_COUNT = 4;
```

### Current OceanBackground() Component (lines 980-1189 of starfield.tsx)

```tsx
function OceanBackground() {
  type Fish = { top: number; size: number; duration: number; delay: number; goingRight: boolean; body: string; glow: string };
  type BioDot = { left: number; top: number; duration: number; delay: number; size: number; bg: string; shadow: string };
  type Jelly = { left: number; top: number; size: number; duration: number; pulseDuration: number; delay: number; bg: string; border: string };

  const [smallFish, setSmallFish] = useState<Fish[]>([]);
  const [bioDots, setBioDots] = useState<BioDot[]>([]);
  const [jellyfish, setJellyfish] = useState<Jelly[]>([]);

  useEffect(() => {
    const fishColorVariants = [
      { body: "rgba(100, 220, 255, 0.6)", glow: "rgba(14, 165, 233, 0.3)" },
      { body: "rgba(100, 255, 218, 0.55)", glow: "rgba(45, 212, 191, 0.3)" },
      { body: "rgba(255, 180, 220, 0.5)", glow: "rgba(236, 72, 153, 0.25)" },
      { body: "rgba(180, 240, 255, 0.5)", glow: "rgba(125, 211, 252, 0.25)" },
      { body: "rgba(200, 160, 255, 0.5)", glow: "rgba(168, 85, 247, 0.25)" },
    ];
    setSmallFish(
      Array.from({ length: SMALL_FISH_COUNT }).map((_, i) => {
        const color = fishColorVariants[i % fishColorVariants.length];
        return {
          top: 15 + Math.random() * 70,
          size: 8 + Math.random() * 10,
          duration: 22 + Math.random() * 18,
          delay: -(Math.random() * 40),
          goingRight: i % 2 === 0,
          ...color,
        };
      })
    );

    const bioColorVariants = [
      { bg: "rgba(100, 220, 255, 0.85)", shadow: "rgba(14, 165, 233, 0.45)" },
      { bg: "rgba(200, 120, 255, 0.75)", shadow: "rgba(168, 85, 247, 0.45)" },
      { bg: "rgba(255, 130, 200, 0.75)", shadow: "rgba(236, 72, 153, 0.45)" },
      { bg: "rgba(180, 240, 255, 0.65)", shadow: "rgba(125, 211, 252, 0.4)" },
      { bg: "rgba(100, 255, 218, 0.65)", shadow: "rgba(45, 212, 191, 0.4)" },
      { bg: "rgba(255, 200, 100, 0.75)", shadow: "rgba(251, 191, 36, 0.45)" },
      { bg: "rgba(250, 160, 80, 0.65)", shadow: "rgba(245, 158, 11, 0.4)" },
    ];
    setBioDots(
      Array.from({ length: BIO_DOT_COUNT }).map(() => {
        const color = bioColorVariants[Math.floor(Math.random() * bioColorVariants.length)];
        return {
          left: 3 + Math.random() * 94,
          top: 15 + Math.random() * 80,
          duration: 6 + Math.random() * 12,
          delay: Math.random() * -15,
          size: 2 + Math.random() * 4,
          ...color,
        };
      })
    );

    const jellyColors = [
      { bg: "rgba(200, 120, 255, 0.3)", border: "rgba(200, 120, 255, 0.4)" },
      { bg: "rgba(100, 220, 255, 0.28)", border: "rgba(100, 220, 255, 0.38)" },
      { bg: "rgba(255, 130, 200, 0.28)", border: "rgba(255, 130, 200, 0.38)" },
      { bg: "rgba(100, 255, 218, 0.25)", border: "rgba(100, 255, 218, 0.35)" },
      { bg: "rgba(255, 200, 100, 0.25)", border: "rgba(255, 200, 100, 0.35)" },
      { bg: "rgba(180, 240, 255, 0.28)", border: "rgba(180, 240, 255, 0.38)" },
    ];
    setJellyfish(
      Array.from({ length: JELLYFISH_COUNT }).map(() => {
        const color = jellyColors[Math.floor(Math.random() * jellyColors.length)];
        return {
          left: 10 + Math.random() * 80,
          top: 20 + Math.random() * 60,
          size: 30 + Math.random() * 50,
          duration: 18 + Math.random() * 15,
          pulseDuration: 4 + Math.random() * 4,
          delay: Math.random() * -20,
          ...color,
        };
      })
    );
  }, []);

  return (
    <>
      {/* Deep abyss gradient */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, #051020 0%, #030a18 40%, #020817 100%)",
      }} />

      {/* Caustic light ripple overlay near top */}
      <div className="triton-caustics" />

      {/* Light rays from above — god rays */}
      {[
        { left: "15%", angle: 12, width: 130, opacity: 0.14, dur: 10, delay: 0 },
        { left: "35%", angle: 5, width: 170, opacity: 0.11, dur: 12, delay: -3 },
        { left: "55%", angle: -6, width: 120, opacity: 0.13, dur: 11, delay: -6 },
        { left: "72%", angle: 18, width: 90, opacity: 0.10, dur: 14, delay: -9 },
        { left: "25%", angle: -10, width: 100, opacity: 0.09, dur: 16, delay: -5 },
        { left: "80%", angle: 8, width: 80, opacity: 0.08, dur: 13, delay: -11 },
      ].map((ray, i) => (
        <div
          key={i}
          className="triton-ray"
          style={{
            left: ray.left,
            width: `${ray.width}px`,
            height: "110%",
            background: `linear-gradient(180deg, rgba(125,211,252,${ray.opacity}) 0%, rgba(14,165,233,${ray.opacity * 0.3}) 40%, transparent 80%)`,
            "--ray-angle": `${ray.angle}deg`,
            "--ray-duration": `${ray.dur}s`,
            "--ray-delay": `${ray.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Jellyfish — large glowing blobs */}
      {jellyfish.map((j, i) => (
        <div
          key={i}
          className="jellyfish"
          style={{
            left: `${j.left}%`,
            top: `${j.top}%`,
            width: `${j.size}px`,
            height: `${j.size * 0.7}px`,
            background: `radial-gradient(ellipse, ${j.bg} 30%, transparent 70%)`,
            boxShadow: `0 0 ${j.size}px ${j.size / 3}px ${j.border}`,
            "--jelly-duration": `${j.duration}s`,
            "--jelly-pulse": `${j.pulseDuration}s`,
            "--jelly-delay": `${j.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Small swimming fish */}
      {smallFish.map((fish, i) => (
        <div
          key={`fish-${i}`}
          className={fish.goingRight ? "triton-fish-right" : "triton-fish-left"}
          style={{
            top: `${fish.top}%`,
            "--fish-duration": `${fish.duration}s`,
            "--fish-delay": `${fish.delay}s`,
            "--fish-size": `${fish.size}px`,
          } as React.CSSProperties}
        >
          <svg
            width={fish.size * 2.2}
            height={fish.size}
            viewBox="0 0 22 10"
            style={{ filter: `drop-shadow(0 0 ${fish.size * 0.5}px ${fish.glow})` }}
          >
            <ellipse cx="10" cy="5" rx="8" ry="4" fill={fish.body} />
            <polygon
              points={fish.goingRight ? "2,5 0,1 0,9" : "20,5 22,1 22,9"}
              fill={fish.body}
            />
            <circle
              cx={fish.goingRight ? "15" : "7"}
              cy="4"
              r="1"
              fill="rgba(255,255,255,0.8)"
            />
          </svg>
        </div>
      ))}

      {/* Rare large fish (whale silhouette) */}
      <div className="triton-big-fish">
        <svg width="120" height="40" viewBox="0 0 120 40" style={{ filter: "drop-shadow(0 0 8px rgba(14,165,233,0.15))" }}>
          <path
            d="M5,20 Q10,8 30,6 Q50,4 70,8 Q85,12 95,15 Q100,17 105,14 Q110,10 115,8 L118,12 L115,16 Q110,20 105,22 Q100,23 95,25 Q85,28 70,32 Q50,36 30,34 Q10,32 5,20 Z"
            fill="rgba(8,25,50,0.7)"
            stroke="rgba(14,165,233,0.15)"
            strokeWidth="0.5"
          />
          <circle cx="25" cy="18" r="2" fill="rgba(125,211,252,0.4)" />
          <path d="M25,22 Q50,30 90,24" fill="none" stroke="rgba(14,165,233,0.08)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Bioluminescent particles */}
      {bioDots.map((dot, i) => (
        <div
          key={i}
          className="bio-dot"
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            background: dot.bg,
            boxShadow: `0 0 ${dot.size * 3}px ${dot.size}px ${dot.shadow}`,
            filter: "blur(0.5px)",
            "--bio-duration": `${dot.duration}s`,
            "--bio-delay": `${dot.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Deep ocean gradient at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/3" style={{
        background: "linear-gradient(to top, rgba(2,8,23,0.8), transparent)",
      }} />
    </>
  );
}
```

### Current Triton CSS (lines 1026-1261 of globals.css)

```css
/* ===== TRITON — Deep Sea ===== */

/* Bioluminescent particles — multi-color */
@keyframes bioluminescence {
  0%, 100% {
    opacity: 0.1;
    transform: translateY(0) translateX(0) scale(1);
  }
  25% {
    opacity: 0.7;
    transform: translateY(-25px) translateX(10px) scale(1.2);
  }
  50% {
    opacity: 0.3;
    transform: translateY(-40px) translateX(-8px) scale(0.9);
  }
  75% {
    opacity: 0.6;
    transform: translateY(-15px) translateX(15px) scale(1.1);
  }
}

.bio-dot {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: bioluminescence var(--bio-duration, 10s) ease-in-out infinite;
  animation-delay: var(--bio-delay, 0s);
}

/* Light rays from above — underwater god rays */
@keyframes ocean-ray-sway {
  0%, 100% {
    transform: rotate(var(--ray-angle, 15deg)) scaleX(1);
    opacity: 0.3;
  }
  50% {
    transform: rotate(calc(var(--ray-angle, 15deg) + 3deg)) scaleX(1.1);
    opacity: 0.6;
  }
}

.triton-ray {
  position: absolute;
  top: -10%;
  pointer-events: none;
  animation: ocean-ray-sway var(--ray-duration, 10s) ease-in-out infinite;
  animation-delay: var(--ray-delay, 0s);
  transform-origin: top center;
}

/* Jellyfish floating */
@keyframes jellyfish-drift {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(15px, -30px) scale(1.05);
  }
  50% {
    transform: translate(-10px, -50px) scale(0.95);
  }
  75% {
    transform: translate(20px, -20px) scale(1.02);
  }
}

@keyframes jellyfish-pulse {
  0%, 100% {
    opacity: 0.4;
    filter: blur(2px);
  }
  50% {
    opacity: 0.85;
    filter: blur(1px);
  }
}

.jellyfish {
  position: absolute;
  border-radius: 50% 50% 40% 40%;
  pointer-events: none;
  animation:
    jellyfish-drift var(--jelly-duration, 20s) ease-in-out infinite,
    jellyfish-pulse var(--jelly-pulse, 5s) ease-in-out infinite;
  animation-delay: var(--jelly-delay, 0s);
}

/* Swimming fish — left to right */
@keyframes swim-right {
  0% { left: -8%; opacity: 0; }
  3% { opacity: 1; }
  50% { transform: translateY(-12px); }
  97% { opacity: 1; }
  100% { left: 105%; opacity: 0; transform: translateY(0); }
}

/* Swimming fish — right to left */
@keyframes swim-left {
  0% { right: -8%; opacity: 0; }
  3% { opacity: 1; }
  50% { transform: translateY(10px); }
  97% { opacity: 1; }
  100% { right: 105%; opacity: 0; transform: translateY(0); }
}

.triton-fish-right {
  position: absolute;
  pointer-events: none;
  animation: swim-right var(--fish-duration, 30s) linear infinite;
  animation-delay: var(--fish-delay, 0s);
}

.triton-fish-left {
  position: absolute;
  pointer-events: none;
  animation: swim-left var(--fish-duration, 30s) linear infinite;
  animation-delay: var(--fish-delay, 0s);
}

/* Rare big fish — crosses screen every ~4 minutes */
@keyframes big-fish-pass {
  0%, 95% { right: -15%; opacity: 0; }
  96% { opacity: 0.5; }
  98% { opacity: 0.5; }
  99% { right: 110%; opacity: 0.5; }
  99.5% { right: 110%; opacity: 0; }
  100% { right: -15%; opacity: 0; }
}

.triton-big-fish {
  position: absolute;
  top: 40%;
  pointer-events: none;
  animation: big-fish-pass 240s linear infinite;
  animation-delay: -60s;
}

/* Caustic light ripple overlay near top */
@keyframes caustic-shift {
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 100%; }
}

.triton-caustics {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30%;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80px 60px at 20% 30%, rgba(14, 165, 233, 0.12) 0%, transparent 70%),
    radial-gradient(ellipse 60px 80px at 60% 20%, rgba(56, 189, 248, 0.09) 0%, transparent 70%),
    radial-gradient(ellipse 90px 50px at 80% 40%, rgba(14, 165, 233, 0.10) 0%, transparent 70%);
  background-size: 200% 200%;
  animation: caustic-shift 15s linear infinite;
}
```

---

## 5. Reference Pattern: Vulcan Canvas + GSAP

The Vulcan theme was already upgraded from CSS-only to Canvas + GSAP. Study this pattern — your Triton implementation should follow the same architectural approach.

### Key Architectural Patterns

```tsx
function VolcanoBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<VolcanoParticle[]>([]);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const isReducedMotion = useReducedMotion();

  // Pattern 1: GSAP animations via useGSAP hook
  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Always-on subtle animations (even with reduced motion)
      gsap.utils.toArray<HTMLElement>(".crater-glow").forEach((el, i) => {
        gsap.to(el, {
          scale: 1.15 + i * 0.05,
          opacity: 0.9,
          duration: 3.0 + i * 0.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });

      // Heavy animations only when reduced motion is OFF
      if (!isReducedMotion) {
        // Periodic events with gsap.delayedCall (self-scheduling)
        const triggerEruption = () => {
          if (pausedRef.current || !containerRef.current) {
            gsap.delayedCall(5, triggerEruption); // Retry when paused
            return;
          }
          // ... animation logic ...
          // Self-schedule next occurrence with randomized delay
          gsap.delayedCall(15 + Math.random() * 15, triggerEruption);
        };
        gsap.delayedCall(5, triggerEruption); // Initial trigger
      }
    },
    { scope: containerRef }, // GSAP cleanup scoped to container
  );

  // Pattern 2: Canvas particle system with requestAnimationFrame
  const initParticles = useCallback((w: number, h: number) => {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 70 : 130;
    particlesRef.current = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: -(0.15 + Math.random() * 0.45),
      vx: (Math.random() - 0.5) * 0.3,
      vxPhase: Math.random() * Math.PI * 2,
      vxAmp: 0.1 + Math.random() * 0.4,
      size: 0.4 + Math.random() * 1.8,
      opacity: 0,
      maxOpacity: 0.6 + Math.random() * 0.4,
      hue: 15 + Math.random() * 30,
      life: Math.random(),             // Start at random phase
      lifeSpeed: 0.0008 + Math.random() * 0.0018,
      kind: "ember" as const,
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

    // Visibility pause — stop rendering when tab is hidden
    const onVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) rafRef.current = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);

    // 30fps throttle for decorative background
    let lastFrame = 0;
    const TARGET_INTERVAL = 1000 / 30;

    function draw(now = 0) {
      if (pausedRef.current || !ctx || !canvas) return;
      rafRef.current = requestAnimationFrame(draw);
      if (now - lastFrame < TARGET_INTERVAL) return;
      lastFrame = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and render particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life += p.lifeSpeed;
        if (p.life >= 1) p.life = 0; // Loop

        p.y += p.vy;
        p.x += p.vx + Math.sin(p.life * Math.PI * 2 + p.vxPhase) * p.vxAmp;
        p.opacity = p.maxOpacity * Math.sin(p.life * Math.PI);

        // Glow halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 50%, ${p.opacity * 0.12})`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.opacity})`;
        ctx.fill();
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initParticles]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {/* Static background layers (gradients, SVGs) */}
      {/* Canvas layer on top for particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />
      {/* GSAP-animated overlays */}
    </div>
  );
}
```

---

## 6. Requirements: What the Upgraded Triton Must Have

### 6A. Canvas Particle System (rendered at 30fps)

#### Bioluminescent Particles
- **Count**: 120 desktop / 60 mobile
- **Colors**: Use the 6-color bioluminescent palette (cyan, purple, pink, teal, amber, ice blue)
- **Rendering**: For each particle, draw TWO circles:
  1. **Glow halo**: `ctx.createRadialGradient()` with color fading to transparent, radius = `size * 4`
  2. **Core dot**: Solid circle at `size` radius
- **Movement**: Gentle sine-wave horizontal drift (ocean current feel) + slow vertical drift
- **Life cycle**: `life` 0→1 loops infinitely. Opacity = `maxOpacity * Math.sin(life * Math.PI)` (fade in, peak, fade out)
- **Respawn**: When `life >= 1`, reset to `0` and randomize position — particles never get removed

#### Marine Snow
- **Count**: 30 desktop / 15 mobile
- **Appearance**: Tiny particles 1-2px, white/gray: `rgba(200, 220, 240, 0.3-0.6)`
- **Movement**: Slow fall (vy: 0.08-0.25), very subtle horizontal drift
- **No glow halo** — just a simple `ctx.arc` fill
- **Respawn**: When particle falls below viewport, reset to top with random x

#### Bubble Columns (Hydrothermal Vents)
- **Vent positions**: 2-3 fixed x-positions near bottom of viewport (e.g., 20%, 65%, 85%)
- **Spawn rate**: Each vent spawns a bubble every 30-60 frames (probabilistic, e.g., `Math.random() < 0.03`)
- **Bubble behavior**: Rise upward (vy: -0.5 to -1.5), horizontal wobble via sine wave
- **Rendering**: Canvas arc with semi-transparent fill + thin stroke
- **Colors**: Fill `rgba(14, 165, 233, 0.15)`, stroke `rgba(56, 189, 248, 0.3)`
- **Size**: Start at 2-4px, grow slightly as they rise
- **Life cycle**: Fade out and remove when reaching upper 30% of viewport

### 6B. SVG + GSAP Animated Creatures (DOM elements, not Canvas)

#### Jellyfish (5 desktop / 3 mobile)
- **Structure**: Each jellyfish is an SVG group with:
  - **Bell**: `<ellipse>` or `<path>` with radial gradient fill (bioluminescent color)
  - **Tentacles**: 4-6 `<path>` elements hanging below the bell, each with wavy curves
  - **Inner glow**: `<circle>` with feGaussianBlur filter for bioluminescent core
- **GSAP Animations** (in useGSAP):
  - **Bell pulse**: `scale: 0.92 → 1.08`, yoyo, repeat -1, duration 3-5s, ease "sine.inOut"
  - **Tentacle sway**: Each tentacle path animated via `attr: { d: ... }` or transform, staggered delays
  - **Position drift**: Gentle `x` and `y` oscillation (±20px range), duration 12-20s, yoyo
  - **Opacity pulse**: 0.3 → 0.7, yoyo, repeat -1, duration 4-6s
- **Colors**: One color per jellyfish from the bioluminescent palette
- **CSS**: `filter: drop-shadow(0 0 [size]px [glow-color])` for outer glow

#### Angler Fish (Rare Event)
- **Trigger**: `gsap.delayedCall(90 + Math.random() * 60, triggerAnglerFish)` — appears every ~90-150s
- **Structure**: SVG silhouette (dark body) with glowing lure:
  - Body: Dark path `fill="rgba(4, 14, 30, 0.85)"` with subtle edge stroke
  - Lure: Small circle above head with radial gradient + animated glow
  - Fins: 2-3 small paths for pectoral/dorsal fins
  - Eye: Tiny glowing circle
- **GSAP Animation**:
  - Swim across screen: `x` from -200 to `window.innerWidth + 200`, duration 10-14s, ease "none"
  - Lure pulse: `scale: 0.8 → 1.3`, `opacity: 0.5 → 1.0`, duration 1.5s, yoyo, repeat during swim
  - Body bob: `y: ±8px`, duration 3s, yoyo, repeat during swim
- **Direction**: Randomly left-to-right or right-to-left (flip SVG with `scaleX: -1`)
- **Vertical position**: Random between 25-65% of viewport height
- **Cleanup**: Hide/remove SVG after animation completes, then schedule next appearance

#### God Rays (Enhanced from CSS to GSAP)
- **Keep the existing 6 ray divs** with gradient backgrounds
- **Add GSAP in useGSAP**:
  - Width oscillation: `scaleX: 0.85 → 1.15`, duration 8-14s per ray, yoyo, repeat -1
  - Opacity pulse: Current opacity ×0.6 → ×1.4, duration 10-16s per ray, yoyo, repeat -1
  - Stagger: Each ray gets a different delay so they don't sync up
- **CSS class** `.triton-ray` keeps `position: absolute`, `top: -10%`, `pointer-events: none`, `transform-origin: top center`
- **Remove** the CSS `@keyframes ocean-ray-sway` animation — GSAP handles it now

### 6C. CSS Animations (Lightweight)

#### Swimming Fish
- **Keep existing CSS keyframes** `swim-right` and `swim-left`
- **Keep existing CSS classes** `.triton-fish-right` and `.triton-fish-left`
- **Increase count**: 6 fish (3 going right, 3 going left)
- **Size variety**: 6-18px range (was 8-18px)

#### Big Fish / Whale (Keep)
- **Keep existing** `@keyframes big-fish-pass` and `.triton-big-fish` exactly as-is

### 6D. GSAP Periodic Events

#### Bioluminescent Pulse Wave
- **Trigger**: Every 18-25s via `gsap.delayedCall()`
- **Structure**: A `<div className="triton-pulse-wave">` in the JSX with:
  - `position: absolute`, `inset: 0`, `pointer-events: none`, `opacity: 0`
  - Background: `radial-gradient(ellipse at 50% 100%, rgba(14, 165, 233, 0.20) 0%, rgba(100, 220, 255, 0.08) 40%, transparent 70%)`
- **GSAP Animation**:
  ```tsx
  gsap.fromTo(".triton-pulse-wave",
    { opacity: 0, scale: 0.8, transformOrigin: "center bottom" },
    { opacity: 1, scale: 1.5, duration: 1.5, ease: "sine.out",
      onComplete: () => {
        gsap.to(".triton-pulse-wave", { opacity: 0, duration: 2, ease: "sine.in" });
      }
    }
  );
  ```

#### Deep Rumble (Whale Call)
- **Trigger**: Every 45-90s via `gsap.delayedCall()`
- **Effect 1**: Brief shake on container — `gsap.to(containerRef.current, { x: 2, y: -1, duration: 0.08, yoyo: true, repeat: 5, ease: "sine.inOut" })`
- **Effect 2**: Subtle blue flash overlay — `<div className="triton-rumble-flash">` with `opacity: 0` → `0.06` → `0`
- **Total duration**: ~0.8s
- **Skip when `isReducedMotion`**

---

## 7. TypeScript Types

Define these OUTSIDE the function (above `OceanBackground`):

```tsx
type OceanParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vxPhase: number;       // Sine wave phase for ocean current drift
  vxAmp: number;         // Amplitude of horizontal drift
  size: number;          // Radius in px
  opacity: number;       // Current opacity (computed each frame)
  maxOpacity: number;    // Peak opacity when life = 0.5
  life: number;          // 0-1 cycle phase
  lifeSpeed: number;     // How fast life increments per frame
  kind: "bio" | "snow" | "bubble";
  r: number;             // Red component (0-255)
  g: number;             // Green component (0-255)
  b: number;             // Blue component (0-255)
  glowR?: number;        // Glow red (for bio particles)
  glowG?: number;        // Glow green
  glowB?: number;        // Glow blue
};
```

---

## 8. Performance & Accessibility Requirements

### Mobile Optimization
```tsx
const isMobile = window.innerWidth < 768;
const BIO_COUNT = isMobile ? 60 : 120;
const SNOW_COUNT = isMobile ? 15 : 30;
const JELLY_COUNT = isMobile ? 3 : 5;
const FISH_COUNT = isMobile ? 4 : 6;
```

### Canvas Frame Rate
```tsx
const TARGET_INTERVAL = 1000 / 30; // 30fps — decorative background, not gameplay
let lastFrame = 0;

function draw(now = 0) {
  if (pausedRef.current || !ctx || !canvas) return;
  rafRef.current = requestAnimationFrame(draw);
  if (now - lastFrame < TARGET_INTERVAL) return;
  lastFrame = now;
  // ... render
}
```

### Visibility Pause
```tsx
const onVisibility = () => {
  pausedRef.current = document.hidden;
  if (!document.hidden) rafRef.current = requestAnimationFrame(draw);
};
document.addEventListener("visibilitychange", onVisibility);
```

### Reduced Motion
- **Always active** (even with reduced motion): Background gradient, god rays (static), jellyfish (static glow, no animation)
- **Disabled when reduced motion ON**: Canvas particle animation, GSAP periodic events (pulse wave, rumble, angler fish), fish swimming, jellyfish movement

```tsx
if (!isReducedMotion) {
  // All GSAP periodic events
  // All Canvas animation
  // Fish CSS animations
}
```

---

## 9. Output Format

Provide your implementation as **exactly two code blocks** in your response:

### Code Block 1: OceanBackground Component

This replaces lines 976-1189 in `starfield.tsx`. Include:
- Constants (replacing `BIO_DOT_COUNT`, `JELLYFISH_COUNT`, `SMALL_FISH_COUNT`)
- TypeScript types (defined above the function)
- The complete `OceanBackground()` function with all refs, hooks, Canvas rendering, and JSX

**Do NOT include**:
- `import` statements (they're already at the top of the file)
- The `"use client"` directive
- Any other components from the file

### Code Block 2: Triton CSS

This replaces lines 1026-1261 in `globals.css`. Include:
- The `/* ===== TRITON — Deep Sea ===== */` comment header
- All `@keyframes` definitions
- All CSS class definitions (`.bio-dot`, `.triton-ray`, `.jellyfish`, `.triton-fish-right`, `.triton-fish-left`, `.triton-big-fish`, `.triton-caustics`, plus any new classes)
- Any new classes for pulse wave, rumble flash, etc.

**Do NOT include**:
- The `.triton { ... }` CSS custom properties block (that's elsewhere in the file)
- The `.triton .glass { ... }` block
- Any Tailwind `@theme` directives

---

## 10. Self-Verification Checklist

Before submitting, verify every item:

- [ ] All TypeScript types are fully defined (no `any`, no missing properties)
- [ ] `useReducedMotion()` is called and `isReducedMotion` is checked before heavy animations
- [ ] Canvas uses `requestAnimationFrame` with 30fps throttle
- [ ] Visibility pause is implemented (`document.hidden` check)
- [ ] `useGSAP()` uses `{ scope: containerRef }` for proper cleanup
- [ ] GSAP periodic events use `gsap.delayedCall()` with randomized intervals
- [ ] GSAP periodic events check `pausedRef.current` at the start and reschedule if paused
- [ ] Bioluminescent particles use `ctx.createRadialGradient()` for bloom glow
- [ ] Marine snow particles respawn at top when they fall below viewport
- [ ] Bubbles spawn from fixed vent positions and fade out near the top
- [ ] Jellyfish are SVG with animated tentacles (not just blobs)
- [ ] Angler fish appears every ~90-150s with glowing lure animation
- [ ] God rays use GSAP (not CSS keyframes) for oscillation
- [ ] Pulse wave triggers every ~20s with radial expansion
- [ ] Deep rumble triggers every ~60s with shake + flash
- [ ] Mobile particle counts are reduced
- [ ] 6 swimming fish (3 right, 3 left)
- [ ] Big fish / whale CSS animation is preserved
- [ ] No placeholder comments (`// ...`, `// TODO`, `/* implement */`)
- [ ] No unused variables or dead code
- [ ] All string color values match the Triton palette
- [ ] Canvas cleanup in useEffect return (`cancelAnimationFrame`, remove event listeners)
- [ ] `containerRef` is attached to the root `<div>` of the component
- [ ] `canvasRef` is attached to the `<canvas>` element
- [ ] All CSS classes used in JSX are defined in the CSS code block
- [ ] Code is production-ready, not a prototype
