"use client";

import { EMOTIONS, JOURNAL_EMOTIONS, SETUP_TYPES } from "@/lib/validators";

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
  Disciplined: { emoji: "🎯", color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" },
  Relieved: { emoji: "😮‍💨", color: "bg-teal-500/10 border-teal-500/30 text-teal-400" },
  Hopeful: { emoji: "🌟", color: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
  Impatient: { emoji: "⏰", color: "bg-orange-600/10 border-orange-600/30 text-orange-500" },
  Regretful: { emoji: "😔", color: "bg-slate-500/10 border-slate-500/30 text-slate-400" },
  Overconfident: { emoji: "🦚", color: "bg-pink-500/10 border-pink-500/30 text-pink-400" },
  Confused: { emoji: "🤔", color: "bg-violet-500/10 border-violet-500/30 text-violet-400" },
  Indifferent: { emoji: "😐", color: "bg-zinc-500/10 border-zinc-500/30 text-zinc-400" },
};

type EmotionPickerSingleProps = {
  mode?: "single";
  value: string | null;
  onChange: (emotion: string | null) => void;
  emotions?: readonly string[];
  label?: string;
  showCustomInput?: never;
  customText?: never;
  onCustomTextChange?: never;
};

type EmotionPickerMultiProps = {
  mode: "multi";
  value: string[];
  onChange: (emotions: string[]) => void;
  emotions?: readonly string[];
  label?: string;
  showCustomInput?: boolean;
  customText?: string;
  onCustomTextChange?: (text: string) => void;
};

type EmotionPickerProps = EmotionPickerSingleProps | EmotionPickerMultiProps;

export function EmotionPicker(props: EmotionPickerProps) {
  const {
    label = "How are you feeling?",
    mode = "single",
  } = props;
  const emotions = props.emotions ?? (mode === "multi" ? JOURNAL_EMOTIONS : EMOTIONS);

  function isSelected(emotion: string): boolean {
    if (mode === "multi") {
      return (props as EmotionPickerMultiProps).value.includes(emotion);
    }
    return (props as EmotionPickerSingleProps).value === emotion;
  }

  function handleClick(emotion: string) {
    if (mode === "multi") {
      const mp = props as EmotionPickerMultiProps;
      const next = mp.value.includes(emotion)
        ? mp.value.filter((e) => e !== emotion)
        : [...mp.value, emotion];
      mp.onChange(next);
    } else {
      const sp = props as EmotionPickerSingleProps;
      sp.onChange(sp.value === emotion ? null : emotion);
    }
  }

  return (
    <div>
      <label className="block text-xs text-muted mb-2">
        {label}
        {mode === "multi" && (
          <span className="text-muted/50 ml-1">(select all that apply)</span>
        )}
      </label>
      <div className="flex flex-wrap gap-2">
        {emotions.map((emotion) => {
          const config = EMOTION_CONFIG[emotion] ?? { emoji: "❓", color: "bg-accent/10 border-accent/30 text-accent" };
          const selected = isSelected(emotion);
          return (
            <button
              key={emotion}
              type="button"
              onClick={() => handleClick(emotion)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                selected
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
      {mode === "multi" && (props as EmotionPickerMultiProps).showCustomInput && (
        <div className="mt-3">
          <label className="block text-xs text-muted mb-1.5">
            Describe your emotional state
          </label>
          <input
            type="text"
            value={(props as EmotionPickerMultiProps).customText ?? ""}
            onChange={(e) => (props as EmotionPickerMultiProps).onCustomTextChange?.(e.target.value)}
            placeholder="In your own words..."
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
          />
        </div>
      )}
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
