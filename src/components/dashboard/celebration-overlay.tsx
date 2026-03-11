"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Trophy, ArrowUp, Flame, Star, Target } from "lucide-react";
import { useLevel } from "@/lib/xp";
import { useAchievements, ACHIEVEMENT_MAP, TIER_META } from "@/lib/achievements";
import { useChallenges, CHALLENGE_MAP } from "@/lib/challenges";
import { useTour } from "@/lib/tour-context";
import { isTourComplete } from "@/lib/onboarding";
import type { AchievementTier } from "@/lib/achievements";

// ── Particle System ─────────────────────────────────────────────────

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  shape: "circle" | "star" | "square";
  life: number;
};

function ParticleCanvas({ active, color = "accent" }: { active: boolean; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const idCounter = useRef(0);

  const COLORS_MAP: Record<string, string[]> = {
    accent: ["#a855f7", "#8b5cf6", "#c084fc", "#e9d5ff", "#f3e8ff"],
    gold: ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7", "#d97706"],
    fire: ["#ef4444", "#f97316", "#fbbf24", "#dc2626", "#f59e0b"],
    rainbow: ["#ef4444", "#f97316", "#fbbf24", "#22c55e", "#3b82f6", "#8b5cf6"],
  };

  const colors = COLORS_MAP[color] ?? COLORS_MAP.accent;

  const spawnBurst = useCallback(
    (count: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2 + Math.random() * 6;
        const shapes: Particle["shape"][] = ["circle", "star", "square"];

        particlesRef.current.push({
          id: idCounter.current++,
          x: centerX + (Math.random() - 0.5) * 100,
          y: centerY + (Math.random() - 0.5) * 100,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 3 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 1,
          rotation: Math.random() * 360,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          life: 60 + Math.random() * 40,
        });
      }
    },
    [colors]
  );

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initial burst
    spawnBurst(60);

    // Secondary burst
    const timer = setTimeout(() => spawnBurst(30), 300);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.vx *= 0.99; // drag
        p.rotation += p.vx * 2;
        p.life--;
        p.opacity = Math.max(0, p.life / 60);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          // Star shape
          const spikes = 5;
          const outerR = p.size;
          const innerR = p.size * 0.4;
          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const a = (Math.PI * i) / spikes - Math.PI / 2;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
        return p.life > 0;
      });

      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(timer);
      particlesRef.current = [];
    };
  }, [active, spawnBurst]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[300] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

// ── Level Up Celebration ────────────────────────────────────────────

function LevelUpCelebration() {
  const { recentLevelUp, dismissLevelUp } = useLevel();
  const [visible, setVisible] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (recentLevelUp !== null) {
      setVisible(true);
      setShowParticles(true);

      const hideTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          dismissLevelUp();
          setShowParticles(false);
        }, 500);
      }, 4000);

      return () => clearTimeout(hideTimer);
    }
  }, [recentLevelUp, dismissLevelUp]);

  if (recentLevelUp === null) return null;

  return (
    <>
      <ParticleCanvas active={showParticles} color="gold" />
      <div
        className={`fixed inset-0 z-[290] flex items-center justify-center pointer-events-none transition-all duration-500 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Backdrop glow */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Level card */}
        <div
          className={`relative z-10 text-center transition-all duration-500 ${
            visible
              ? "scale-100 translate-y-0"
              : "scale-75 translate-y-8"
          }`}
        >
          {/* Glow ring */}
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-accent/30 blur-3xl animate-pulse scale-150" />
            <div className="relative w-28 h-28 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto mb-4">
              <ArrowUp
                size={48}
                className="text-accent animate-bounce"
              />
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-1">
            Level Up!
          </p>
          <p className="text-5xl font-black text-foreground">
            {recentLevelUp}
          </p>
          <div className="mt-2 h-0.5 w-16 bg-accent/50 mx-auto rounded-full" />
        </div>
      </div>
    </>
  );
}

// ── Challenge Complete Toast ────────────────────────────────────────

function ChallengeCompleteToast() {
  const { recentCompletion, dismissCompletion } = useChallenges();
  const { state: tourState } = useTour();
  const [visible, setVisible] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (recentCompletion) {
      // Suppress during active tour OR if welcome tour hasn't been completed yet
      // (synchronous localStorage check avoids timing issues with reactive state)
      if (tourState.isActive || !isTourComplete("welcome")) {
        dismissCompletion();
        return;
      }

      setVisible(true);
      setShowParticles(true);

      const hideTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          dismissCompletion();
          setShowParticles(false);
        }, 300);
      }, 3000);

      return () => clearTimeout(hideTimer);
    }
  }, [recentCompletion, dismissCompletion, tourState.isActive]);

  if (!recentCompletion) return null;

  const challenge = CHALLENGE_MAP[recentCompletion];
  if (!challenge) return null;

  return (
    <>
      <ParticleCanvas active={showParticles} color="accent" />
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[260] transition-all duration-300 ${
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95"
        }`}
      >
        <div
          className="glass rounded-2xl border border-accent/40 px-6 py-4 flex items-center gap-4"
          style={{
            boxShadow:
              "0 0 30px var(--accent-glow), 0 0 60px var(--accent-glow), var(--shadow-card)",
          }}
        >
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <Target size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-accent uppercase tracking-widest">
              Challenge Complete!
            </p>
            <p className="text-sm font-bold text-foreground">
              {challenge.emoji} {challenge.title}
            </p>
            <p className="text-[10px] font-bold text-accent mt-0.5">
              +{challenge.xpReward} XP
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Combined Celebration Overlay ─────────────────────────────────────

export function CelebrationOverlay() {
  return (
    <>
      <LevelUpCelebration />
      <ChallengeCompleteToast />
    </>
  );
}
