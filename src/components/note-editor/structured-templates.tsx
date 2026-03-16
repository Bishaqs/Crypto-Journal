"use client";

import { EmotionPicker, EmotionQuadrantPicker, ConfidenceSlider, ProcessScoreInput, SetupTypePicker, FlowStateInput, EMOTION_CONFIG } from "@/components/psychology-inputs";
import { RichTextArea } from "@/components/note-editor/rich-text-area";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { EXPANDED_BIASES, EXPANDED_TRIGGERS, COGNITIVE_DISTORTIONS, DEFENSE_MECHANISMS } from "@/lib/validators";
import type { FlowState, CognitiveDistortion } from "@/lib/types";

type FieldDef =
  | { type: "textarea"; key: string; label: string; placeholder?: string }
  | { type: "text"; key: string; label: string; placeholder?: string; prefix?: string }
  | { type: "number"; key: string; label: string; placeholder?: string; prefix?: string }
  | { type: "emotion"; key: string; label?: string; mode?: "multi"; showCustomInput?: boolean }
  | { type: "confidence"; key: string }
  | { type: "process-score"; key: string }
  | { type: "setup-type"; key: string }
  | { type: "checklist"; key: string; label: string; items: string[] };

const TEMPLATE_FIELDS: Record<string, FieldDef[]> = {
  "trade-entry": [
    { type: "emotion", key: "emotion", label: "How are you feeling right now?" },
    { type: "confidence", key: "confidence" },
    { type: "setup-type", key: "setup_type" },
    { type: "textarea", key: "trade_thesis", label: "Trade Thesis / Rationale", placeholder: "Why are you taking this trade? What's the setup?" },
    { type: "textarea", key: "risk_plan", label: "Risk Plan", placeholder: "Where's your stop loss? What's your R:R? Max position size?" },
    { type: "checklist", key: "entry_criteria", label: "Entry Criteria Checklist", items: [
      "Setup matches trading plan",
      "Risk/reward is acceptable (2R+)",
      "Position size within limits",
      "Not revenge trading",
      "Emotionally calm / disciplined",
      "Market conditions support the trade",
    ] },
    { type: "textarea", key: "market_conditions", label: "Market Conditions", placeholder: "Overall trend, key levels, news/events, sentiment..." },
    { type: "textarea", key: "additional_notes", label: "Additional Notes", placeholder: "Anything else on your mind..." },
  ],
  "trade-review": [
    { type: "emotion", key: "emotion", label: "How were you feeling?" },
    { type: "setup-type", key: "setup_type" },
    { type: "textarea", key: "went_well", label: "What went well", placeholder: "Even on a losing trade, what did you do right?" },
    { type: "textarea", key: "went_wrong", label: "What went wrong", placeholder: "Be honest — what could you have done better?" },
    { type: "process-score", key: "process_score" },
    { type: "textarea", key: "lessons", label: "Lessons learned", placeholder: "Key takeaways from this trade..." },
    { type: "textarea", key: "action_items", label: "Action items for next session", placeholder: "Specific, actionable steps..." },
  ],
  "morning-plan": [
    { type: "emotion", key: "emotion", label: "How are you feeling this morning?", mode: "multi" },
    { type: "confidence", key: "confidence" },
    { type: "textarea", key: "market_conditions", label: "Market conditions", placeholder: "Overall trend, key events, sentiment..." },
    { type: "textarea", key: "watchlist", label: "Watchlist", placeholder: "Tickers, setups, key levels..." },
    { type: "number", key: "max_trades", label: "Max trades today", placeholder: "e.g. 3" },
    { type: "number", key: "max_loss", label: "Max loss today", prefix: "$", placeholder: "e.g. 500" },
    { type: "textarea", key: "focus", label: "Focus for today", placeholder: "What's the one thing you'll focus on?" },
  ],
  "daily-review": [
    { type: "textarea", key: "gratitude", label: "3 things that went well today", placeholder: "Be specific — a trade you managed well, a rule you followed, something outside trading..." },
    { type: "emotion", key: "emotion", label: "How are you feeling after today's session?", mode: "multi", showCustomInput: true },
    { type: "process-score", key: "process_score" },
    { type: "text", key: "pnl", label: "Today's P&L", prefix: "$", placeholder: "e.g. +350 or -120" },
    { type: "number", key: "total_trades", label: "Trades taken today", placeholder: "e.g. 4" },
    { type: "textarea", key: "wins", label: "What went well", placeholder: "Winning trades, good decisions, rules you followed..." },
    { type: "textarea", key: "losses", label: "What didn't go well", placeholder: "Losing trades, mistakes, rules you broke..." },
    { type: "textarea", key: "emotional_triggers", label: "Emotional triggers", placeholder: "Moments where emotions influenced your decisions..." },
    { type: "textarea", key: "energy_reflection", label: "Energy throughout the day", placeholder: "Peaked early? Steady? Drained by afternoon? When were you sharpest?" },
    { type: "textarea", key: "mindset_check", label: "Biggest challenge & how you handled it", placeholder: "What was hardest today? What's within your control vs. what isn't?" },
    { type: "textarea", key: "lessons", label: "Key takeaways", placeholder: "What did you learn today?" },
    { type: "textarea", key: "tomorrow_focus", label: "Focus for tomorrow", placeholder: "One thing to improve or focus on tomorrow..." },
  ],
  "weekly-recap": [
    { type: "number", key: "week_score", label: "Rate your week (1-10)", placeholder: "Gut feeling — no rubric needed" },
    { type: "textarea", key: "top_wins", label: "Top 3 wins this week", placeholder: "1. \n2. \n3. " },
    { type: "text", key: "pnl", label: "This week's P&L", prefix: "$", placeholder: "e.g. +1,250 or -300" },
    { type: "textarea", key: "best_trade", label: "Best trade", placeholder: "Describe your best trade this week..." },
    { type: "textarea", key: "worst_trade", label: "Worst trade", placeholder: "Describe your worst trade this week..." },
    { type: "emotion", key: "emotion", label: "Dominant emotion this week" },
    { type: "process-score", key: "process_score" },
    { type: "textarea", key: "gratitude", label: "What are you most grateful for this week?", placeholder: "Something specific from this week..." },
    { type: "textarea", key: "mindset_review", label: "Mindset traps this week", placeholder: "Impostor syndrome? Scarcity thinking? Perfectionism? Revenge trading urges?" },
    { type: "textarea", key: "improve", label: "One thing to improve next week", placeholder: "Specific and actionable..." },
    { type: "text", key: "stop_doing", label: "One thing to stop doing", placeholder: "What wasted time or energy this week?" },
  ],
  "mistake": [
    { type: "textarea", key: "what_happened", label: "What happened", placeholder: "Describe the situation..." },
    { type: "emotion", key: "emotion", label: "How were you feeling when it happened?" },
    { type: "textarea", key: "feelings_detail", label: "What I felt", placeholder: "Describe the emotion in more detail..." },
    { type: "textarea", key: "rule_says", label: "What the rule says", placeholder: "What does your trading plan say about this?" },
    { type: "textarea", key: "do_differently", label: "What I'll do differently", placeholder: "Concrete changes for next time..." },
    { type: "process-score", key: "process_score" },
  ],
};

export const STRUCTURED_TEMPLATE_IDS = Object.keys(TEMPLATE_FIELDS);

export function isStructuredTemplate(templateId: string): boolean {
  return templateId in TEMPLATE_FIELDS;
}

interface StructuredTemplateFormProps {
  templateId: string;
  data: Record<string, string | number | null>;
  onChange: (data: Record<string, string | number | null>) => void;
}

export function StructuredTemplateForm({ templateId, data, onChange }: StructuredTemplateFormProps) {
  const fields = TEMPLATE_FIELDS[templateId];
  const { tier, isAdvanced, isExpert } = usePsychologyTier();
  if (!fields) return null;

  function update(key: string, value: string | number | null) {
    onChange({ ...data, [key]: value });
  }

  function updateChecklist(key: string, item: string, checked: boolean) {
    const current: Record<string, boolean> = data[key] ? JSON.parse(data[key] as string) : {};
    const updated = { ...current, [item]: checked };
    onChange({ ...data, [key]: JSON.stringify(updated) });
  }

  function toggleMultiSelect(key: string, item: string) {
    const raw = (data[key] as string) ?? "";
    const list = raw ? raw.split(",").filter(Boolean) : [];
    const next = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    update(key, next.join(","));
  }

  const selectedItems = (key: string) => ((data[key] as string) ?? "").split(",").filter(Boolean);

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        switch (field.type) {
          case "emotion": {
            if (field.mode === "multi") {
              const raw = data[field.key] as string | null;
              const emotions: string[] = !raw ? [] : raw.startsWith("[") ? JSON.parse(raw) : [raw];
              return (
                <EmotionPicker
                  key={field.key}
                  mode="multi"
                  value={emotions}
                  onChange={(v) => update(field.key, JSON.stringify(v))}
                  label={field.label}
                  showCustomInput={field.showCustomInput}
                  customText={(data[field.key + "_custom"] as string) ?? ""}
                  onCustomTextChange={(t) => update(field.key + "_custom", t || null)}
                />
              );
            }
            // Simple tier uses quadrant picker for single-select emotion
            if (tier === "simple") {
              return (
                <EmotionQuadrantPicker
                  key={field.key}
                  value={(data[field.key] as string) ?? null}
                  onChange={(v) => update(field.key, v)}
                  label={field.label}
                />
              );
            }
            return (
              <EmotionPicker
                key={field.key}
                value={(data[field.key] as string) ?? null}
                onChange={(v) => update(field.key, v)}
                label={field.label}
              />
            );
          }
          case "confidence":
            return (
              <ConfidenceSlider
                key={field.key}
                value={(data[field.key] as number) ?? null}
                onChange={(v) => update(field.key, v)}
              />
            );
          case "process-score":
            return (
              <ProcessScoreInput
                key={field.key}
                value={(data[field.key] as number) ?? null}
                onChange={(v) => update(field.key, v)}
              />
            );
          case "setup-type":
            return (
              <SetupTypePicker
                key={field.key}
                value={(data[field.key] as string) ?? null}
                onChange={(v) => update(field.key, v)}
              />
            );
          case "textarea":
            return (
              <div key={field.key}>
                <label className="block text-[11px] text-muted mb-1.5 font-medium">{field.label}</label>
                <RichTextArea
                  value={(data[field.key] as string) ?? ""}
                  onChange={(html) => update(field.key, html)}
                  placeholder={field.placeholder}
                  minHeight="120px"
                  showToolbar
                />
              </div>
            );
          case "text":
            return (
              <div key={field.key}>
                <label className="block text-[11px] text-muted mb-1.5 font-medium">{field.label}</label>
                <div className="relative">
                  {field.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{field.prefix}</span>
                  )}
                  <input
                    type="text"
                    value={(data[field.key] as string) ?? ""}
                    onChange={(e) => update(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 ${field.prefix ? "pl-8 pr-4" : "px-4"}`}
                  />
                </div>
              </div>
            );
          case "number":
            return (
              <div key={field.key}>
                <label className="block text-[11px] text-muted mb-1.5 font-medium">{field.label}</label>
                <div className="relative">
                  {field.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{field.prefix}</span>
                  )}
                  <input
                    type="number"
                    value={data[field.key] !== null && data[field.key] !== undefined ? String(data[field.key]) : ""}
                    onChange={(e) => update(field.key, e.target.value ? Number(e.target.value) : null)}
                    placeholder={field.placeholder}
                    className={`w-full py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 ${field.prefix ? "pl-8 pr-4" : "px-4"}`}
                  />
                </div>
              </div>
            );
          case "checklist": {
            const checkState: Record<string, boolean> = data[field.key]
              ? JSON.parse(data[field.key] as string)
              : {};
            return (
              <div key={field.key}>
                <label className="block text-[11px] text-muted mb-2 font-medium">{field.label}</label>
                <div className="space-y-1.5">
                  {field.items.map((item) => (
                    <label
                      key={item}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                        checkState[item]
                          ? "border-accent/40 bg-accent/5"
                          : "border-border bg-background hover:border-border/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checkState[item] ?? false}
                        onChange={(e) => updateChecklist(field.key, item, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        checkState[item]
                          ? "bg-accent border-accent text-background"
                          : "border-muted/40"
                      }`}>
                        {checkState[item] && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-foreground">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          }
        }
      })}

      {/* ─── Tier-Specific Fields ─── */}

      {/* Advanced: morning-plan gets sleep + cognitive load */}
      {isAdvanced && templateId === "morning-plan" && (
        <div className="border-t border-border/30 pt-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Body Awareness</p>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">Sleep quality last night</label>
            <div className="flex gap-1.5">
              {[{ v: 1, e: "😵", l: "Terrible" }, { v: 2, e: "😴", l: "Poor" }, { v: 3, e: "😐", l: "OK" }, { v: 4, e: "😊", l: "Good" }, { v: 5, e: "🌟", l: "Great" }].map(
                (level) => (
                  <button
                    key={level.v}
                    type="button"
                    onClick={() => update("sleep_quality", data.sleep_quality === level.v ? null : level.v)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-medium border transition-all ${
                      data.sleep_quality === level.v ? "bg-accent/15 border-accent/40 text-accent" : "bg-background border-border text-muted hover:border-accent/20"
                    }`}
                  >
                    <span>{level.e}</span><span>{level.l}</span>
                  </button>
                )
              )}
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">Cognitive load</label>
            <div className="flex gap-1.5">
              {[{ v: 1, e: "🧘", l: "Clear" }, { v: 2, e: "💭", l: "Light" }, { v: 3, e: "🤔", l: "Moderate" }, { v: 4, e: "🧠", l: "Heavy" }, { v: 5, e: "🤯", l: "Overloaded" }].map(
                (level) => (
                  <button
                    key={level.v}
                    type="button"
                    onClick={() => update("cognitive_load", data.cognitive_load === level.v ? null : level.v)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-medium border transition-all ${
                      data.cognitive_load === level.v ? "bg-accent/15 border-accent/40 text-accent" : "bg-background border-border text-muted hover:border-accent/20"
                    }`}
                  >
                    <span>{level.e}</span><span>{level.l}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced: daily-review gets biases + triggers */}
      {isAdvanced && templateId === "daily-review" && (
        <div className="border-t border-border/30 pt-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Mind Analysis</p>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">Biases that influenced me today</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPANDED_BIASES.map((bias) => (
                <button key={bias} type="button" onClick={() => toggleMultiSelect("biases_today", bias)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    selectedItems("biases_today").includes(bias) ? "bg-loss/10 border-loss/30 text-loss" : "bg-background border-border text-muted hover:border-accent/20"
                  }`}>{bias}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">Triggers I experienced</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPANDED_TRIGGERS.filter((t) => t !== "Other").map((trigger) => (
                <button key={trigger} type="button" onClick={() => toggleMultiSelect("triggers_today", trigger)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    selectedItems("triggers_today").includes(trigger) ? "bg-accent/15 border-accent/40 text-accent" : "bg-background border-border text-muted hover:border-accent/20"
                  }`}>{trigger}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expert: daily-review gets distortions + dialogue + flow */}
      {isExpert && templateId === "daily-review" && (
        <div className="border-t border-accent/10 pt-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-accent/50 font-semibold">Deep Psychology</p>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">Cognitive distortions I noticed</label>
            <div className="flex flex-wrap gap-1.5">
              {COGNITIVE_DISTORTIONS.map((d) => (
                <button key={d.id} type="button" title={d.example} onClick={() => toggleMultiSelect("distortions_today", d.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    selectedItems("distortions_today").includes(d.id) ? "bg-purple-500/15 border-purple-500/40 text-purple-400" : "bg-background border-border text-muted hover:border-accent/20"
                  }`}>{d.label}</button>
              ))}
            </div>
          </div>
          <FlowStateInput
            value={(data.flow_state as FlowState) ?? null}
            onChange={(v) => update("flow_state", v)}
          />
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">What story was I telling myself today?</label>
            <textarea
              value={(data.internal_dialogue as string) ?? ""}
              onChange={(e) => update("internal_dialogue", e.target.value)}
              placeholder="The narrative running through my head during trading..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all resize-none"
            />
          </div>
        </div>
      )}

      {/* Expert: trade-entry gets internal dialogue */}
      {isExpert && templateId === "trade-entry" && (
        <div className="border-t border-accent/10 pt-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-accent/50 font-semibold">Deep Psychology</p>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">What story am I telling myself about this trade?</label>
            <textarea
              value={(data.internal_dialogue as string) ?? ""}
              onChange={(e) => update("internal_dialogue", e.target.value)}
              placeholder="e.g., 'This is the one that'll turn my week around'"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">Where do I feel tension?</label>
            <input
              type="text"
              value={(data.somatic_note as string) ?? ""}
              onChange={(e) => update("somatic_note", e.target.value)}
              placeholder="e.g., chest tight, jaw clenched, hands restless"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
        </div>
      )}

      {/* Expert: mistake gets distortion + defense mechanism */}
      {isExpert && templateId === "mistake" && (
        <div className="border-t border-accent/10 pt-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-accent/50 font-semibold">Deep Psychology</p>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">Which cognitive distortion was active?</label>
            <div className="flex flex-wrap gap-1.5">
              {COGNITIVE_DISTORTIONS.map((d) => (
                <button key={d.id} type="button" title={d.example} onClick={() => toggleMultiSelect("mistake_distortions", d.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    selectedItems("mistake_distortions").includes(d.id) ? "bg-purple-500/15 border-purple-500/40 text-purple-400" : "bg-background border-border text-muted hover:border-accent/20"
                  }`}>{d.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">Which defense mechanism did I use?</label>
            <div className="flex flex-wrap gap-1.5">
              {DEFENSE_MECHANISMS.map((dm) => (
                <button key={dm.id} type="button" title={dm.example} onClick={() => toggleMultiSelect("mistake_defenses", dm.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    selectedItems("mistake_defenses").includes(dm.id) ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-background border-border text-muted hover:border-accent/20"
                  }`}>{dm.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expert: trade-review gets distortions */}
      {isExpert && templateId === "trade-review" && (
        <div className="border-t border-accent/10 pt-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-accent/50 font-semibold">Deep Psychology</p>
          <div>
            <label className="block text-[11px] text-muted mb-1.5 font-medium">Cognitive distortions active during this trade?</label>
            <div className="flex flex-wrap gap-1.5">
              {COGNITIVE_DISTORTIONS.map((d) => (
                <button key={d.id} type="button" title={d.example} onClick={() => toggleMultiSelect("review_distortions", d.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    selectedItems("review_distortions").includes(d.id) ? "bg-purple-500/15 border-purple-500/40 text-purple-400" : "bg-background border-border text-muted hover:border-accent/20"
                  }`}>{d.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function serializePsychToHtml(data: Record<string, string | number | string[] | null>): string {
  const parts: string[] = [];

  // Handle both new multi-emotion format (emotions: string[]) and legacy single (emotion: string)
  const emotions: string[] = Array.isArray(data.emotions)
    ? (data.emotions as string[])
    : (typeof data.emotion === "string" ? [data.emotion] : []);

  if (emotions.length > 0) {
    const labels = emotions.map((e) => {
      const emoji = EMOTION_CONFIG[e]?.emoji ?? "";
      return `${emoji} ${e}`;
    });
    parts.push(`<p><strong>Emotion${emotions.length > 1 ? "s" : ""}:</strong> ${labels.join(", ")}</p>`);
  }
  if (data.custom_emotion) {
    parts.push(`<p><strong>Emotional State:</strong> ${data.custom_emotion}</p>`);
  }
  if (data.confidence != null) {
    parts.push(`<p><strong>Confidence:</strong> ${data.confidence}/10</p>`);
  }
  if (data.process_score != null) {
    parts.push(`<p><strong>Process Score:</strong> ${data.process_score}/10</p>`);
  }

  if (parts.length === 0) return "";
  return `<div class="psych-insights-block">${parts.join("")}</div>`;
}

export function serializeToHtml(templateId: string, data: Record<string, string | number | null>): string {
  const fields = TEMPLATE_FIELDS[templateId];
  if (!fields) return "";

  const parts: string[] = [];

  for (const field of fields) {
    const value = data[field.key];
    if (value === null || value === undefined || value === "") continue;

    let label: string;
    let displayValue: string;

    switch (field.type) {
      case "emotion": {
        label = field.label ?? "Emotion";
        if (field.mode === "multi") {
          const raw = value as string;
          const emotions: string[] = raw.startsWith("[") ? JSON.parse(raw) : [raw];
          if (emotions.length === 0) continue;
          const labels = emotions.map((e) => `${EMOTION_CONFIG[e]?.emoji ?? ""} ${e}`);
          displayValue = labels.join(", ");
          const customText = data[field.key + "_custom"];
          if (customText) displayValue += `<br/><em>${customText}</em>`;
        } else {
          const emoji = EMOTION_CONFIG[value as string]?.emoji ?? "";
          displayValue = `${emoji} ${value}`;
        }
        break;
      }
      case "confidence":
        label = "Confidence";
        displayValue = `${value}/10`;
        break;
      case "process-score":
        label = "Process Score";
        displayValue = `${value}/10`;
        break;
      case "setup-type":
        label = "Setup Type";
        displayValue = String(value);
        break;
      case "textarea":
        label = field.label;
        displayValue = String(value);
        break;
      case "text":
        label = field.label;
        displayValue = field.prefix ? `${field.prefix}${value}` : String(value);
        break;
      case "number":
        label = field.label;
        displayValue = field.prefix ? `${field.prefix}${value}` : String(value);
        break;
      case "checklist": {
        label = field.label;
        const checks: Record<string, boolean> = JSON.parse(value as string);
        const items = field.items.map((item) => {
          const checked = checks[item] ?? false;
          return `<li>${checked ? "\u2705" : "\u274c"} ${item}</li>`;
        });
        displayValue = `<ul>${items.join("")}</ul>`;
        break;
      }
    }

    parts.push(`<h2>${label}</h2><p>${displayValue}</p>`);
  }

  return parts.join("");
}
