"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BehavioralLog } from "@/lib/types";
import { EMOTION_TRIGGERS, PHYSICAL_STATES, BEHAVIORAL_BIASES } from "@/lib/validators";
import { EmotionPicker, EMOTION_CONFIG } from "@/components/psychology-inputs";
import { ChevronDown, ChevronUp, Zap, Coffee, Sun } from "lucide-react";

const INTENSITY_LABELS = [
  { value: 1, label: "Barely" },
  { value: 2, label: "Mild" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Strong" },
  { value: 5, label: "Intense" },
];

const TRAFFIC_LIGHTS = [
  { value: "green" as const, label: "Good to trade", emoji: "\uD83D\uDFE2", icon: Zap, color: "bg-win/10 border-win/30 text-win" },
  { value: "yellow" as const, label: "Caution", emoji: "\uD83D\uDFE1", icon: Coffee, color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  { value: "red" as const, label: "Sit out", emoji: "\uD83D\uDD34", icon: Sun, color: "bg-loss/10 border-loss/30 text-loss" },
];

type EmotionCheckInProps = {
  mode?: "simple" | "advanced" | "auto";
  context?: "standalone" | "trade" | "journal";
  onComplete?: (log: BehavioralLog) => void;
  embedded?: boolean;
};

export function EmotionCheckIn({
  mode = "auto",
  context = "standalone",
  onComplete,
  embedded = false,
}: EmotionCheckInProps) {
  const [emotion, setEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState<string | null>(null);
  const [triggerDetail, setTriggerDetail] = useState("");
  const [physicalState, setPhysicalState] = useState<string[]>([]);
  const [biases, setBiases] = useState<string[]>([]);
  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red" | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(mode === "advanced");
  const [error, setError] = useState<string | null>(null);

  const contextLabels = {
    standalone: { emotion: "How are you feeling?", traffic: "Am I fit to trade?", button: "Log Check-In" },
    trade: { emotion: "Pre-trade mindset", traffic: "Ready to trade?", button: "Save Mindset" },
    journal: { emotion: "Current emotional state", traffic: "Trading fitness", button: "Log State" },
  };
  const labels = contextLabels[context];

  function toggleArray(arr: string[], item: string, setter: (val: string[]) => void) {
    setter(arr.includes(item) ? arr.filter((s) => s !== item) : [...arr, item]);
  }

  async function handleSubmit() {
    if (!emotion || !trafficLight) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const payload = {
        emotion,
        intensity: showAdvanced ? intensity : 3,
        trigger: showAdvanced ? trigger : null,
        trigger_detail: showAdvanced && triggerDetail.trim() ? triggerDetail.trim() : null,
        physical_state: showAdvanced ? physicalState : [],
        biases: showAdvanced ? biases : [],
        traffic_light: trafficLight,
        note: note.trim() || null,
      };

      const { data, error: dbError } = await supabase
        .from("behavioral_logs")
        .insert(payload)
        .select()
        .single();

      if (dbError) {
        setError(dbError.message);
        return;
      }

      // Reset form
      setEmotion(null);
      setIntensity(3);
      setTrigger(null);
      setTriggerDetail("");
      setPhysicalState([]);
      setBiases([]);
      setTrafficLight(null);
      setNote("");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);

      if (onComplete && data) {
        onComplete(data as BehavioralLog);
      }
    } catch {
      setError("Failed to save check-in");
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <div className="space-y-4">
      {/* Emotion picker (tiered: simple → advanced) */}
      <EmotionPicker
        value={emotion}
        onChange={setEmotion}
        label={labels.emotion}
      />

      {/* Traffic Light — always visible */}
      <div>
        <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
          {labels.traffic}
        </label>
        <div className="flex gap-2">
          {TRAFFIC_LIGHTS.map((light) => (
            <button
              key={light.value}
              type="button"
              onClick={() => setTrafficLight(light.value)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-medium border transition-all text-center ${
                trafficLight === light.value
                  ? light.color
                  : "bg-background border-border text-muted hover:border-accent/20"
              }`}
            >
              {light.emoji} {light.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced toggle (auto mode only) */}
      {mode === "auto" && !showAdvanced && (
        <button
          type="button"
          onClick={() => setShowAdvanced(true)}
          className="flex items-center gap-1.5 text-[10px] text-accent/70 hover:text-accent transition-colors w-full"
        >
          <ChevronDown size={12} />
          Add more detail
        </button>
      )}

      {/* Advanced fields */}
      {showAdvanced && (
        <>
          {mode === "auto" && (
            <button
              type="button"
              onClick={() => setShowAdvanced(false)}
              className="flex items-center gap-1.5 text-[10px] text-accent/70 hover:text-accent transition-colors w-full"
            >
              <ChevronUp size={12} />
              Less detail
            </button>
          )}

          {/* Intensity */}
          <div>
            <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
              Intensity <span className="text-foreground font-bold">{intensity}/5</span>
            </label>
            <div className="flex gap-1.5">
              {INTENSITY_LABELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setIntensity(level.value)}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-medium border transition-all ${
                    intensity === level.value
                      ? "bg-accent/15 border-accent/40 text-accent"
                      : "bg-background border-border text-muted hover:border-accent/20"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
              What triggered this?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTION_TRIGGERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrigger(trigger === t ? null : t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    trigger === t
                      ? "bg-accent/15 border-accent/40 text-accent"
                      : "bg-background border-border text-muted hover:border-accent/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {trigger === "Other" && (
              <input
                type="text"
                value={triggerDetail}
                onChange={(e) => setTriggerDetail(e.target.value)}
                placeholder="What triggered it?"
                className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all"
              />
            )}
          </div>

          {/* Physical State */}
          <div>
            <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
              Physical state
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PHYSICAL_STATES.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => toggleArray(physicalState, state, setPhysicalState)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    physicalState.includes(state)
                      ? "bg-accent/15 border-accent/40 text-accent"
                      : "bg-background border-border text-muted hover:border-accent/20"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          {/* Behavioral Biases */}
          <div>
            <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
              Biases active?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BEHAVIORAL_BIASES.map((bias) => (
                <button
                  key={bias}
                  type="button"
                  onClick={() => toggleArray(biases, bias, setBiases)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    biases.includes(bias)
                      ? "bg-loss/10 border-loss/30 text-loss"
                      : "bg-background border-border text-muted hover:border-accent/20"
                  }`}
                >
                  {bias}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Quick Note — always visible */}
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Quick note (optional)..."
        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all"
      />

      {/* Error */}
      {error && (
        <p className="text-[11px] text-loss">{error}</p>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!emotion || !trafficLight || saving}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
          emotion && trafficLight && !saving
            ? "bg-accent text-background hover:bg-accent-hover"
            : "bg-border text-muted cursor-not-allowed"
        }`}
      >
        {saving ? "Saving..." : justSaved ? "Logged!" : labels.button}
      </button>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      {content}
    </div>
  );
}
