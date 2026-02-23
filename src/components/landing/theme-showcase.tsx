"use client";

import { useState } from "react";
import { TiltCard } from "./tilt-card";
import { RealisticBlackHole } from "@/components/realistic-black-hole";

type ThemeOption = {
  id: string;
  label: string;
  dot: string;
  bg: string;
  surface: string;
  border: string;
  foreground: string;
  muted: string;
  accent: string;
  win: string;
  loss: string;
  accentGlow: string;
};

const PRO_THEME_IDS = ["dark", "matrix", "volcano", "ocean"];

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "light",
    label: "Light",
    dot: "#eef0f4",
    bg: "#eef0f4",
    surface: "#f7f8fa",
    border: "#d5d9e2",
    foreground: "#1a1d27",
    muted: "#5a5f7a",
    accent: "#0096B7",
    win: "#0096B7",
    loss: "#dc2626",
    accentGlow: "rgba(0, 150, 183, 0.1)",
  },
  {
    id: "dark-simple",
    label: "Dark",
    dot: "#1e1e1e",
    bg: "#121212",
    surface: "rgba(30, 30, 30, 0.9)",
    border: "#2a2a2a",
    foreground: "#e4e4e7",
    muted: "#71717a",
    accent: "#60a5fa",
    win: "#4ade80",
    loss: "#f87171",
    accentGlow: "rgba(96, 165, 250, 0.12)",
  },
  {
    id: "dark",
    label: "Space Purple",
    dot: "#8B5CF6",
    bg: "#080c14",
    surface: "rgba(12, 18, 30, 0.85)",
    border: "#1a1535",
    foreground: "#e0eaf4",
    muted: "#6a6a9a",
    accent: "#8B5CF6",
    win: "#A78BFA",
    loss: "#ef4444",
    accentGlow: "rgba(139, 92, 246, 0.15)",
  },
  {
    id: "matrix",
    label: "Matrix",
    dot: "#22c55e",
    bg: "#000000",
    surface: "rgba(5, 15, 5, 0.9)",
    border: "#1a4028",
    foreground: "#e8ffe8",
    muted: "#7dcc8e",
    accent: "#22c55e",
    win: "#86efac",
    loss: "#ef4444",
    accentGlow: "rgba(34, 197, 94, 0.15)",
  },
  {
    id: "volcano",
    label: "Volcano",
    dot: "#f97316",
    bg: "#0a0504",
    surface: "rgba(18, 10, 6, 0.85)",
    border: "#2d1810",
    foreground: "#f0e0d8",
    muted: "#8a6050",
    accent: "#f97316",
    win: "#fbbf24",
    loss: "#ef4444",
    accentGlow: "rgba(249, 115, 22, 0.15)",
  },
  {
    id: "ocean",
    label: "Ocean",
    dot: "#0ea5e9",
    bg: "#020817",
    surface: "rgba(4, 14, 30, 0.85)",
    border: "#0f2040",
    foreground: "#d0e8f0",
    muted: "#4a7a9a",
    accent: "#0ea5e9",
    win: "#7dd3fc",
    loss: "#ef4444",
    accentGlow: "rgba(14, 165, 233, 0.15)",
  },
];

function ThemeBackground({ theme }: { theme: ThemeOption }) {
  if (theme.id === "light") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-t-xl">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-[float-orb_12s_ease-in-out_infinite]"
            style={{
              width: `${30 + i * 15}px`,
              height: `${30 + i * 15}px`,
              background: `radial-gradient(circle, ${theme.accent}15, transparent 70%)`,
              top: `${15 + i * 16}%`,
              left: `${10 + i * 18}%`,
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (theme.id === "matrix") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-t-xl">
        {/* Dense binary rain columns */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute font-mono animate-[matrix-rain_4s_linear_infinite]"
            style={{
              color: i === 3 || i === 12 ? "#ffffff" : `rgba(34, 197, 94, ${0.3 + (i % 5) * 0.12})`,
              textShadow: i === 3 || i === 12 ? "0 0 4px #4ade80" : `0 0 2px rgba(34, 197, 94, 0.3)`,
              fontSize: "8px",
              lineHeight: "9px",
              left: `${2 + i * 5}%`,
              top: "-20px",
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${2 + (i % 4)}s`,
            }}
          >
            {Array.from({ length: 12 }, (_, j) => ((i * 12 + j) * 7 + 3) % 5 < 3 ? "1" : "0").join("\n")}
          </div>
        ))}
        {/* Scan-line overlay */}
        <div className="absolute inset-0 rounded-t-xl" style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.02) 2px, rgba(0, 255, 0, 0.02) 4px)",
        }} />
      </div>
    );
  }

  if (theme.id === "volcano") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-t-xl">
        {/* Dark charcoal gradient */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, #0a0504 0%, #120804 50%, #1a0c06 100%)",
        }} />
        {/* Bottom lava glow */}
        <div className="absolute inset-x-0 bottom-0 h-1/3" style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.3) 0%, rgba(239,68,68,0.12) 40%, transparent 70%)",
        }} />
        {/* Ember particles */}
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-[ember-rise_5s_ease-out_infinite]"
            style={{
              width: `${1.5 + (i % 3)}px`,
              height: `${1.5 + (i % 3)}px`,
              background: `hsla(${20 + i * 5}, 90%, ${55 + (i % 3) * 10}%, 0.9)`,
              boxShadow: `0 0 4px 1px hsla(${20 + i * 5}, 90%, 50%, 0.4)`,
              bottom: `${5 + (i % 4) * 8}%`,
              left: `${8 + i * 7}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 3) * 1.5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (theme.id === "ocean") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-t-xl">
        {/* Deep abyss gradient */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, #051020 0%, #030a18 50%, #020817 100%)",
        }} />
        {/* Light ray from above */}
        <div className="absolute top-0 left-1/3 w-[60px] h-[80%]" style={{
          background: "linear-gradient(180deg, rgba(125,211,252,0.06) 0%, transparent 70%)",
          transform: "rotate(5deg)",
        }} />
        {/* Multi-color bioluminescent dots — expanded palette */}
        {[...Array(22)].map((_, i) => {
          const colors = [
            "rgba(100, 220, 255, 0.6)",
            "rgba(200, 120, 255, 0.5)",
            "rgba(255, 130, 200, 0.5)",
            "rgba(100, 255, 218, 0.4)",
            "rgba(255, 200, 100, 0.5)",
            "rgba(250, 180, 80, 0.4)",
          ];
          const shadows = [
            "rgba(14, 165, 233, 0.3)",
            "rgba(168, 85, 247, 0.3)",
            "rgba(236, 72, 153, 0.3)",
            "rgba(45, 212, 191, 0.25)",
            "rgba(251, 191, 36, 0.25)",
            "rgba(245, 158, 11, 0.25)",
          ];
          const ci = i % colors.length;
          return (
            <div
              key={i}
              className="absolute rounded-full animate-[bioluminescence_5s_ease-in-out_infinite]"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                background: colors[ci],
                boxShadow: `0 0 8px 3px ${shadows[ci]}`,
                top: `${15 + ((Math.sin(i * 7.3 + 2.1) * 0.5 + 0.5) * 70)}%`,
                left: `${5 + ((Math.sin(i * 3.1 + 11.7) * 0.5 + 0.5) * 90)}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${3 + (i % 4) * 1.5}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (theme.id === "dark-simple") {
    // Mini candlestick shapes floating on dark background
    const candles = [
      { x: 5, y: 10, h: 32, w: 6, up: true, delay: 0 },
      { x: 15, y: 30, h: 26, w: 6, up: false, delay: 1.2 },
      { x: 28, y: 8, h: 36, w: 6, up: true, delay: 0.6 },
      { x: 40, y: 35, h: 22, w: 6, up: false, delay: 2.0 },
      { x: 52, y: 15, h: 30, w: 6, up: true, delay: 0.3 },
      { x: 64, y: 40, h: 28, w: 6, up: false, delay: 1.5 },
      { x: 76, y: 20, h: 24, w: 6, up: true, delay: 0.9 },
      { x: 88, y: 12, h: 34, w: 6, up: true, delay: 1.8 },
      { x: 35, y: 55, h: 20, w: 5, up: false, delay: 0.4 },
      { x: 70, y: 50, h: 25, w: 5, up: true, delay: 1.0 },
    ];
    return (
      <div className="absolute inset-0 overflow-hidden rounded-t-xl">
        <div className="absolute inset-0" style={{ background: "#121212" }} />
        {candles.map((c, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          >
            {/* Upper wick */}
            <div style={{
              width: "1.5px",
              height: `${c.h * 0.35}px`,
              background: c.up ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.45)",
              margin: "0 auto",
            }} />
            {/* Body */}
            <div style={{
              width: `${c.w}px`,
              height: `${c.h * 0.45}px`,
              background: c.up ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.5)",
              borderRadius: "1px",
              boxShadow: c.up
                ? "0 0 6px rgba(34,197,94,0.35), 0 0 12px rgba(34,197,94,0.15)"
                : "0 0 6px rgba(239,68,68,0.3), 0 0 12px rgba(239,68,68,0.12)",
            }} />
            {/* Lower wick */}
            <div style={{
              width: "1.5px",
              height: `${c.h * 0.25}px`,
              background: c.up ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.35)",
              margin: "0 auto",
            }} />
          </div>
        ))}
      </div>
    );
  }

  // Dark / Space Purple — stars with violet tint + mini black hole
  return (
    <div className="absolute inset-0 overflow-hidden rounded-t-xl">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-px rounded-full animate-pulse"
          style={{
            background: i % 5 === 0 ? "#C4B5FD" : "#fff",
            opacity: 0.3 + ((Math.sin(i * 7.3 + 2.1) * 0.5 + 0.5) * 0.4),
            top: `${(Math.sin(i * 13.7 + 5.3) * 0.5 + 0.5) * 100}%`,
            left: `${(Math.sin(i * 3.1 + 11.7) * 0.5 + 0.5) * 100}%`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      {/* Mini black hole centered */}
      <RealisticBlackHole size="small" opacity={0.6} />
      {/* Subtle purple nebula glow */}
      <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full" style={{
        background: "radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%)",
        filter: "blur(20px)",
      }} />
    </div>
  );
}

function MockDashboard({ theme }: { theme: ThemeOption }) {
  const barHeights = [40, 55, 45, 65, 50, 70, 60, 75, 68, 80, 72, 85];

  return (
    <div className="relative z-10 p-3 md:p-4 space-y-3">
      {/* Mock header bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: `${theme.surface}`, border: `1px solid ${theme.border}40` }}
      >
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: `${theme.loss}60` }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "#fbbf2460" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: `${theme.win}60` }} />
        </div>
        <div className="flex-1 flex justify-center">
          <span style={{ color: theme.muted, fontSize: "9px" }}>stargate.app/dashboard</span>
        </div>
      </div>

      {/* Mock greeting */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: `${theme.surface}`, border: `1px solid ${theme.border}40` }}
      >
        <p style={{ color: theme.muted, fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          gm, trader
        </p>
        <p style={{ color: theme.accent, fontSize: "10px", fontStyle: "italic" }}>
          &ldquo;Discipline is the bridge between goals and accomplishment&rdquo;
        </p>
      </div>

      {/* Mock stat cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total P&L", value: "+$4,280", color: theme.win },
          { label: "Win Rate", value: "68%", color: theme.accent },
          { label: "Profit Factor", value: "2.4", color: theme.win },
          { label: "Trades", value: "47", color: theme.foreground },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg px-2 py-1.5"
            style={{ background: `${theme.surface}`, border: `1px solid ${theme.border}40` }}
          >
            <p style={{ color: theme.muted, fontSize: "7px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {s.label}
            </p>
            <p style={{ color: s.color, fontSize: "13px", fontWeight: 700 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Mock chart + streak */}
      <div className="grid grid-cols-3 gap-2">
        <div
          className="col-span-2 rounded-lg p-3 flex items-end gap-0.5"
          style={{
            background: `${theme.surface}`,
            border: `1px solid ${theme.border}40`,
            height: "80px",
          }}
        >
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                background: `${theme.accent}50`,
              }}
            />
          ))}
        </div>
        <div
          className="rounded-lg px-2 py-1.5 flex flex-col justify-between"
          style={{ background: `${theme.surface}`, border: `1px solid ${theme.border}40` }}
        >
          <p style={{ color: theme.muted, fontSize: "7px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Streak
          </p>
          <p style={{ color: theme.accent, fontSize: "16px", fontWeight: 700 }}>7 days</p>
          <p style={{ color: theme.muted, fontSize: "7px" }}>Keep it up!</p>
        </div>
      </div>
    </div>
  );
}

export function ThemeShowcase() {
  const [active, setActive] = useState(2); // Default to Space Purple

  const current = THEME_OPTIONS[active];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        {THEME_OPTIONS.map((theme, i) => {
          const isPro = PRO_THEME_IDS.includes(theme.id);
          return (
            <button
              key={theme.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 relative ${
                active === i
                  ? "bg-accent/15 border border-accent/40 text-foreground scale-105"
                  : "glass border border-border/50 text-muted hover:text-foreground hover:border-accent/20"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: theme.dot,
                  boxShadow: active === i ? `0 0 8px ${theme.dot}60` : "none",
                  border: theme.id === "light" || theme.id === "dark-simple" ? "1px solid #555" : "none",
                }}
              />
              {theme.label}
              {isPro && (
                <span className="text-[8px] font-bold uppercase tracking-wider bg-accent/15 text-accent px-1.5 py-0.5 rounded-full leading-none">
                  Pro
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Preview card with tilt */}
      <TiltCard>
        <div
          className="relative rounded-2xl overflow-hidden transition-colors duration-500"
          style={{
            background: current.bg,
            boxShadow: `0 2px 12px rgba(0,0,0,0.3), 0 0 60px ${current.accentGlow}`,
          }}
        >
          <ThemeBackground theme={current} />
          <MockDashboard theme={current} />
        </div>
      </TiltCard>
    </div>
  );
}
