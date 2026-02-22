"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, X, Send } from "lucide-react";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";

const EMOTIONS = Object.keys(EMOTION_CONFIG);

const TRAFFIC_LIGHTS = [
  { value: "green" as const, label: "Good to trade", color: "bg-emerald-500" },
  { value: "yellow" as const, label: "Proceed with caution", color: "bg-amber-400" },
  { value: "red" as const, label: "Step away", color: "bg-red-500" },
];

export function QuickEmotionFab() {
  const [open, setOpen] = useState(false);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red">("green");
  const [note, setNote] = useState("");
  const [todayCount, setTodayCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastEmotion, setLastEmotion] = useState<string | null>(null);

  const supabase = createClient();

  const fetchTodayCount = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("behavioral_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);
    setTodayCount(count ?? 0);
  }, [supabase]);

  useEffect(() => {
    fetchTodayCount();
  }, [fetchTodayCount]);

  async function handleSubmit() {
    if (!emotion) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("behavioral_logs").insert({
      user_id: user.id,
      emotion,
      intensity,
      traffic_light: trafficLight,
      note: note.trim() || null,
      trigger: null,
      trigger_detail: null,
      physical_state: [],
      biases: [],
    });

    setLastEmotion(emotion);
    setEmotion(null);
    setIntensity(3);
    setNote("");
    setTrafficLight("green");
    setOpen(false);
    setSaving(false);
    fetchTodayCount();
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent text-background font-semibold text-sm shadow-lg hover:bg-accent-hover transition-all duration-300 hover:shadow-[0_0_25px_rgba(139,92,246,0.3)]"
      >
        <Heart size={16} />
        {lastEmotion ? (
          <span className="text-xs">{EMOTION_CONFIG[lastEmotion]?.emoji} {lastEmotion}</span>
        ) : (
          <span className="text-xs">Log Feeling</span>
        )}
        {todayCount > 0 && (
          <span className="ml-1 w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-[10px] font-bold">
            {todayCount}
          </span>
        )}
      </button>

      {/* Quick log popup */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 glass rounded-2xl border border-border/50 p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-200" style={{ boxShadow: "var(--shadow-cosmic)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Quick Emotion Log</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-muted hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Emotion grid */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {EMOTIONS.map((e) => {
              const config = EMOTION_CONFIG[e];
              const isSelected = emotion === e;
              return (
                <button
                  key={e}
                  onClick={() => setEmotion(isSelected ? null : e)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                    isSelected
                      ? `${config.color} shadow-sm`
                      : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
                  }`}
                >
                  <span>{config.emoji}</span>
                  {e}
                </button>
              );
            })}
          </div>

          {/* Intensity slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Intensity</label>
              <span className="text-xs font-bold text-accent">{intensity}/5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-border accent-accent"
            />
          </div>

          {/* Traffic light */}
          <div className="flex gap-2 mb-4">
            {TRAFFIC_LIGHTS.map((tl) => (
              <button
                key={tl.value}
                onClick={() => setTrafficLight(tl.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium border transition-all ${
                  trafficLight === tl.value
                    ? "border-accent/30 bg-accent/5 text-foreground"
                    : "border-border text-muted hover:border-accent/20"
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${tl.color}`} />
                {tl.label.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Quick note */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Quick note (optional)..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 resize-none mb-3"
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!emotion || saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            {saving ? "Saving..." : "Log Feeling"}
          </button>
        </div>
      )}
    </>
  );
}
