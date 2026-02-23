"use client";

import { useTheme } from "@/lib/theme-context";
import { useState, useEffect } from "react";
import { CandleBackground } from "./candle-background";
import { RealisticBlackHole } from "./realistic-black-hole";

/* ================================================================
   MATRIX — Dense binary rain covering the entire screen
   ================================================================ */

const MATRIX_COLUMNS = 70;
const MATRIX_CHARS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

function MatrixRain() {
  const [columns, setColumns] = useState<{ speed: number; charCount: number; fontSize: number; opacity: number; left: number; chars: string[]; rainDelay: number }[]>([]);

  useEffect(() => {
    setColumns(
      Array.from({ length: MATRIX_COLUMNS }).map((_, i) => {
        const speed = 4 + Math.random() * 10;
        const charCount = 25 + Math.floor(Math.random() * 25);
        const fontSize = 11 + Math.random() * 5;
        const opacity = 0.3 + Math.random() * 0.5;
        const left = (i / MATRIX_COLUMNS) * 100;
        const chars = Array.from({ length: charCount }).map(() =>
          MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
        );
        const rainDelay = Math.random() * -15;
        return { speed, charCount, fontSize, opacity, left, chars, rainDelay };
      })
    );
  }, []);

  return (
    <>
      {columns.map((col, i) => (
        <div
          key={i}
          className="matrix-column"
          style={{
            left: `${col.left}%`,
            "--rain-duration": `${col.speed}s`,
            "--rain-delay": `${col.rainDelay}s`,
            fontSize: `${col.fontSize}px`,
          } as React.CSSProperties}
        >
          {col.chars.map((char, j) => {
            // First char is bright white-green "head", rest fade to green
            const isHead = j === 0;
            const brightness = isHead ? 1 : Math.max(0.15, 1 - (j / col.chars.length) * 1.2);
            return (
              <span
                key={j}
                style={{
                  color: isHead
                    ? "#ffffff"
                    : `rgba(34, 197, 94, ${brightness})`,
                  textShadow: isHead
                    ? "0 0 6px #4ade80, 0 0 12px #22c55e"
                    : `0 0 ${3 * brightness}px rgba(34, 197, 94, ${brightness * 0.5})`,
                  opacity: col.opacity,
                }}
              >
                {char}{"\n"}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
}

/* ================================================================
   VOLCANO — Fiery eruption with embers, lava glow, dark charcoal
   ================================================================ */

const EMBER_COUNT = 55;
const ERUPTION_PARTICLE_COUNT = 28;
const SMOKE_WISP_COUNT = 5;

function VolcanoBackground() {
  type Ember = { left: number; bottom: number; duration: number; delay: number; size: number; hue: number; brightness: number };
  type EruptionParticle = { left: number; size: number; hue: number; duration: number; delay: number; xDrift: number };
  type SmokeWisp = { left: number; size: number; duration: number; delay: number; opacity: number };

  const [embers, setEmbers] = useState<Ember[]>([]);
  const [eruptionParticles, setEruptionParticles] = useState<EruptionParticle[]>([]);
  const [smokeWisps, setSmokeWisps] = useState<SmokeWisp[]>([]);

  useEffect(() => {
    setEmbers(
      Array.from({ length: EMBER_COUNT }).map(() => ({
        left: 5 + Math.random() * 90,
        bottom: Math.random() * 30,
        duration: 5 + Math.random() * 8,
        delay: Math.random() * -12,
        size: 1.5 + Math.random() * 4,
        hue: 15 + Math.random() * 30,
        brightness: 0.75 + Math.random() * 0.25,
      }))
    );
    setEruptionParticles(
      Array.from({ length: ERUPTION_PARTICLE_COUNT }).map(() => ({
        left: 42 + Math.random() * 16,
        size: 2 + Math.random() * 5,
        hue: 20 + Math.random() * 35,
        duration: 1.5 + Math.random() * 2,
        delay: Math.random() * 1.2,
        xDrift: -30 + Math.random() * 60,
      }))
    );
    setSmokeWisps(
      Array.from({ length: SMOKE_WISP_COUNT }).map((_, i) => ({
        left: 43 + i * 3.5,
        size: 30 + Math.random() * 40,
        duration: 8 + Math.random() * 6,
        delay: -(Math.random() * 10),
        opacity: 0.06 + Math.random() * 0.06,
      }))
    );
  }, []);

  return (
    <>
      {/* Dark volcanic gradient */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, #0a0504 0%, #0e0706 30%, #120804 55%, #1a0c06 80%, #200e08 100%)",
      }} />

      {/* Volcanic mountain silhouette at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%]" style={{
        background: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 300'%3E%3Cpath d='M0,300 L0,250 L100,220 L200,200 L300,160 L400,120 L450,80 L500,50 L530,30 L550,20 L570,30 L600,50 L640,80 L680,120 L720,100 L760,80 L790,60 L810,50 L830,60 L860,90 L900,130 L950,170 L1000,200 L1100,230 L1200,250 L1200,300 Z' fill='%23080402'/%3E%3C/svg%3E") no-repeat bottom center / 100% auto`,
        opacity: 0.9,
      }} />

      {/* Lava glow from crater — warm orange-red */}
      <div className="lava-glow" style={{
        bottom: "15%", left: "38%", width: "24%", height: "30%",
        background: "radial-gradient(ellipse at 50% 80%, rgba(249,115,22,0.35) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)",
        "--lava-duration": "6s",
        "--lava-delay": "0s",
        filter: "blur(20px)",
      } as React.CSSProperties} />

      {/* Bottom lava glow — wide ambient heat */}
      <div className="absolute inset-x-0 bottom-0 h-1/3" style={{
        background: "radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.25) 0%, rgba(220,38,38,0.12) 30%, transparent 65%)",
      }} />

      {/* Smoke/haze near top */}
      <div className="absolute top-0 inset-x-0 h-1/4" style={{
        background: "linear-gradient(180deg, rgba(30,15,10,0.55) 0%, transparent 100%)",
      }} />

      {/* Ember particles rising */}
      {embers.map((e, i) => (
        <div
          key={i}
          className="ember"
          style={{
            left: `${e.left}%`,
            bottom: `${e.bottom}%`,
            "--ember-duration": `${e.duration}s`,
            "--ember-delay": `${e.delay}s`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            background: `hsla(${e.hue}, 95%, ${55 + e.brightness * 20}%, ${e.brightness})`,
            boxShadow: `0 0 ${e.size * 3}px ${e.size * 1.5}px hsla(${e.hue}, 95%, 50%, 0.4)`,
          } as React.CSSProperties}
        />
      ))}

      {/* Smoke wisps rising from crater */}
      {smokeWisps.map((s, i) => (
        <div
          key={`smoke-${i}`}
          className="volcano-smoke"
          style={{
            left: `${s.left}%`,
            bottom: "35%",
            width: `${s.size}px`,
            height: `${s.size * 2}px`,
            "--smoke-duration": `${s.duration}s`,
            "--smoke-delay": `${s.delay}s`,
            "--smoke-opacity": s.opacity,
          } as React.CSSProperties}
        />
      ))}

      {/* Periodic eruption burst — particles shoot from crater */}
      {eruptionParticles.map((p, i) => (
        <div
          key={`eruption-${i}`}
          className="eruption-particle"
          style={{
            left: `${p.left}%`,
            bottom: "38%",
            width: `${p.size}px`,
            height: `${p.size}px`,
            "--eruption-duration": `${p.duration}s`,
            "--eruption-delay": `${p.delay}s`,
            "--eruption-x": `${p.xDrift}px`,
            background: `hsla(${p.hue}, 100%, 65%, 0.95)`,
            boxShadow: `0 0 ${p.size * 4}px ${p.size * 2}px hsla(${p.hue}, 100%, 55%, 0.5)`,
          } as React.CSSProperties}
        />
      ))}

      {/* Eruption glow pulse — intensifies during burst */}
      <div className="eruption-glow" style={{
        position: "absolute",
        bottom: "30%",
        left: "38%",
        width: "24%",
        height: "20%",
        background: "radial-gradient(ellipse at 50% 80%, rgba(255,120,20,0.4) 0%, rgba(249,115,22,0.2) 30%, transparent 65%)",
        filter: "blur(15px)",
        pointerEvents: "none",
      }} />

      {/* Subtle red ambient glow at very bottom */}
      <div className="absolute inset-x-0 bottom-0 h-[15%]" style={{
        background: "linear-gradient(to top, rgba(220,38,38,0.12), transparent)",
      }} />
    </>
  );
}

/* ================================================================
   OCEAN — Deep underwater cave with bioluminescence
   ================================================================ */

const BIO_DOT_COUNT = 75;
const JELLYFISH_COUNT = 6;
const SMALL_FISH_COUNT = 10;

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
      <div className="ocean-caustics" />

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
          className="ocean-ray"
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
          className={fish.goingRight ? "ocean-fish-right" : "ocean-fish-left"}
          style={{
            top: `${fish.top}%`,
            "--fish-duration": `${fish.duration}s`,
            "--fish-delay": `${fish.delay}s`,
            "--fish-size": `${fish.size}px`,
          } as React.CSSProperties}
        >
          {/* Fish body — simple SVG */}
          <svg
            width={fish.size * 2.2}
            height={fish.size}
            viewBox="0 0 22 10"
            style={{ filter: `drop-shadow(0 0 ${fish.size * 0.5}px ${fish.glow})` }}
          >
            {/* Body */}
            <ellipse cx="10" cy="5" rx="8" ry="4" fill={fish.body} />
            {/* Tail */}
            <polygon
              points={fish.goingRight ? "2,5 0,1 0,9" : "20,5 22,1 22,9"}
              fill={fish.body}
            />
            {/* Eye */}
            <circle
              cx={fish.goingRight ? "15" : "7"}
              cy="4"
              r="1"
              fill="rgba(255,255,255,0.8)"
            />
          </svg>
        </div>
      ))}

      {/* Rare large fish (whale silhouette) — appears every ~4 minutes */}
      <div className="ocean-big-fish">
        <svg width="120" height="40" viewBox="0 0 120 40" style={{ filter: "drop-shadow(0 0 8px rgba(14,165,233,0.15))" }}>
          <path
            d="M5,20 Q10,8 30,6 Q50,4 70,8 Q85,12 95,15 Q100,17 105,14 Q110,10 115,8 L118,12 L115,16 Q110,20 105,22 Q100,23 95,25 Q85,28 70,32 Q50,36 30,34 Q10,32 5,20 Z"
            fill="rgba(8,25,50,0.7)"
            stroke="rgba(14,165,233,0.15)"
            strokeWidth="0.5"
          />
          {/* Eye */}
          <circle cx="25" cy="18" r="2" fill="rgba(125,211,252,0.4)" />
          {/* Belly line */}
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

/* ================================================================
   DASHBOARD BLACK HOLE — Uses shared RealisticBlackHole component
   ================================================================ */

/* ================================================================
   MAIN STARFIELD COMPONENT
   ================================================================ */

export function Starfield() {
  const { theme } = useTheme();

  // Space Purple mode — stars, violet shooting stars, purple nebula, floating space objects
  if (theme === "dark") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "#080c14" }}>
        <RealisticBlackHole size="medium" opacity={0.4} />
        <div className="stars-small" />
        <div className="stars-medium" />
        <div className="stars-large" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="nebula-blob nebula-blob-1" />
        <div className="nebula-blob nebula-blob-2" />

        {/* Floating space objects — only 1 visible at a time (staggered long delays) */}
        {/* Comet — tapered tail with ice particles and bright nucleus */}
        <div className="space-object space-object-1">
          <svg width="100" height="16" viewBox="0 0 100 16" style={{ opacity: 0.65 }}>
            <defs>
              <linearGradient id="comet-tail" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="rgba(139,92,246,0)" />
                <stop offset="40%" stopColor="rgba(139,92,246,0.1)" />
                <stop offset="70%" stopColor="rgba(167,139,250,0.3)" />
                <stop offset="90%" stopColor="rgba(221,214,254,0.6)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
              </linearGradient>
              <radialGradient id="comet-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="40%" stopColor="rgba(221,214,254,0.8)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0)" />
              </radialGradient>
            </defs>
            {/* Main tail — tapered shape */}
            <polygon points="0,7 0,9 88,6.5 88,9.5" fill="url(#comet-tail)" />
            {/* Secondary dust trail */}
            <polygon points="20,6 20,10 88,7 88,9" fill="rgba(167,139,250,0.15)" />
            {/* Ice particle dots trailing behind */}
            <circle cx="30" cy="6" r="0.6" fill="rgba(221,214,254,0.4)" />
            <circle cx="45" cy="10" r="0.5" fill="rgba(196,181,253,0.35)" />
            <circle cx="55" cy="5.5" r="0.7" fill="rgba(221,214,254,0.3)" />
            <circle cx="65" cy="11" r="0.4" fill="rgba(167,139,250,0.25)" />
            <circle cx="72" cy="7" r="0.5" fill="rgba(221,214,254,0.45)" />
            {/* Bright nucleus with glow */}
            <circle cx="91" cy="8" r="4" fill="url(#comet-glow)" style={{ filter: "drop-shadow(0 0 4px rgba(139,92,246,0.9)) drop-shadow(0 0 8px rgba(167,139,250,0.5))" }} />
            <circle cx="91" cy="8" r="1.5" fill="white" />
          </svg>
        </div>

        {/* Satellite — detailed body, antenna dish, solar panel grids */}
        <div className="space-object space-object-2">
          <svg width="34" height="20" viewBox="0 0 34 20" style={{ opacity: 0.55 }}>
            {/* Solar panel left — with grid lines */}
            <rect x="0" y="5" width="9" height="10" rx="0.5" fill="rgba(139,92,246,0.45)" stroke="rgba(167,139,250,0.5)" strokeWidth="0.4" />
            <line x1="3" y1="5" x2="3" y2="15" stroke="rgba(221,214,254,0.2)" strokeWidth="0.3" />
            <line x1="6" y1="5" x2="6" y2="15" stroke="rgba(221,214,254,0.2)" strokeWidth="0.3" />
            <line x1="0" y1="8" x2="9" y2="8" stroke="rgba(221,214,254,0.15)" strokeWidth="0.3" />
            <line x1="0" y1="12" x2="9" y2="12" stroke="rgba(221,214,254,0.15)" strokeWidth="0.3" />
            {/* Connecting arm left */}
            <rect x="9" y="9" width="2" height="2" fill="rgba(180,180,200,0.5)" />
            {/* Central body — octagonal shape */}
            <rect x="11" y="6" width="10" height="8" rx="1.5" fill="rgba(200,200,220,0.6)" stroke="rgba(221,214,254,0.3)" strokeWidth="0.4" />
            {/* Body detail — panel line */}
            <line x1="16" y1="6" x2="16" y2="14" stroke="rgba(139,92,246,0.25)" strokeWidth="0.3" />
            {/* Status light */}
            <circle cx="13.5" cy="10" r="0.6" fill="rgba(34,197,94,0.7)" />
            {/* Connecting arm right */}
            <rect x="21" y="9" width="2" height="2" fill="rgba(180,180,200,0.5)" />
            {/* Solar panel right — with grid lines */}
            <rect x="23" y="5" width="9" height="10" rx="0.5" fill="rgba(139,92,246,0.45)" stroke="rgba(167,139,250,0.5)" strokeWidth="0.4" />
            <line x1="26" y1="5" x2="26" y2="15" stroke="rgba(221,214,254,0.2)" strokeWidth="0.3" />
            <line x1="29" y1="5" x2="29" y2="15" stroke="rgba(221,214,254,0.2)" strokeWidth="0.3" />
            <line x1="23" y1="8" x2="32" y2="8" stroke="rgba(221,214,254,0.15)" strokeWidth="0.3" />
            <line x1="23" y1="12" x2="32" y2="12" stroke="rgba(221,214,254,0.15)" strokeWidth="0.3" />
            {/* Antenna dish — top */}
            <line x1="16" y1="6" x2="16" y2="1" stroke="rgba(200,200,220,0.5)" strokeWidth="0.4" />
            <ellipse cx="16" cy="1" rx="2" ry="1" fill="none" stroke="rgba(221,214,254,0.4)" strokeWidth="0.4" />
            <circle cx="16" cy="1" r="0.4" fill="rgba(221,214,254,0.5)" />
          </svg>
        </div>

        {/* Astronaut — arms out, backpack, visor reflection, tether */}
        <div className="space-object space-object-3">
          <svg width="28" height="36" viewBox="0 0 28 36" style={{ opacity: 0.5 }}>
            {/* Tether line trailing behind */}
            <path d="M14,18 Q8,22 4,28 Q2,32 1,36" fill="none" stroke="rgba(200,200,220,0.2)" strokeWidth="0.4" strokeDasharray="1.5,1" />
            {/* Backpack / life support */}
            <rect x="9" y="11" width="10" height="12" rx="1.5" fill="rgba(140,140,160,0.35)" stroke="rgba(200,200,220,0.2)" strokeWidth="0.3" />
            {/* Backpack detail lines */}
            <line x1="11" y1="13" x2="11" y2="21" stroke="rgba(221,214,254,0.15)" strokeWidth="0.3" />
            <rect x="15" y="14" width="2.5" height="4" rx="0.5" fill="rgba(100,100,120,0.3)" />
            {/* Body / suit */}
            <rect x="8" y="12" width="8" height="11" rx="2.5" fill="rgba(200,200,220,0.45)" stroke="rgba(221,214,254,0.15)" strokeWidth="0.3" />
            {/* Left arm — reaching out */}
            <path d="M8,14 Q4,13 2,10 Q1,8 1.5,7" fill="none" stroke="rgba(200,200,220,0.4)" strokeWidth="1.8" strokeLinecap="round" />
            {/* Left glove */}
            <circle cx="1.5" cy="6.5" r="1" fill="rgba(200,200,220,0.4)" />
            {/* Right arm — slight bend */}
            <path d="M16,14 Q20,15 23,13 Q25,11 25.5,9" fill="none" stroke="rgba(200,200,220,0.4)" strokeWidth="1.8" strokeLinecap="round" />
            {/* Right glove */}
            <circle cx="25.5" cy="8.5" r="1" fill="rgba(200,200,220,0.4)" />
            {/* Helmet */}
            <circle cx="12" cy="7" r="5" fill="rgba(200,200,220,0.5)" stroke="rgba(221,214,254,0.25)" strokeWidth="0.4" />
            {/* Visor — dark reflective */}
            <ellipse cx="12" cy="7.5" rx="3.5" ry="2.8" fill="rgba(40,20,80,0.6)" />
            {/* Visor reflection highlight */}
            <ellipse cx="10.5" cy="6.5" rx="1.5" ry="0.8" fill="rgba(139,92,246,0.3)" transform="rotate(-15,10.5,6.5)" />
            <ellipse cx="13" cy="8" rx="0.8" ry="0.4" fill="rgba(221,214,254,0.15)" transform="rotate(10,13,8)" />
            {/* Left leg */}
            <path d="M10,23 Q9,27 8,31" fill="none" stroke="rgba(200,200,220,0.38)" strokeWidth="2" strokeLinecap="round" />
            {/* Left boot */}
            <ellipse cx="7.5" cy="31.5" rx="1.5" ry="1" fill="rgba(180,180,200,0.35)" />
            {/* Right leg */}
            <path d="M14,23 Q15,27 16,31" fill="none" stroke="rgba(200,200,220,0.38)" strokeWidth="2" strokeLinecap="round" />
            {/* Right boot */}
            <ellipse cx="16.5" cy="31.5" rx="1.5" ry="1" fill="rgba(180,180,200,0.35)" />
          </svg>
        </div>
      </div>
    );
  }

  // Dark Simple — clean dark background with floating candles
  if (theme === "dark-simple") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "#121212" }}>
        <CandleBackground colorScheme="trading" />
      </div>
    );
  }

  // Matrix mode — dense binary rain, no stars
  if (theme === "matrix") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "#000000" }}>
        <MatrixRain />
        <div className="matrix-scanlines" />
      </div>
    );
  }

  // Volcano mode — fiery eruption
  if (theme === "volcano") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <VolcanoBackground />
      </div>
    );
  }

  // Ocean mode — deep underwater cave
  if (theme === "ocean") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <OceanBackground />
      </div>
    );
  }

  // Light mode: animated candlesticks
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "var(--background)" }}>
      <CandleBackground />
    </div>
  );
}
