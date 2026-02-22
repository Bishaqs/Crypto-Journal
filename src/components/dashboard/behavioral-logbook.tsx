"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BehavioralLog } from "@/lib/types";
import {
  BEHAVIORAL_EMOTIONS,
  EMOTION_TRIGGERS,
  PHYSICAL_STATES,
  BEHAVIORAL_BIASES,
} from "@/lib/validators";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";
import { Brain, ChevronDown, ChevronUp, Zap, Coffee, Sun } from "lucide-react";

const INTENSITY_LABELS = [
  { value: 1, label: "Barely" },
  { value: 2, label: "Mild" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Strong" },
  { value: 5, label: "Intense" },
];

const TRAFFIC_LIGHTS = [
  { value: "green" as const, label: "Good to trade", emoji: "🟢", icon: Zap, color: "bg-win/10 border-win/30 text-win" },
  { value: "yellow" as const, label: "Caution", emoji: "🟡", icon: Coffee, color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  { value: "red" as const, label: "Sit out", emoji: "🔴", icon: Sun, color: "bg-loss/10 border-loss/30 text-loss" },
];

export function BehavioralLogbook() {
  const [emotion, setEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState<string | null>(null);
  const [triggerDetail, setTriggerDetail] = useState("");
  const [physicalState, setPhysicalState] = useState<string[]>([]);
  const [biases, setBiases] = useState<string[]>([]);
  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red" | null>(null);
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<BehavioralLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const fetchEntries = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("behavioral_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setEntries((data as BehavioralLog[]) ?? []);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleLog() {
    if (!emotion || !trafficLight) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("behavioral_logs").insert({
      emotion,
      intensity,
      trigger,
      trigger_detail: triggerDetail.trim() || null,
      physical_state: physicalState,
      biases,
      traffic_light: trafficLight,
      note: note.trim() || null,
    });

    if (!error) {
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
      fetchEntries();
    }
    setSaving(false);
  }

  function toggleArray(arr: string[], item: string, setter: (val: string[]) => void) {
    setter(arr.includes(item) ? arr.filter((s) => s !== item) : [...arr, item]);
  }

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-accent" />
        <div>
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Emotion Check-In
          </h3>
          <p className="text-[9px] text-muted/60">
            Track what you feel, why, and your readiness to trade
          </p>
        </div>
        {justSaved && (
          <span className="text-[10px] text-win font-medium ml-auto animate-pulse">
            Logged!
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* 1. Emotion Grid */}
        <div>
          <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
            What are you feeling?
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {BEHAVIORAL_EMOTIONS.map((em) => {
              const config = EMOTION_CONFIG[em];
              const isSelected = emotion === em;
              return (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmotion(isSelected ? null : em)}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[9px] font-medium border transition-all ${
                    isSelected
                      ? `${config?.color ?? "bg-accent/10 border-accent/30 text-accent"} shadow-sm`
                      : "bg-background border-border text-muted hover:border-accent/20"
                  }`}
                >
                  <span className="text-sm">{config?.emoji ?? "❓"}</span>
                  <span className="leading-none">{em}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Intensity */}
        <div>
          <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
            Intensity <span className="text-foreground font-bold">{intensity}/5</span>
          </label>
          <div className="flex gap-1.5">
            {INTENSITY_LABELS.map((level) => (
              <button
                key={level.value}
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

        {/* 3. Trigger */}
        <div>
          <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
            What triggered this?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EMOTION_TRIGGERS.map((t) => (
              <button
                key={t}
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

        {/* 4. Physical State */}
        <div>
          <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
            Physical state
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PHYSICAL_STATES.map((state) => (
              <button
                key={state}
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

        {/* 5. Behavioral Biases */}
        <div>
          <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
            Biases active?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BEHAVIORAL_BIASES.map((bias) => (
              <button
                key={bias}
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

        {/* 6. Traffic Light */}
        <div>
          <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5">
            Am I fit to trade?
          </label>
          <div className="flex gap-2">
            {TRAFFIC_LIGHTS.map((light) => (
              <button
                key={light.value}
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

        {/* 7. Quick Note */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLog()}
          placeholder="Quick note (optional)..."
          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all"
        />

        {/* Log Button */}
        <button
          onClick={handleLog}
          disabled={!emotion || !trafficLight || saving}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
            emotion && trafficLight && !saving
              ? "bg-accent text-background hover:bg-accent-hover"
              : "bg-border text-muted cursor-not-allowed"
          }`}
        >
          {saving ? "Saving..." : justSaved ? "Logged!" : "Log Check-In"}
        </button>
      </div>

      {/* Recent Entries Toggle */}
      {entries.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowRecent(!showRecent)}
            className="flex items-center gap-1.5 text-[10px] text-muted hover:text-accent transition-colors w-full"
          >
            <span className="font-semibold uppercase tracking-wider">
              Recent ({entries.length})
            </span>
            {showRecent ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showRecent ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="mt-2 space-y-1.5">
              {entries.map((entry) => {
                const config = EMOTION_CONFIG[entry.emotion];
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface-hover/50 text-[11px]"
                  >
                    <span>{config?.emoji ?? "❓"}</span>
                    <span className="text-foreground font-medium">{entry.emotion}</span>
                    <span className="text-muted/30">|</span>
                    {/* Intensity dots */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < entry.intensity ? "bg-accent" : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    {entry.trigger && (
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] text-muted">
                        {entry.trigger}
                      </span>
                    )}
                    <span className="ml-auto">
                      {entry.traffic_light === "green"
                        ? "🟢"
                        : entry.traffic_light === "yellow"
                        ? "🟡"
                        : "🔴"}
                    </span>
                    <span className="text-muted/40 text-[9px]">
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
