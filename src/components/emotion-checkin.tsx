"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BehavioralLog } from "@/lib/types";
import {
  EMOTION_TRIGGERS,
  PHYSICAL_STATES,
  BEHAVIORAL_BIASES,
  EXPANDED_TRIGGERS,
  EXPANDED_PHYSICAL_STATES,
  EXPANDED_BIASES,
  COGNITIVE_DISTORTIONS,
  DEFENSE_MECHANISMS,
} from "@/lib/validators";
import { EmotionPicker, EmotionQuadrantPicker, FlowStateInput, EMOTION_CONFIG } from "@/components/psychology-inputs";
import { PsychologyTierToggle } from "@/components/psychology-tier-toggle";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { ChevronDown, ChevronUp, Zap, Coffee, Sun } from "lucide-react";
import type { FlowState, CognitiveDistortion, DefenseMechanism } from "@/lib/types";

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

const NARRATIVE_LEVELS = [
  { value: 1, label: "Open-minded" },
  { value: 2, label: "Flexible" },
  { value: 3, label: "Leaning" },
  { value: 4, label: "Committed" },
  { value: 5, label: "Married to it" },
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
  const { tier, isAdvanced, isExpert } = usePsychologyTier();

  // Core fields
  const [emotion, setEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState<string | null>(null);
  const [triggerDetail, setTriggerDetail] = useState("");
  const [physicalState, setPhysicalState] = useState<string[]>([]);
  const [biases, setBiases] = useState<string[]>([]);
  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red" | null>(null);
  const [note, setNote] = useState("");

  // Advanced fields
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [cognitiveLoad, setCognitiveLoad] = useState<number | null>(null);
  const [narrativeAttachment, setNarrativeAttachment] = useState<number | null>(null);

  // Expert fields
  const [cognitiveDistortions, setCognitiveDistortions] = useState<CognitiveDistortion[]>([]);
  const [defenseMechanisms, setDefenseMechanisms] = useState<DefenseMechanism[]>([]);
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [internalDialogue, setInternalDialogue] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(mode === "advanced");
  const [error, setError] = useState<string | null>(null);

  // Collapsible sections for advanced
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const contextLabels = {
    standalone: { emotion: "How are you feeling?", traffic: "Am I fit to trade?", button: "Log Check-In" },
    trade: { emotion: "Pre-trade mindset", traffic: "Ready to trade?", button: "Save Mindset" },
    journal: { emotion: "Current emotional state", traffic: "Trading fitness", button: "Log State" },
  };
  const labels = contextLabels[context];

  // Use expanded constants for advanced/expert, originals for simple
  const triggers = isAdvanced ? EXPANDED_TRIGGERS : EMOTION_TRIGGERS;
  const physicalStates = isAdvanced ? EXPANDED_PHYSICAL_STATES : PHYSICAL_STATES;
  const biasOptions = isAdvanced ? EXPANDED_BIASES : BEHAVIORAL_BIASES;

  function toggleArray<T extends string>(arr: T[], item: T, setter: (val: T[]) => void) {
    setter(arr.includes(item) ? arr.filter((s) => s !== item) : [...arr, item]);
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function sectionFilled(key: string): string {
    switch (key) {
      case "body": {
        const filled = [sleepQuality, cognitiveLoad, physicalState.length > 0].filter(Boolean).length;
        return `${filled}/3`;
      }
      case "mind": {
        const filled = [biases.length > 0, narrativeAttachment].filter(Boolean).length;
        return `${filled}/2`;
      }
      case "context": {
        const filled = [trigger].filter(Boolean).length;
        return `${filled}/1`;
      }
      case "expert": {
        const filled = [cognitiveDistortions.length > 0, defenseMechanisms.length > 0, flowState, internalDialogue.trim()].filter(Boolean).length;
        return `${filled}/4`;
      }
      default:
        return "";
    }
  }

  async function handleSubmit() {
    if (!emotion || !trafficLight) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const showingAdvanced = showAdvanced || isAdvanced;

      const payload: Record<string, unknown> = {
        emotion,
        intensity: showingAdvanced ? intensity : 3,
        trigger: showingAdvanced ? trigger : null,
        trigger_detail: showingAdvanced && triggerDetail.trim() ? triggerDetail.trim() : null,
        physical_state: showingAdvanced ? physicalState : [],
        biases: showingAdvanced ? biases : [],
        traffic_light: trafficLight,
        note: note.trim() || null,
        psychology_tier: tier,
      };

      // Advanced fields
      if (isAdvanced) {
        payload.sleep_quality = sleepQuality;
        payload.cognitive_load = cognitiveLoad;
        payload.narrative_attachment = narrativeAttachment;
      }

      const { data, error: dbError } = await supabase
        .from("behavioral_logs")
        .insert(payload)
        .select()
        .single();

      if (dbError) {
        setError(dbError.message);
        return;
      }

      // Save expert session log if expert tier
      if (isExpert && (cognitiveDistortions.length > 0 || defenseMechanisms.length > 0 || flowState || internalDialogue.trim())) {
        const sessionDate = new Date().toISOString().split("T")[0];
        await supabase.from("expert_session_logs").upsert({
          session_date: sessionDate,
          somatic_areas: [],
          flow_state: flowState,
          cognitive_distortions: cognitiveDistortions,
          defense_mechanisms: defenseMechanisms,
          internal_dialogue: internalDialogue.trim() || null,
        }, { onConflict: "user_id,session_date" });
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
      setSleepQuality(null);
      setCognitiveLoad(null);
      setNarrativeAttachment(null);
      setCognitiveDistortions([]);
      setDefenseMechanisms([]);
      setFlowState(null);
      setInternalDialogue("");
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

  const showingAdvanced = showAdvanced || isAdvanced;

  const content = (
    <div className="space-y-4">
      {/* Tier toggle (compact) */}
      {context === "standalone" && (
        <div className="flex justify-end">
          <PsychologyTierToggle compact />
        </div>
      )}

      {/* Emotion picker — tier-aware */}
      {tier === "simple" ? (
        <EmotionQuadrantPicker
          value={emotion}
          onChange={setEmotion}
          label={labels.emotion}
        />
      ) : (
        <EmotionPicker
          value={emotion}
          onChange={setEmotion}
          label={labels.emotion}
        />
      )}

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

      {/* Advanced toggle (auto mode only when tier is simple) */}
      {mode === "auto" && tier === "simple" && !showAdvanced && (
        <button
          type="button"
          onClick={() => setShowAdvanced(true)}
          className="flex items-center gap-1.5 text-[10px] text-accent/70 hover:text-accent transition-colors w-full"
        >
          <ChevronDown size={12} />
          Add more detail
        </button>
      )}

      {/* Advanced / Expert fields */}
      {showingAdvanced && (
        <div className="space-y-3">
          {mode === "auto" && tier === "simple" && (
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

          {/* ─── Body Section (Advanced+) ─── */}
          {isAdvanced && (
            <div className="border border-border/30 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("body")}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted/80 uppercase tracking-wider hover:bg-accent/5 transition-colors"
              >
                <span>🫀 Body ({sectionFilled("body")})</span>
                {openSections.body ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {openSections.body && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Sleep Quality */}
                  <div>
                    <label className="block text-[10px] text-muted/60 mb-1.5">Sleep last night?</label>
                    <div className="flex gap-1.5">
                      {SLEEP_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setSleepQuality(sleepQuality === level.value ? null : level.value)}
                          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-medium border transition-all ${
                            sleepQuality === level.value
                              ? "bg-accent/15 border-accent/40 text-accent"
                              : "bg-background border-border text-muted hover:border-accent/20"
                          }`}
                        >
                          <span>{level.emoji}</span>
                          <span>{level.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cognitive Load */}
                  <div>
                    <label className="block text-[10px] text-muted/60 mb-1.5">Mental load?</label>
                    <div className="flex gap-1.5">
                      {COGNITIVE_LOAD_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setCognitiveLoad(cognitiveLoad === level.value ? null : level.value)}
                          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-medium border transition-all ${
                            cognitiveLoad === level.value
                              ? "bg-accent/15 border-accent/40 text-accent"
                              : "bg-background border-border text-muted hover:border-accent/20"
                          }`}
                        >
                          <span>{level.emoji}</span>
                          <span>{level.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Physical State */}
                  <div>
                    <label className="block text-[10px] text-muted/60 mb-1.5">Physical state</label>
                    <div className="flex flex-wrap gap-1.5">
                      {physicalStates.map((state) => (
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
                </div>
              )}
            </div>
          )}

          {/* ─── Mind Section (Advanced+) ─── */}
          {isAdvanced && (
            <div className="border border-border/30 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("mind")}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted/80 uppercase tracking-wider hover:bg-accent/5 transition-colors"
              >
                <span>🧠 Mind ({sectionFilled("mind")})</span>
                {openSections.mind ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {openSections.mind && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Biases */}
                  <div>
                    <label className="block text-[10px] text-muted/60 mb-1.5">Active biases?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {biasOptions.map((bias) => (
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

                  {/* Narrative Attachment */}
                  <div>
                    <label className="block text-[10px] text-muted/60 mb-1.5">
                      Market thesis attachment? <span className="text-foreground font-bold">{narrativeAttachment ?? "—"}/5</span>
                    </label>
                    <div className="flex gap-1.5">
                      {NARRATIVE_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setNarrativeAttachment(narrativeAttachment === level.value ? null : level.value)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-medium border transition-all ${
                            narrativeAttachment === level.value
                              ? "bg-accent/15 border-accent/40 text-accent"
                              : "bg-background border-border text-muted hover:border-accent/20"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Context Section (Advanced+) ─── */}
          {isAdvanced && (
            <div className="border border-border/30 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("context")}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted/80 uppercase tracking-wider hover:bg-accent/5 transition-colors"
              >
                <span>🌍 Context ({sectionFilled("context")})</span>
                {openSections.context ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {openSections.context && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Trigger */}
                  <div>
                    <label className="block text-[10px] text-muted/60 mb-1.5">What triggered this?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {triggers.map((t) => (
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
                </div>
              )}
            </div>
          )}

          {/* ─── Expert Section ─── */}
          {isExpert && (
            <div className="border border-accent/20 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("expert")}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-accent/80 uppercase tracking-wider hover:bg-accent/5 transition-colors"
              >
                <span>🔬 Deep Psychology ({sectionFilled("expert")})</span>
                {openSections.expert ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {openSections.expert && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Flow State */}
                  <FlowStateInput value={flowState} onChange={setFlowState} />

                  {/* Cognitive Distortions */}
                  <div>
                    <label className="block text-[10px] text-muted/60 mb-1.5">Thinking traps active?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {COGNITIVE_DISTORTIONS.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleArray(cognitiveDistortions, d.id as CognitiveDistortion, setCognitiveDistortions)}
                          title={d.example}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                            cognitiveDistortions.includes(d.id as CognitiveDistortion)
                              ? "bg-purple-500/15 border-purple-500/40 text-purple-400"
                              : "bg-background border-border text-muted hover:border-accent/20"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Defense Mechanisms */}
                  <div>
                    <label className="block text-[10px] text-muted/60 mb-1.5">Defense mechanisms?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFENSE_MECHANISMS.map((dm) => (
                        <button
                          key={dm.id}
                          type="button"
                          onClick={() => toggleArray(defenseMechanisms, dm.id as DefenseMechanism, setDefenseMechanisms)}
                          title={dm.example}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                            defenseMechanisms.includes(dm.id as DefenseMechanism)
                              ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                              : "bg-background border-border text-muted hover:border-accent/20"
                          }`}
                        >
                          {dm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Internal Dialogue */}
                  <div>
                    <label className="block text-[10px] text-muted/60 mb-1.5">
                      What story are you telling yourself?
                    </label>
                    <textarea
                      value={internalDialogue}
                      onChange={(e) => setInternalDialogue(e.target.value)}
                      placeholder="e.g., 'I need to make back yesterday's loss' or 'This setup is perfect, I can't miss it'"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Original simple-mode fields (trigger, physical, biases) for non-tier-aware users */}
          {!isAdvanced && (
            <>
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
        </div>
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
