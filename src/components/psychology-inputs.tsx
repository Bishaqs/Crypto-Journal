"use client";

import { EMOTIONS, SETUP_TYPES } from "@/lib/validators";

// Emotion icons mapped to each emotion for visual recognition
export const EMOTION_CONFIG: Record<string, { emoji: string; color: string }> = {
  Calm: { emoji: "😌", color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  Anxious: { emoji: "😰", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  Excited: { emoji: "🔥", color: "bg-orange-500/10 border-orange-500/30 text-orange-400" },
  Frustrated: { emoji: "😤", color: "bg-red-500/10 border-red-500/30 text-red-400" },
  FOMO: { emoji: "👀", color: "bg-purple-500/10 border-purple-500/30 text-purple-400" },
  Revenge: { emoji: "😡", color: "bg-red-600/10 border-red-600/30 text-red-500" },
  Bored: { emoji: "😴", color: "bg-gray-500/10 border-gray-500/30 text-gray-400" },
  Confident: { emoji: "💪", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  Greedy: { emoji: "🤑", color: "bg-yellow-600/10 border-yellow-600/30 text-yellow-500" },
  Fearful: { emoji: "😨", color: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" },
};

export function EmotionPicker({
  value,
  onChange,
  emotions = EMOTIONS,
  label = "How are you feeling?",
}: {
  value: string | null;
  onChange: (emotion: string | null) => void;
  emotions?: readonly string[];
  label?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {emotions.map((emotion) => {
          const config = EMOTION_CONFIG[emotion];
          const isSelected = value === emotion;
          return (
            <button
              key={emotion}
              type="button"
              onClick={() => onChange(isSelected ? null : emotion)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                isSelected
                  ? `${config.color} shadow-sm`
                  : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
              }`}
            >
              <span>{config.emoji}</span>
              {emotion}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ConfidenceSlider({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (confidence: number | null) => void;
}) {
  const displayValue = value ?? 5;

  return (
    <div>
      <label className="block text-xs text-muted mb-2">
        Confidence <span className="text-foreground font-semibold">{displayValue}/10</span>
      </label>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted">Low</span>
        <input
          type="range"
          min={1}
          max={10}
          value={displayValue}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,180,216,0.4)]
            [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-border"
        />
        <span className="text-xs text-muted">High</span>
      </div>
    </div>
  );
}

export function SetupTypePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (setupType: string | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-2">Setup Type</label>
      <div className="flex flex-wrap gap-2">
        {SETUP_TYPES.map((setup) => {
          const isSelected = value === setup;
          return (
            <button
              key={setup}
              type="button"
              onClick={() => onChange(isSelected ? null : setup)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                isSelected
                  ? "bg-accent/10 border-accent/30 text-accent shadow-sm"
                  : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
              }`}
            >
              {setup}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProcessScoreInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (score: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-2">
        Process Score — How well did you follow your rules?{" "}
        <span className="text-foreground font-semibold">{value ?? "—"}/10</span>
      </label>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isSelected = value !== null && n <= value;
          const color =
            n <= 3
              ? "bg-loss/20 border-loss/40 text-loss"
              : n <= 6
                ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                : "bg-win/20 border-win/40 text-win";

          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value === n ? null : n)}
              className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all duration-200 ${
                isSelected
                  ? color
                  : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
