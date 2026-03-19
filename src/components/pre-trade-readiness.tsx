"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { FlowStateInput } from "@/components/psychology-inputs";
import { SomaticBodyMap } from "@/components/somatic-body-map";
import { IDEA_SOURCES } from "@/lib/validators";
import type { FlowState, SomaticArea, SomaticIntensity } from "@/lib/types";
import {
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  Brain,
  Loader2,
} from "lucide-react";

type ReadinessResult = {
  score: "green" | "yellow" | "red";
  summary: string;
  warnings: string[];
  recommendation: string;
};

type PreTradeReadinessProps = {
  open: boolean;
  onClose: () => void;
  onComplete?: (result: ReadinessResult) => void;
};

export function PreTradeReadiness({ open, onClose, onComplete }: PreTradeReadinessProps) {
  const { tier, isAdvanced, isExpert } = usePsychologyTier();

  // Quick check fields (all tiers)
  const [emotionQuadrant, setEmotionQuadrant] = useState<string | null>(null);
  const [bodyTension, setBodyTension] = useState(5);
  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red" | null>(null);
  const [tradesToday, setTradesToday] = useState<number | null>(null);
  const [recentLoss, setRecentLoss] = useState<boolean | null>(null);

  // Full check fields (advanced/expert)
  const [somaticAreas, setSomaticAreas] = useState<SomaticArea[]>([]);
  const [somaticIntensity, setSomaticIntensity] = useState<SomaticIntensity | null>("light");
  const [thesis, setThesis] = useState("");
  const [ideaSource, setIdeaSource] = useState("");
  const [falsification, setFalsification] = useState("");
  const [flowState, setFlowState] = useState<FlowState | null>(null);

  // Result
  const [assessing, setAssessing] = useState(false);
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-detect trades today and recent loss
  useEffect(() => {
    if (!open) return;
    async function loadContext() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const [{ count: todayCount }, { data: recentTrades }] = await Promise.all([
        supabase.from("trades").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("open_timestamp", today),
        supabase.from("trades").select("pnl, close_timestamp").eq("user_id", user.id).gte("close_timestamp", oneHourAgo).not("pnl", "is", null).order("close_timestamp", { ascending: false }).limit(5),
      ]);

      setTradesToday(todayCount ?? 0);
      setRecentLoss(recentTrades?.some((t: { pnl: number | null }) => (t.pnl ?? 0) < 0) ?? false);
    }
    loadContext();
  }, [open]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setEmotionQuadrant(null);
      setBodyTension(5);
      setTrafficLight(null);
      setSomaticAreas([]);
      setSomaticIntensity("light");
      setThesis("");
      setIdeaSource("");
      setFalsification("");
      setFlowState(null);
      setResult(null);
    }
  }, [open]);

  async function handleAssess() {
    setAssessing(true);

    // Compute readiness score locally (no API call needed for basic assessment)
    const warnings: string[] = [];
    let score: "green" | "yellow" | "red" = "green";

    // Danger zone emotion
    if (emotionQuadrant === "danger") {
      warnings.push("You're in the Danger Zone (FOMO/Revenge/Greed/Overconfidence). Historical loss rate is significantly higher in this state.");
      score = "red";
    } else if (emotionQuadrant === "caution") {
      warnings.push("You're in the Caution Zone (Anxiety/Fear/Frustration). Consider whether you're trading to recover or to execute a plan.");
      if (score === "green") score = "yellow";
    }

    // High body tension
    if (bodyTension >= 8) {
      warnings.push(`Body tension at ${bodyTension}/10. Research shows physical stress degrades decision quality (Danziger et al.). Consider waiting 1-2 hours.`);
      score = "red";
    } else if (bodyTension >= 6) {
      warnings.push(`Body tension at ${bodyTension}/10. Elevated but manageable. Stay aware of impulse signals.`);
      if (score === "green") score = "yellow";
    }

    // Self-flagged red
    if (trafficLight === "red") {
      warnings.push("You flagged yourself as Red — not fit to trade. Honor your own assessment. The market will be here tomorrow.");
      score = "red";
    } else if (trafficLight === "yellow") {
      warnings.push("You flagged yourself as Yellow — proceed with caution and reduced size.");
      if (score === "green") score = "yellow";
    }

    // Too many trades
    if (tradesToday !== null && tradesToday >= 5) {
      warnings.push(`${tradesToday} trades already today. Performance typically degrades after 5+ trades in a session.`);
      if (score === "green") score = "yellow";
    }

    // Recent loss
    if (recentLoss) {
      warnings.push("You had a loss within the last hour. Post-loss trades have significantly lower win rates. Consider a cooling period.");
      if (score !== "red") score = "yellow";
    }

    // Advanced/Expert checks
    if (isAdvanced || isExpert) {
      if (!falsification && thesis) {
        warnings.push("You couldn't name what would prove your thesis wrong. That's a conviction trade, not a probability trade (CIA Structured Analytic Techniques).");
        if (score === "green") score = "yellow";
      }

      if (ideaSource && ideaSource !== "own_analysis") {
        warnings.push(`Trade idea sourced from ${IDEA_SOURCES.find((s) => s.id === ideaSource)?.label || ideaSource}. Track this — external source trades often underperform own analysis.`);
      }

      if (flowState === "forced") {
        warnings.push("You're in a 'forced' flow state. Everything feels like a struggle. Trades entered in this state have historically lower win rates.");
        if (score === "green") score = "yellow";
      }
    }

    const recommendation =
      score === "red"
        ? "Step away from the screen. Take a walk, breathe, review your trading plan. Come back when you're in a better state."
        : score === "yellow"
          ? "Proceed with caution. Reduce position size. Stick strictly to your playbook. No improvisation."
          : "You're in a good state. Clear mind, manageable tension. Execute your plan with confidence.";

    const summary =
      score === "red"
        ? `${warnings.length} warning${warnings.length !== 1 ? "s" : ""} detected. NOT recommended to trade right now.`
        : score === "yellow"
          ? `${warnings.length} caution flag${warnings.length !== 1 ? "s" : ""}. Trade with reduced risk.`
          : "All clear. Good psychological state for trading.";

    const readinessResult: ReadinessResult = { score, summary, warnings, recommendation };
    setResult(readinessResult);
    setAssessing(false);

    // Save to behavioral_logs with phase = pre_trade
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("behavioral_logs").insert({
          user_id: user.id,
          emotion: emotionQuadrant || "unset",
          intensity: Math.round(bodyTension / 2), // map 1-10 to 1-5
          trigger: recentLoss ? "Recent loss" : null,
          physical_state: somaticAreas.length > 0 ? somaticAreas : ["Normal"],
          biases: [],
          traffic_light: trafficLight || "green",
          note: thesis || null,
          phase: "pre_trade",
          readiness_score: score === "green" ? 3 : score === "yellow" ? 2 : 1,
          override: false,
          psychology_tier: tier,
        });
      }
    } catch {
      // Non-critical
    }
    setSaving(false);

    onComplete?.(readinessResult);
  }

  async function handleOverride() {
    // Mark as override — trader proceeds despite warnings
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update the most recent pre_trade log to override = true
        const { data: lastLog } = await supabase
          .from("behavioral_logs")
          .select("id")
          .eq("user_id", user.id)
          .eq("phase", "pre_trade")
          .order("created_at", { ascending: false })
          .limit(1);

        if (lastLog?.[0]) {
          await supabase
            .from("behavioral_logs")
            .update({ override: true })
            .eq("id", lastLog[0].id);
        }
      }
    } catch {
      // Non-critical
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0f1117] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Pre-Trade Readiness Check
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <div className="space-y-5">
            {/* Emotion Quadrant */}
            <div>
              <label className="text-sm font-medium mb-2 block">How are you feeling?</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "danger", label: "Danger Zone", emoji: "🔴", desc: "FOMO / Revenge / Greedy", color: "border-red-500/50 bg-red-500/10 text-red-300" },
                  { id: "caution", label: "Caution", emoji: "🟡", desc: "Anxious / Fearful / Frustrated", color: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300" },
                  { id: "edge", label: "Edge State", emoji: "🟢", desc: "Confident / Disciplined", color: "border-green-500/50 bg-green-500/10 text-green-300" },
                  { id: "baseline", label: "Baseline", emoji: "🔵", desc: "Calm / Neutral", color: "border-blue-500/50 bg-blue-500/10 text-blue-300" },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setEmotionQuadrant(emotionQuadrant === q.id ? null : q.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      emotionQuadrant === q.id ? q.color : "border-white/10 opacity-50 hover:opacity-70"
                    }`}
                  >
                    <div className="text-sm font-medium">{q.emoji} {q.label}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{q.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Body Tension */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Body tension: <span className="text-cyan-400">{bodyTension}/10</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={bodyTension}
                onChange={(e) => setBodyTension(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] opacity-40 mt-1">
                <span>Relaxed</span>
                <span>Extreme tension</span>
              </div>
            </div>

            {/* Traffic Light */}
            <div>
              <label className="text-sm font-medium mb-2 block">Am I fit to trade?</label>
              <div className="flex gap-2">
                {[
                  { value: "green" as const, label: "Good to go", color: "bg-green-500/20 border-green-500/50 text-green-400" },
                  { value: "yellow" as const, label: "Caution", color: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" },
                  { value: "red" as const, label: "Sit out", color: "bg-red-500/20 border-red-500/50 text-red-400" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTrafficLight(opt.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                      trafficLight === opt.value ? opt.color : "border-white/10 opacity-50 hover:opacity-70"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-detected context */}
            <div className="flex gap-3 text-xs opacity-60">
              {tradesToday !== null && (
                <span className={tradesToday >= 5 ? "text-yellow-400" : ""}>
                  {tradesToday} trades today
                </span>
              )}
              {recentLoss !== null && recentLoss && (
                <span className="text-red-400">Loss in last hour</span>
              )}
              {recentLoss === false && (
                <span className="text-green-400">No recent losses</span>
              )}
            </div>

            {/* Advanced/Expert fields */}
            {(isAdvanced || isExpert) && (
              <>
                <hr className="border-white/10" />

                {/* Somatic Body Map */}
                {isExpert && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Where do you feel tension?</label>
                    <SomaticBodyMap
                      areas={somaticAreas}
                      onAreasChange={setSomaticAreas}
                      intensity={somaticIntensity}
                      onIntensityChange={setSomaticIntensity}
                    />
                  </div>
                )}

                {/* Trade Thesis */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Trade thesis (optional)</label>
                  <textarea
                    value={thesis}
                    onChange={(e) => setThesis(e.target.value)}
                    placeholder="What's your thesis for this trade?"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none h-16"
                  />
                </div>

                {/* Idea Source */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Where did this idea come from?</label>
                  <div className="flex flex-wrap gap-2">
                    {IDEA_SOURCES.map((src) => (
                      <button
                        key={src.id}
                        onClick={() => setIdeaSource(ideaSource === src.id ? "" : src.id)}
                        className={`px-3 py-1 rounded-full text-xs border transition-all ${
                          ideaSource === src.id
                            ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                            : "border-white/10 opacity-50 hover:opacity-70"
                        }`}
                      >
                        {src.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Falsification */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    What would prove you wrong?
                    <span className="text-[10px] opacity-40 ml-1">(CIA Structured Analytic Techniques)</span>
                  </label>
                  <input
                    type="text"
                    value={falsification}
                    onChange={(e) => setFalsification(e.target.value)}
                    placeholder="If [X] happens, my thesis is wrong..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                {/* Flow State (Expert) */}
                {isExpert && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Flow state</label>
                    <FlowStateInput value={flowState} onChange={setFlowState} />
                  </div>
                )}
              </>
            )}

            {/* Assess Button */}
            <button
              onClick={handleAssess}
              disabled={!emotionQuadrant || !trafficLight || assessing}
              className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {assessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              Assess Readiness
            </button>
          </div>
        ) : (
          /* Result */
          <div className="space-y-4">
            {/* Score Badge */}
            <div
              className={`rounded-lg p-4 border ${
                result.score === "red"
                  ? "border-red-500/50 bg-red-500/10"
                  : result.score === "yellow"
                    ? "border-yellow-500/50 bg-yellow-500/10"
                    : "border-green-500/50 bg-green-500/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.score === "red" ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : result.score === "yellow" ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                <span className="font-semibold text-sm">{result.summary}</span>
              </div>
              <p className="text-xs opacity-70">{result.recommendation}</p>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="space-y-2">
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-yellow-400" />
                    <span className="opacity-70">{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {result.score !== "green" && (
                <button
                  onClick={handleOverride}
                  className="flex-1 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all"
                >
                  Trade Anyway (Override)
                </button>
              )}
              <button
                onClick={onClose}
                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                  result.score === "green"
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {result.score === "green" ? "Execute Trade" : "Step Away"}
              </button>
            </div>

            {saving && (
              <p className="text-[10px] opacity-30 text-center">Saving check...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
