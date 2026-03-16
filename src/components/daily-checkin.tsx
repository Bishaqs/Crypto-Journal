"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Sun, Coffee, Zap } from "lucide-react";
import { isTourComplete } from "@/lib/onboarding";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { InfoTooltip } from "@/components/info-tooltip";

const MOOD_LEVELS = [
  { value: 1, emoji: "😞", label: "Awful" },
  { value: 2, emoji: "😔", label: "Low" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🔥", label: "Great" },
];

const ENERGY_LEVELS = [
  { value: 1, emoji: "🪫", label: "Drained" },
  { value: 2, emoji: "😴", label: "Tired" },
  { value: 3, emoji: "⚡", label: "Normal" },
  { value: 4, emoji: "💪", label: "Energized" },
  { value: 5, emoji: "🚀", label: "Peak" },
];

const TRAFFIC_LIGHTS = [
  { value: "green" as const, color: "bg-win/10 border-win/30 text-win", label: "Green light — ready to trade", icon: Zap },
  { value: "yellow" as const, color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400", label: "Caution — trade smaller", icon: Coffee },
  { value: "red" as const, color: "bg-loss/10 border-loss/30 text-loss", label: "Sit out today", icon: Sun },
];

const SLEEP_LEVELS = [
  { value: 1, emoji: "😵", label: "Terrible" },
  { value: 2, emoji: "😴", label: "Poor" },
  { value: 3, emoji: "😐", label: "OK" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🌟", label: "Great" },
];

const COGNITIVE_LOAD_LEVELS = [
  { value: 1, emoji: "🧘", label: "Clear" },
  { value: 2, emoji: "💭", label: "Light" },
  { value: 3, emoji: "🤔", label: "Moderate" },
  { value: 4, emoji: "🧠", label: "Heavy" },
  { value: 5, emoji: "🤯", label: "Overloaded" },
];

export function DailyCheckin() {
  const { isAdvanced } = usePsychologyTier();
  const [show, setShow] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [focus, setFocus] = useState("");
  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red" | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [cognitiveLoad, setCognitiveLoad] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState("");
  const [intention, setIntention] = useState("");
  const [saving, setSaving] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const supabase = createClient();

  const today = new Date().toISOString().split("T")[0];

  const checkExisting = useCallback(async () => {
    const { data } = await supabase
      .from("daily_checkins")
      .select("id")
      .eq("date", today)
      .limit(1);

    if (data && data.length > 0) {
      setAlreadyCheckedIn(true);
    } else {
      // Show check-in prompt if no entry today
      const dismissed = sessionStorage.getItem(`checkin-dismissed-${today}`);
      if (!dismissed) setShow(true);
    }
  }, [supabase, today]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  async function handleSubmit() {
    if (!mood || !trafficLight) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      date: today,
      mood,
      energy,
      focus: focus || null,
      traffic_light: trafficLight,
      gratitude: gratitude || null,
      intention: intention || null,
    };
    if (isAdvanced) {
      payload.sleep_quality = sleepQuality;
      payload.cognitive_load = cognitiveLoad;
    }
    await supabase.from("daily_checkins").upsert(payload, { onConflict: "user_id,date" });

    // Award XP for daily check-in
    try {
      const { awardXP } = await import("@/lib/xp/engine");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await awardXP(supabase, user.id, "checkin");
      }
    } catch { /* XP tables may not exist yet */ }

    setSaving(false);
    setShow(false);
    setAlreadyCheckedIn(true);
  }

  function dismiss() {
    sessionStorage.setItem(`checkin-dismissed-${today}`, "1");
    setShow(false);
  }

  if (!show || alreadyCheckedIn || !isTourComplete("welcome")) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="glass border border-border/50 rounded-2xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Daily Check-In</h2>
            <p className="text-xs text-muted mt-0.5">30 seconds — set your mindset</p>
          </div>
          <button onClick={dismiss} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Mood */}
          <div>
            <label className="block text-xs text-muted mb-2 flex items-center gap-1">How are you feeling? <InfoTooltip text="Your AI coach tracks mood-to-P&L correlation. Traders who log mood daily discover which emotional states produce their best and worst results." /></label>
            <div className="flex gap-2">
              {MOOD_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setMood(level.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                    mood === level.value
                      ? "bg-accent/10 border-accent/30 shadow-sm"
                      : "bg-background border-border hover:border-accent/20"
                  }`}
                >
                  <span className="text-xl">{level.emoji}</span>
                  <span className="text-[10px] text-muted">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div>
            <label className="block text-xs text-muted mb-2 flex items-center gap-1">Energy level? <InfoTooltip text="Low energy correlates with poor risk management. Tracking this reveals your optimal trading hours and helps you avoid decision fatigue." /></label>
            <div className="flex gap-2">
              {ENERGY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setEnergy(level.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                    energy === level.value
                      ? "bg-accent/10 border-accent/30 shadow-sm"
                      : "bg-background border-border hover:border-accent/20"
                  }`}
                >
                  <span className="text-xl">{level.emoji}</span>
                  <span className="text-[10px] text-muted">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gratitude */}
          <div>
            <label className="block text-xs text-muted mb-2 flex items-center gap-1">One thing you&apos;re grateful for: <InfoTooltip text="Specific gratitude activates your brain's reward center. Traders who start with gratitude make fewer impulsive decisions." /></label>
            <input
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="e.g., Yesterday's discipline saved me from a bad trade"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
            />
          </div>

          {/* Intention */}
          <div>
            <label className="block text-xs text-muted mb-2 flex items-center gap-1">What would make today great? <InfoTooltip text="Setting one clear intention reduces overtrading. Traders who write a daily intention take fewer impulsive trades." /></label>
            <input
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="e.g., Only take A+ setups, respect my stops"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
            />
          </div>

          {/* Focus */}
          <div>
            <label className="block text-xs text-muted mb-2 flex items-center gap-1">Today&apos;s focus: <InfoTooltip text="Setting one clear intention reduces overtrading. Traders who write a daily focus take fewer impulsive trades." /></label>
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g., Only take A+ setups, respect my stops"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
            />
          </div>

          {/* Advanced: Sleep Quality */}
          {isAdvanced && (
            <div>
              <label className="block text-xs text-muted mb-2 flex items-center gap-1">Sleep last night? <InfoTooltip text="Sleep quality is the #1 predictor of next-day trading performance. Your AI coach will flag when poor sleep precedes your worst trades." /></label>
              <div className="flex gap-2">
                {SLEEP_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setSleepQuality(sleepQuality === level.value ? null : level.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                      sleepQuality === level.value
                        ? "bg-accent/10 border-accent/30 shadow-sm"
                        : "bg-background border-border hover:border-accent/20"
                    }`}
                  >
                    <span className="text-xl">{level.emoji}</span>
                    <span className="text-[10px] text-muted">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced: Cognitive Load */}
          {isAdvanced && (
            <div>
              <label className="block text-xs text-muted mb-2 flex items-center gap-1">Mental load right now? <InfoTooltip text="High cognitive load degrades decision quality after ~35 decisions. Track this to know when to stop trading." /></label>
              <div className="flex gap-2">
                {COGNITIVE_LOAD_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setCognitiveLoad(cognitiveLoad === level.value ? null : level.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                      cognitiveLoad === level.value
                        ? "bg-accent/10 border-accent/30 shadow-sm"
                        : "bg-background border-border hover:border-accent/20"
                    }`}
                  >
                    <span className="text-xl">{level.emoji}</span>
                    <span className="text-[10px] text-muted">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Traffic Light */}
          <div>
            <label className="block text-xs text-muted mb-2 flex items-center gap-1">Should you trade today? <InfoTooltip text="Your traffic light history shows how often you trade on red/yellow days — and what it costs you. Most losses cluster on red days." /></label>
            <div className="space-y-2">
              {TRAFFIC_LIGHTS.map((light) => (
                <button
                  key={light.value}
                  onClick={() => setTrafficLight(light.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    trafficLight === light.value
                      ? light.color
                      : "bg-background border-border text-muted hover:border-accent/20"
                  }`}
                >
                  <light.icon size={16} />
                  <span className="text-xs font-medium">{light.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!mood || !trafficLight || saving}
            className="w-full py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Start Trading Day"}
          </button>
        </div>
      </div>
    </div>
  );
}
