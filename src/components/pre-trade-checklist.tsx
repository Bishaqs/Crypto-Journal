"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";

const DEFAULT_CHECKLIST_ITEMS = [
  { key: "on_plan", label: "Is this trade on my watchlist/plan?" },
  { key: "stop_loss", label: "Have I set a specific stop-loss price?" },
  { key: "invalidation", label: "Do I know what would make this trade wrong?" },
  { key: "not_reacting", label: "Am I trading my plan, not reacting to the market?" },
];

export function PreTradeChecklist({
  value,
  onChange,
}: {
  value: Record<string, boolean>;
  onChange: (checklist: Record<string, boolean>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const checkedCount = Object.values(value).filter(Boolean).length;
  const allChecked = checkedCount === DEFAULT_CHECKLIST_ITEMS.length;

  function toggle(key: string) {
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-background hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          {allChecked ? (
            <CheckCircle2 size={16} className="text-win" />
          ) : (
            <Circle size={16} className="text-muted" />
          )}
          <span className="text-xs font-medium text-foreground">
            Pre-Trade Checklist
          </span>
          <span className="text-[10px] text-muted">
            {checkedCount}/{DEFAULT_CHECKLIST_ITEMS.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-muted" />
        ) : (
          <ChevronDown size={14} className="text-muted" />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-2 border-t border-border bg-surface">
          {DEFAULT_CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                onClick={(e) => {
                  e.preventDefault();
                  toggle(item.key);
                }}
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                  value[item.key]
                    ? "bg-accent border-accent"
                    : "border-border group-hover:border-accent/30"
                }`}
              >
                {value[item.key] && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background" />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs transition-colors ${
                  value[item.key] ? "text-foreground" : "text-muted"
                }`}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
