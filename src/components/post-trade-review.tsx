"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { DEFENSE_MECHANISMS } from "@/lib/validators";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const YES_NO_QUESTIONS = [
  { key: "followed_entry_rules", label: "Did I follow my entry rules?" },
  { key: "followed_exit_rules", label: "Did I follow my exit rules?" },
  { key: "moved_stop", label: "Did I move my stop-loss?" },
];

const TEXT_QUESTIONS = [
  { key: "did_well", label: "What did I do well?", placeholder: "Even on a losing trade..." },
  { key: "improve", label: "One thing to improve:", placeholder: "Specific and actionable" },
];

export function PostTradeReview({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (review: Record<string, string>) => void;
}) {
  const { isExpert } = usePsychologyTier();
  const [expanded, setExpanded] = useState(false);
  const answeredCount = Object.values(value).filter((v) => v && v.length > 0).length;
  const totalCount = YES_NO_QUESTIONS.length + TEXT_QUESTIONS.length + (isExpert ? 1 : 0);

  function update(key: string, val: string) {
    onChange({ ...value, [key]: val });
  }

  function toggleDefenseMechanism(dmId: string) {
    const current = value.defense_mechanisms ?? "";
    const list = current ? current.split(",") : [];
    const next = list.includes(dmId)
      ? list.filter((d) => d !== dmId)
      : [...list, dmId];
    update("defense_mechanisms", next.join(","));
  }

  const selectedMechanisms = (value.defense_mechanisms ?? "").split(",").filter(Boolean);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-background hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} className={answeredCount > 0 ? "text-accent" : "text-muted"} />
          <span className="text-xs font-medium text-foreground flex items-center gap-1">
            Post-Trade Review
            <InfoTooltip text="Reflecting on each trade builds self-awareness. Your AI coach uses these answers to detect patterns in rule-breaking and improvement areas." size={11} articleId="tj-post-trade-review" />
          </span>
          {answeredCount > 0 && (
            <span className="text-[10px] text-muted">
              {answeredCount}/{totalCount}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-muted" />
        ) : (
          <ChevronDown size={14} className="text-muted" />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-4 border-t border-border bg-surface">
          {/* Yes/No questions */}
          {YES_NO_QUESTIONS.map((q) => (
            <div key={q.key}>
              <label className="block text-xs text-muted mb-1.5">{q.label}</label>
              <div className="flex gap-2">
                {["Yes", "No"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => update(q.key, option)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      value[q.key] === option
                        ? option === "Yes"
                          ? "bg-win/10 border-win/30 text-win"
                          : "bg-loss/10 border-loss/30 text-loss"
                        : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Text questions */}
          {TEXT_QUESTIONS.map((q) => (
            <div key={q.key}>
              <label className="block text-xs text-muted mb-1.5">{q.label}</label>
              <input
                type="text"
                value={value[q.key] ?? ""}
                onChange={(e) => update(q.key, e.target.value)}
                placeholder={q.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
              />
            </div>
          ))}

          {/* Expert: Defense Mechanisms */}
          {isExpert && (
            <div>
              <label className="block text-xs text-muted mb-1.5">Defense mechanisms used?</label>
              <div className="flex flex-wrap gap-1.5">
                {DEFENSE_MECHANISMS.map((dm) => (
                  <button
                    key={dm.id}
                    type="button"
                    onClick={() => toggleDefenseMechanism(dm.id)}
                    title={dm.example}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                      selectedMechanisms.includes(dm.id)
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                        : "bg-background border-border text-muted hover:border-accent/20"
                    }`}
                  >
                    {dm.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
