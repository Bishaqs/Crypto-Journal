"use client";

import { useState } from "react";
import { EMOTIONS, JOURNAL_EMOTIONS, SETUP_TYPES, EMOTION_QUADRANTS, FLOW_STATES } from "@/lib/validators";
import type { EmotionQuadrant } from "@/lib/validators";
import type { FlowState } from "@/lib/types";
import { InfoTooltip } from "@/components/info-tooltip";

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
      <label className="block text-xs text-muted mb-2 flex items-center gap-1">
        {label}
        <InfoTooltip text="Every emotion you log gets correlated with your P&L. Over time, you'll see exactly which feelings cost you money and which give you an edge." />
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
      <label className="block text-xs text-muted mb-2 flex items-center gap-1">
        Confidence <span className="text-foreground font-semibold">{displayValue}/10</span>
        <InfoTooltip text="Confidence tracking reveals your calibration. Are you profitable when you feel confident? Or does overconfidence cost you?" />
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
  savedPresets = [],
  onSavePreset,
  onRemovePreset,
}: {
  value: string | null;
  onChange: (setupType: string | null) => void;
  savedPresets?: string[];
  onSavePreset?: (name: string) => void;
  onRemovePreset?: (name: string) => void;
}) {
  const isCustomPreset = value === "Custom" || (value !== null && !SETUP_TYPES.includes(value as typeof SETUP_TYPES[number]) && !savedPresets.includes(value));
  const customText = isCustomPreset && value !== "Custom" ? value : "";

  return (
    <div>
      <label className="block text-xs text-muted mb-2 flex items-center gap-1">
        Setup Type
        <InfoTooltip text="Categorizing setups lets your dashboard rank which patterns actually make you money vs which ones you just think work." />
      </label>
      <div className="flex flex-wrap gap-2">
        {SETUP_TYPES.map((setup) => {
          const isSelected = setup === "Custom" ? isCustomPreset : value === setup;
          return (
            <button
              key={setup}
              type="button"
              onClick={() => {
                if (setup === "Custom") {
                  onChange(isCustomPreset ? null : "Custom");
                } else {
                  onChange(isSelected ? null : setup);
                }
              }}
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
        {savedPresets.map((preset) => {
          const isSelected = value === preset;
          return (
            <button
              key={`saved-${preset}`}
              type="button"
              onClick={() => onChange(isSelected ? null : preset)}
              className={`group flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                isSelected
                  ? "bg-accent/10 border-accent/30 text-accent shadow-sm"
                  : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
              }`}
            >
              {preset}
              {onRemovePreset && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePreset(preset);
                    if (value === preset) onChange(null);
                  }}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-opacity cursor-pointer"
                >
                  x
                </span>
              )}
            </button>
          );
        })}
      </div>
      {isCustomPreset && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => onChange(e.target.value || "Custom")}
            placeholder="Name your setup..."
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border/40 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors placeholder-muted-foreground/50"
          />
          {onSavePreset && customText && (
            <button
              type="button"
              onClick={() => onSavePreset(customText)}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-accent/30 text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
            >
              Save
            </button>
          )}
        </div>
      )}
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
      <label className="block text-xs text-muted mb-2 flex items-center gap-1 flex-wrap">
        Process Score — How well did you follow your rules?{" "}
        <span className="text-foreground font-semibold">{value ?? "—"}/10</span>
        <InfoTooltip text="Process > P&L. A high-process loss is a good trade (variance). A low-process win is dangerous (luck). This is the #1 metric for growth." />
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

// ─── Emotion Quadrant Picker (Simple Tier) ──────────────────────────────────

const QUADRANT_STYLES: Record<EmotionQuadrant, { bg: string; border: string; text: string; activeBg: string }> = {
  danger: { bg: "bg-red-500/5", border: "border-red-500/20", text: "text-red-400", activeBg: "bg-red-500/15" },
  caution: { bg: "bg-yellow-500/5", border: "border-yellow-500/20", text: "text-yellow-400", activeBg: "bg-yellow-500/15" },
  edge: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-400", activeBg: "bg-emerald-500/15" },
  baseline: { bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-400", activeBg: "bg-blue-500/15" },
};

function getQuadrantForEmotion(emotion: string): EmotionQuadrant | null {
  for (const [key, q] of Object.entries(EMOTION_QUADRANTS)) {
    if ((q.emotions as readonly string[]).includes(emotion)) return key as EmotionQuadrant;
  }
  return null;
}

export function EmotionQuadrantPicker({
  value,
  onChange,
  label = "How are you feeling?",
}: {
  value: string | null;
  onChange: (emotion: string | null) => void;
  label?: string;
}) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<EmotionQuadrant | null>(
    value ? getQuadrantForEmotion(value) : null
  );
  const [drillDown, setDrillDown] = useState(false);

  function handleQuadrantClick(quadrant: EmotionQuadrant) {
    if (selectedQuadrant === quadrant) {
      // Toggle off
      setSelectedQuadrant(null);
      setDrillDown(false);
      onChange(null);
      return;
    }
    setSelectedQuadrant(quadrant);
    // Auto-select the first emotion in the quadrant as default
    const firstEmotion = EMOTION_QUADRANTS[quadrant].emotions[0];
    onChange(firstEmotion);
    setDrillDown(false);
  }

  function handleEmotionClick(emotion: string) {
    onChange(value === emotion ? null : emotion);
  }

  return (
    <div>
      <label className="block text-xs text-muted mb-2 flex items-center gap-1">
        {label}
        <InfoTooltip text="Pre-trade emotion is the strongest predictor of trade outcome after setup quality. Log it to build your personal emotion-P&L map." />
      </label>

      {/* Quadrant grid */}
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(EMOTION_QUADRANTS) as [EmotionQuadrant, typeof EMOTION_QUADRANTS[EmotionQuadrant]][]).map(
          ([key, q]) => {
            const styles = QUADRANT_STYLES[key];
            const isActive = selectedQuadrant === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleQuadrantClick(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left ${
                  isActive
                    ? `${styles.activeBg} ${styles.border} ${styles.text} shadow-sm`
                    : `${styles.bg} border-border/30 text-muted hover:${styles.border} hover:${styles.text}`
                }`}
              >
                <span className="text-lg">{q.emoji}</span>
                <div>
                  <div className="text-xs font-semibold">{q.label}</div>
                  <div className="text-[10px] opacity-70">{q.description.split(" — ")[0]}</div>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* Selected emotion display + drill-down toggle */}
      {selectedQuadrant && value && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted">Selected:</span>
          <span className="text-xs font-medium text-foreground">
            {EMOTION_CONFIG[value]?.emoji} {value}
          </span>
          <button
            type="button"
            onClick={() => setDrillDown(!drillDown)}
            className="text-[10px] text-accent hover:text-accent/80 transition-colors ml-auto"
          >
            {drillDown ? "Hide options" : "Be more specific"}
          </button>
        </div>
      )}

      {/* Drill-down: specific emotions within the selected quadrant */}
      {selectedQuadrant && drillDown && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EMOTION_QUADRANTS[selectedQuadrant].emotions.map((emotion) => {
            const config = EMOTION_CONFIG[emotion] ?? { emoji: "❓", color: "" };
            const isSelected = value === emotion;
            return (
              <button
                key={emotion}
                type="button"
                onClick={() => handleEmotionClick(emotion)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
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
      )}
    </div>
  );
}

// ─── Flow State Input (Expert Tier) ─────────────────────────────────────────

export function FlowStateInput({
  value,
  onChange,
}: {
  value: FlowState | null;
  onChange: (state: FlowState | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-2 flex items-center gap-1">
        Session Flow — How does trading feel right now?
        <InfoTooltip text="Flow state = your best trading. By tracking when you hit flow, your AI identifies the conditions that produce your peak performance." />
      </label>
      <div className="flex gap-1">
        {FLOW_STATES.map((fs) => {
          const isSelected = value === fs.id;
          return (
            <button
              key={fs.id}
              type="button"
              onClick={() => onChange(isSelected ? null : fs.id as FlowState)}
              title={fs.description}
              className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-[10px] font-medium border transition-all duration-200 ${
                isSelected
                  ? "bg-accent/15 border-accent/30 text-accent shadow-sm"
                  : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
              }`}
            >
              <span className="text-sm">{fs.emoji}</span>
              <span>{fs.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
