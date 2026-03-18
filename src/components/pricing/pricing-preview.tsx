"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, TrendingUp, Target, BarChart3 } from "lucide-react";

const SCENE_COUNT = 4;
const SCENE_INTERVAL = 5000;

const SCENE_LABELS = [
  { label: "Calendar", icon: CalendarDays },
  { label: "Equity", icon: TrendingUp },
  { label: "Win Rate", icon: Target },
  { label: "Stats", icon: BarChart3 },
];

export function PricingPreview() {
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSceneIndex(i => (i + 1) % SCENE_COUNT);
    }, SCENE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-center gap-4">
      {/* Preview card */}
      <div className="w-full max-w-[380px] glass border border-border/50 rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-loss/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-win/60" />
          </div>
          <span className="text-[10px] text-muted/60 font-medium ml-1">Traverse Dashboard</span>
        </div>

        {/* Scene viewport */}
        <div className="h-[280px] relative p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={sceneIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-5"
            >
              {sceneIndex === 0 && <SceneCalendar />}
              {sceneIndex === 1 && <SceneEquityCurve />}
              {sceneIndex === 2 && <SceneWinRate />}
              {sceneIndex === 3 && <SceneStats />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2">
        {SCENE_LABELS.map((scene, i) => (
          <button
            key={i}
            onClick={() => setSceneIndex(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${
              sceneIndex === i
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-muted/50 hover:text-muted border border-transparent"
            }`}
          >
            <scene.icon size={10} />
            {scene.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Scene 1: Calendar Heatmap ─────────────────── */

const CALENDAR_DATA = [
  [1,0,1,1,-1,0,1], [1,1,-1,0,1,1,0], [-1,1,1,1,0,-1,1],
  [0,1,-1,1,1,0,1], [1,0,1,-1,1,1,0],
]; // 1=win, -1=loss, 0=flat

function SceneCalendar() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground">Calendar Heatmap</h3>
        <span className="text-[10px] text-muted">March 2026</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="text-[8px] text-muted/40 text-center font-medium">{d}</div>
          ))}
        </div>
        {CALENDAR_DATA.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((day, di) => (
              <motion.div
                key={di}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: wi * 0.08 + di * 0.03, type: "spring", stiffness: 400 }}
                className={`aspect-square rounded-lg ${
                  day === 1 ? "bg-win/30" : day === -1 ? "bg-loss/30" : "bg-border/30"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 mt-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-win/30" />
          <span className="text-[8px] text-muted/50">Profit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-loss/30" />
          <span className="text-[8px] text-muted/50">Loss</span>
        </div>
      </div>
    </div>
  );
}

/* ── Scene 2: Equity Curve ─────────────────────── */

const EQUITY_POINTS = "M0,180 C20,170 40,160 60,140 S100,150 120,130 S160,100 180,90 S220,110 240,80 S280,50 300,40 S320,30 340,25";

function SceneEquityCurve() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground">Equity Curve</h3>
        <div className="text-right">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-bold text-win"
          >
            +$12,847
          </motion.span>
          <p className="text-[9px] text-muted">All time</p>
        </div>
      </div>
      <div className="flex-1 relative">
        <svg viewBox="0 0 340 200" className="w-full h-full" preserveAspectRatio="none">
          {/* Gradient fill */}
          <defs>
            <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-win)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--color-win)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[50, 100, 150].map(y => (
            <line key={y} x1="0" y1={y} x2="340" y2={y} stroke="currentColor" strokeOpacity="0.05" />
          ))}
          {/* Fill area */}
          <motion.path
            d={`${EQUITY_POINTS} L340,200 L0,200 Z`}
            fill="url(#equity-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          />
          {/* Line */}
          <motion.path
            d={EQUITY_POINTS}
            fill="none"
            stroke="var(--color-win)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      </div>
    </div>
  );
}

/* ── Scene 3: Win Rate Gauge ───────────────────── */

function SceneWinRate() {
  const winRate = 68;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (winRate / 100) * circumference;

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <h3 className="text-xs font-semibold text-foreground mb-4">Win Rate</h3>
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="10"
          />
          {/* Animated arc */}
          <motion.circle
            cx="80" cy="80" r={radius}
            fill="none" stroke="var(--color-accent)" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - arcLength }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            transform="rotate(-90 80 80)"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <CountUp target={winRate} suffix="%" className="text-2xl font-bold text-foreground" />
          <span className="text-[10px] text-muted">Win Rate</span>
        </div>
      </div>
      {/* Win/Loss counts */}
      <div className="flex items-center gap-6 mt-4">
        <div className="text-center">
          <CountUp target={47} className="text-sm font-bold text-win" />
          <p className="text-[9px] text-muted">Wins</p>
        </div>
        <div className="text-center">
          <CountUp target={22} className="text-sm font-bold text-loss" />
          <p className="text-[9px] text-muted">Losses</p>
        </div>
      </div>
    </div>
  );
}

/* ── Scene 4: Stats Cards ──────────────────────── */

const STATS = [
  { label: "Profit Factor", value: 2.4, prefix: "", suffix: "", color: "text-win" },
  { label: "Avg Win", value: 342, prefix: "$", suffix: "", color: "text-win" },
  { label: "Max Drawdown", value: 4.2, prefix: "", suffix: "%", color: "text-loss" },
  { label: "Trades", value: 69, prefix: "", suffix: "", color: "text-accent" },
];

function SceneStats() {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-semibold text-foreground mb-4">Performance Stats</h3>
      <div className="flex-1 grid grid-cols-2 gap-3">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, type: "spring", stiffness: 300 }}
            className="glass border border-border/50 rounded-xl p-4 flex flex-col justify-center"
          >
            <CountUp
              target={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              className={`text-xl font-bold ${stat.color}`}
              decimals={stat.value % 1 !== 0 ? 1 : 0}
            />
            <p className="text-[9px] text-muted mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── CountUp utility ───────────────────────────── */

function CountUp({
  target,
  prefix = "",
  suffix = "",
  className = "",
  decimals = 0,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <span className={className}>
      {prefix}{decimals > 0 ? value.toFixed(decimals) : Math.round(value)}{suffix}
    </span>
  );
}
