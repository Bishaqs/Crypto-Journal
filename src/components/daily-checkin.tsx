"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Sun, Coffee, Zap } from "lucide-react";
import { isTourComplete } from "@/lib/onboarding";

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

export function DailyCheckin() {
  const [show, setShow] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [focus, setFocus] = useState("");
  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red" | null>(null);
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

    await supabase.from("daily_checkins").upsert({
      date: today,
      mood,
      energy,
      focus: focus || null,
      traffic_light: trafficLight,
    }, { onConflict: "user_id,date" });

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
            <label className="block text-xs text-muted mb-2">How are you feeling?</label>
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
            <label className="block text-xs text-muted mb-2">Energy level?</label>
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

          {/* Focus */}
          <div>
            <label className="block text-xs text-muted mb-2">Today&apos;s focus:</label>
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g., Only take A+ setups, respect my stops"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
            />
          </div>

          {/* Traffic Light */}
          <div>
            <label className="block text-xs text-muted mb-2">Should you trade today?</label>
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
