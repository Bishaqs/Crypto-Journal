"use client";

import { EmotionPicker, ConfidenceSlider, ProcessScoreInput, SetupTypePicker, EMOTION_CONFIG } from "@/components/psychology-inputs";
import { RichTextArea } from "@/components/note-editor/rich-text-area";

type FieldDef =
  | { type: "textarea"; key: string; label: string; placeholder?: string }
  | { type: "text"; key: string; label: string; placeholder?: string; prefix?: string }
  | { type: "number"; key: string; label: string; placeholder?: string; prefix?: string }
  | { type: "emotion"; key: string; label?: string }
  | { type: "confidence"; key: string }
  | { type: "process-score"; key: string }
  | { type: "setup-type"; key: string };

const TEMPLATE_FIELDS: Record<string, FieldDef[]> = {
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
    { type: "emotion", key: "emotion", label: "How are you feeling this morning?" },
    { type: "confidence", key: "confidence" },
    { type: "textarea", key: "market_conditions", label: "Market conditions", placeholder: "Overall trend, key events, sentiment..." },
    { type: "textarea", key: "watchlist", label: "Watchlist", placeholder: "Tickers, setups, key levels..." },
    { type: "number", key: "max_trades", label: "Max trades today", placeholder: "e.g. 3" },
    { type: "number", key: "max_loss", label: "Max loss today", prefix: "$", placeholder: "e.g. 500" },
    { type: "textarea", key: "focus", label: "Focus for today", placeholder: "What's the one thing you'll focus on?" },
  ],
  "weekly-recap": [
    { type: "text", key: "pnl", label: "This week's P&L", prefix: "$", placeholder: "e.g. +1,250 or -300" },
    { type: "textarea", key: "best_trade", label: "Best trade", placeholder: "Describe your best trade this week..." },
    { type: "textarea", key: "worst_trade", label: "Worst trade", placeholder: "Describe your worst trade this week..." },
    { type: "emotion", key: "emotion", label: "Dominant emotion this week" },
    { type: "process-score", key: "process_score" },
    { type: "textarea", key: "improve", label: "One thing to improve next week", placeholder: "Specific and actionable..." },
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
  if (!fields) return null;

  function update(key: string, value: string | number | null) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        switch (field.type) {
          case "emotion":
            return (
              <EmotionPicker
                key={field.key}
                value={(data[field.key] as string) ?? null}
                onChange={(v) => update(field.key, v)}
                label={field.label}
              />
            );
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
        }
      })}
    </div>
  );
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
        const emoji = EMOTION_CONFIG[value as string]?.emoji ?? "";
        displayValue = `${emoji} ${value}`;
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
    }

    parts.push(`<h2>${label}</h2><p>${displayValue}</p>`);
  }

  return parts.join("");
}
