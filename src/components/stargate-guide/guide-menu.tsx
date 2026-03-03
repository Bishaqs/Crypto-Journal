"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  TrendingUp,
  MessageCircle,
  RotateCcw,
  X,
  Send,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";
import { isTourComplete, TOUR_KEY_PREFIX } from "@/lib/onboarding";
import { useGuide } from "./guide-context";
import { useTour } from "@/lib/tour-context";
import { useI18n } from "@/lib/i18n";

const EMOTIONS = Object.keys(EMOTION_CONFIG);

const TRAFFIC_LIGHTS = [
  { value: "green" as const, label: "Good", color: "bg-emerald-500" },
  { value: "yellow" as const, label: "Caution", color: "bg-amber-400" },
  { value: "red" as const, label: "Step away", color: "bg-red-500" },
];

export function GuideMenu() {
  const { state, closeMenu, setMenuPanel } = useGuide();
  const { startTour } = useTour();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);

  // Emotion form state
  const [emotion, setEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red">("green");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayCount, setTodayCount] = useState(0);

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
    if (state.menuOpen) fetchTodayCount();
  }, [state.menuOpen, fetchTodayCount]);

  // Escape closes
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && state.menuOpen) closeMenu();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [state.menuOpen, closeMenu]);

  // Click outside closes
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        state.menuOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        const guideEl = (window as unknown as Record<string, unknown>).__stargateGuideEl as HTMLElement | undefined;
        if (guideEl?.contains(e.target as Node)) return;
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [state.menuOpen, closeMenu]);

  async function handleEmotionSubmit() {
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

    setEmotion(null);
    setIntensity(3);
    setNote("");
    setTrafficLight("green");
    setSaving(false);
    fetchTodayCount();
    setMenuPanel("main");
  }

  function replayPageTour() {
    const page = pathname.split("/").pop() || "dashboard";
    const tourKey = TOUR_KEY_PREFIX + `${page}-page`;
    localStorage.removeItem(tourKey);
    closeMenu();
    setTimeout(() => startTour(`${page}-page`), 100);
  }

  function replayWelcomeTour() {
    localStorage.removeItem(TOUR_KEY_PREFIX + "welcome");
    closeMenu();
    setTimeout(() => startTour("welcome"), 100);
  }

  const isDashboard = pathname === "/dashboard" || pathname.endsWith("/dashboard");
  const canReplayWelcome = isTourComplete("welcome");
  const canReplayPageTour = (() => {
    const page = pathname.split("/").pop() || "dashboard";
    return isTourComplete(`${page}-page`);
  })();

  if (!state.menuOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
        className="fixed bottom-[88px] right-6 z-50 max-sm:right-4 max-sm:bottom-[80px]"
      >
        {/* Main menu */}
        {state.menuPanel === "main" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-[240px] glass rounded-2xl border border-border/50 p-2 overflow-hidden"
            style={{ boxShadow: "var(--shadow-cosmic)" }}
          >
            <button
              onClick={() => setMenuPanel("feeling")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-accent/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Heart size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  Log a Feeling
                </p>
                <p className="text-[10px] text-muted">
                  {todayCount > 0 ? `${todayCount} today` : "Track your emotions"}
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                closeMenu();
                router.push("/dashboard/trades?new=true");
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-accent/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  Log a Trade
                </p>
                <p className="text-[10px] text-muted">Record a new trade</p>
              </div>
            </button>

            <button
              onClick={() => setMenuPanel("chat")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-accent/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <MessageCircle size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  Quick Chat
                </p>
                <p className="text-[10px] text-muted">Ask me anything</p>
              </div>
            </button>

            {isDashboard && canReplayWelcome && (
              <button
                onClick={replayWelcomeTour}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-accent/10 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <RotateCcw size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    Replay Welcome Tour
                  </p>
                  <p className="text-[10px] text-muted">Full dashboard walkthrough</p>
                </div>
              </button>
            )}
            {canReplayPageTour && (
              <button
                onClick={replayPageTour}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-accent/10 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <RotateCcw size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    Replay Page Tour
                  </p>
                  <p className="text-[10px] text-muted">Re-learn this page</p>
                </div>
              </button>
            )}
          </motion.div>
        )}

        {/* Feeling sub-panel */}
        {state.menuPanel === "feeling" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 glass rounded-2xl border border-border/50 p-5 overflow-hidden"
            style={{ boxShadow: "var(--shadow-cosmic)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setMenuPanel("main")}
                className="p-1 rounded-lg text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} />
              </button>
              <h3 className="text-sm font-semibold text-foreground">
                {t("emotion.title")}
              </h3>
              <button
                onClick={closeMenu}
                className="p-1 rounded-lg text-muted hover:text-foreground transition-colors"
              >
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

            {/* Intensity */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                  {t("emotion.intensity")}
                </label>
                <span className="text-xs font-bold text-accent">
                  {intensity}/5
                </span>
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
                  {tl.label}
                </button>
              ))}
            </div>

            {/* Quick note */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("emotion.quickNote")}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 resize-none mb-3"
            />

            {/* Submit */}
            <button
              onClick={handleEmotionSubmit}
              disabled={!emotion || saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {saving ? t("common.saving") : t("emotion.logFeeling")}
            </button>
          </motion.div>
        )}

        {/* Chat sub-panel uses GuideHelp — rendered separately */}
      </motion.div>
    </AnimatePresence>
  );
}
