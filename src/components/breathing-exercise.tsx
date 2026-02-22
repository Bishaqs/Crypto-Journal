"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Wind, Timer, Play, Pause } from "lucide-react";

type Phase = "inhale" | "hold-in" | "exhale" | "hold-out";

const PHASES: { phase: Phase; label: string; duration: number }[] = [
  { phase: "inhale", label: "Breathe in", duration: 4 },
  { phase: "hold-in", label: "Hold", duration: 4 },
  { phase: "exhale", label: "Breathe out", duration: 4 },
  { phase: "hold-out", label: "Hold", duration: 4 },
];

const DURATIONS = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
];

export function BreathingExercise({
  onClose,
  coolOffMode = false,
  coolOffMinutes = 5,
}: {
  onClose: () => void;
  coolOffMode?: boolean;
  coolOffMinutes?: number;
}) {
  const [isActive, setIsActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(120);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [coolOffRemaining, setCoolOffRemaining] = useState(
    coolOffMode ? coolOffMinutes * 60 : 0
  );

  const currentPhase = PHASES[phaseIndex];
  const phaseProgress = phaseTimer / currentPhase.duration;

  // Circle size based on phase
  const circleScale =
    currentPhase.phase === "inhale"
      ? 0.6 + 0.4 * phaseProgress
      : currentPhase.phase === "exhale"
        ? 1.0 - 0.4 * phaseProgress
        : currentPhase.phase === "hold-in"
          ? 1.0
          : 0.6;

  const startExercise = useCallback(() => {
    setIsActive(true);
    setTimeRemaining(selectedDuration);
    setPhaseIndex(0);
    setPhaseTimer(0);
    setCycles(0);
  }, [selectedDuration]);

  // Main timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          setIsActive(false);
          return 0;
        }
        return t - 1;
      });

      setPhaseTimer((pt) => {
        if (pt >= currentPhase.duration - 1) {
          setPhaseIndex((pi) => {
            const next = (pi + 1) % PHASES.length;
            if (next === 0) setCycles((c) => c + 1);
            return next;
          });
          return 0;
        }
        return pt + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, currentPhase.duration]);

  // Cool-off countdown
  useEffect(() => {
    if (!coolOffMode || coolOffRemaining <= 0) return;
    const interval = setInterval(() => {
      setCoolOffRemaining((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [coolOffMode, coolOffRemaining]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const canDismissCoolOff = !coolOffMode || coolOffRemaining <= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-border bg-background p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wind size={18} className="text-accent" />
            <h2 className="font-bold text-foreground">
              {coolOffMode ? "Cool-Off Period" : "Breathing Exercise"}
            </h2>
          </div>
          {canDismissCoolOff && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {coolOffMode && coolOffRemaining > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-loss/10 border border-loss/20">
            <div className="flex items-center gap-2 mb-1">
              <Timer size={14} className="text-loss" />
              <span className="text-sm font-medium text-loss">
                Cool-off: {formatTime(coolOffRemaining)}
              </span>
            </div>
            <p className="text-xs text-muted">
              Take a break. Your next trade can wait. Use this time to breathe
              and reset.
            </p>
          </div>
        )}

        {/* Breathing circle */}
        {isActive ? (
          <div className="flex flex-col items-center py-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Outer ring */}
              <div
                className="absolute rounded-full border-2 border-accent/20 transition-all duration-1000 ease-in-out"
                style={{
                  width: `${circleScale * 100}%`,
                  height: `${circleScale * 100}%`,
                }}
              />
              {/* Inner glow */}
              <div
                className="absolute rounded-full bg-accent/10 transition-all duration-1000 ease-in-out"
                style={{
                  width: `${circleScale * 85}%`,
                  height: `${circleScale * 85}%`,
                  boxShadow: `0 0 ${30 * circleScale}px ${15 * circleScale}px rgba(139,92,246,${0.1 * circleScale})`,
                }}
              />
              {/* Center text */}
              <div className="relative text-center z-10">
                <p className="text-lg font-semibold text-accent">
                  {currentPhase.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {currentPhase.duration - Math.floor(phaseTimer)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6 text-xs text-muted">
              <span>Cycles: {cycles}</span>
              <span>Remaining: {formatTime(timeRemaining)}</span>
            </div>

            <button
              onClick={() => setIsActive(false)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-sm text-muted hover:text-foreground transition-colors"
            >
              <Pause size={14} /> Pause
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            {timeRemaining > 0 && cycles > 0 ? (
              <>
                <div className="text-center mb-6">
                  <p className="text-2xl font-bold text-win mb-1">
                    Well done
                  </p>
                  <p className="text-sm text-muted">
                    {cycles} breathing cycles completed
                  </p>
                </div>
                <button
                  onClick={startExercise}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-background font-medium hover:bg-accent-hover transition-colors"
                >
                  <Play size={16} /> Go Again
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted mb-4 text-center">
                  Box breathing: 4 seconds each — inhale, hold, exhale, hold.
                  <br />
                  <span className="text-xs">
                    Proven to reduce cortisol and improve decision-making.
                  </span>
                </p>

                {/* Duration selector */}
                <div className="flex items-center gap-2 mb-6">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.seconds}
                      onClick={() => setSelectedDuration(d.seconds)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedDuration === d.seconds
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={startExercise}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-background font-semibold hover:bg-accent-hover transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  <Play size={16} /> Start Breathing
                </button>
              </>
            )}
          </div>
        )}

        {/* Cool-off ready button */}
        {coolOffMode && coolOffRemaining <= 0 && (
          <button
            onClick={onClose}
            className="w-full mt-4 py-2.5 rounded-xl bg-win/10 text-win font-medium text-sm border border-win/20 hover:bg-win/20 transition-colors"
          >
            I&apos;m ready to trade
          </button>
        )}
      </div>
    </div>
  );
}
