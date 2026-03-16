"use client";

import { useState } from "react";
import { COGNITIVE_DISTORTIONS } from "@/lib/validators";
import type { CognitiveDistortion } from "@/lib/types";
import { Info } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function CognitiveDistortionPicker({
  value,
  onChange,
}: {
  value: CognitiveDistortion[];
  onChange: (distortions: CognitiveDistortion[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggle(id: CognitiveDistortion) {
    onChange(
      value.includes(id)
        ? value.filter((d) => d !== id)
        : [...value, id]
    );
  }

  return (
    <div>
      <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
        Thinking Traps Active Right Now?
        <InfoTooltip text="Cognitive distortions are systematic thinking errors identified by psychologists. Trading-specific distortions cause 60%+ of unforced trading losses. Naming them in real-time is the most effective defense." size={10} articleId="tj-cognitive-distortions" />
      </label>
      <p className="text-[10px] text-muted/50 mb-2">
        Tap to select any cognitive distortions you notice. Tap <Info size={10} className="inline" /> for examples.
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {COGNITIVE_DISTORTIONS.map((d) => {
          const isSelected = value.includes(d.id as CognitiveDistortion);
          const isExpanded = expandedId === d.id;
          return (
            <div key={d.id} className="relative">
              <button
                type="button"
                onClick={() => toggle(d.id as CognitiveDistortion)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-[10px] font-medium border transition-all ${
                  isSelected
                    ? "bg-purple-500/15 border-purple-500/30 text-purple-400"
                    : "bg-background border-border text-muted hover:border-accent/20 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{d.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : d.id);
                    }}
                    className="p-0.5 rounded text-muted/50 hover:text-accent transition-colors"
                  >
                    <Info size={10} />
                  </button>
                </div>
              </button>
              {isExpanded && (
                <div className="absolute z-10 left-0 right-0 top-full mt-1 px-2.5 py-2 rounded-lg bg-card border border-border text-[9px] text-muted shadow-lg">
                  &quot;{d.example}&quot;
                </div>
              )}
            </div>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="mt-2 text-[10px] text-purple-400/70">
          {value.length} distortion{value.length > 1 ? "s" : ""} identified — awareness is the first step
        </p>
      )}
    </div>
  );
}
