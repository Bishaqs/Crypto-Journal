"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, Check } from "lucide-react";

interface FeatureInfoBoxProps {
  variant: "dashboard" | "simulator";
  title: string;
  tagline: string;
  description: string;
  capabilities: string[];
  valueProp: string;
}

export function FeatureInfoBox({
  variant,
  title,
  tagline,
  description,
  capabilities,
  valueProp,
}: FeatureInfoBoxProps) {
  const [expanded, setExpanded] = useState(false);

  if (variant === "simulator") {
    return (
      <div className="mx-4 my-2">
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {/* Collapsed bar */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Lightbulb size={14} className="text-amber-400 shrink-0" />
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex-1 flex items-center gap-2 text-left min-w-0"
            >
              <span className="text-xs font-semibold text-white/90 shrink-0">{title}</span>
              <span className="text-[11px] text-white/40 truncate">{tagline}</span>
              {expanded ? (
                <ChevronUp size={12} className="text-white/30 shrink-0 ml-auto" />
              ) : (
                <ChevronDown size={12} className="text-white/30 shrink-0 ml-auto" />
              )}
            </button>
          </div>

          {/* Expanded content */}
          {expanded && (
            <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
              <p className="text-[11px] text-white/60 leading-relaxed">{description}</p>
              <div className="space-y-1.5">
                {capabilities.map((cap) => (
                  <div key={cap} className="flex items-start gap-2">
                    <Check size={10} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-[11px] text-white/50">{cap}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-amber-400/70 leading-relaxed italic">{valueProp}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard variant
  return (
    <div className="rounded-2xl border border-accent/20 bg-accent/5 overflow-hidden border-l-2 border-l-accent">
      {/* Collapsed bar */}
      <div className="flex items-center gap-3 px-5 py-3">
        <Lightbulb size={16} className="text-accent shrink-0" />
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <span className="text-sm font-semibold text-foreground shrink-0">{title}</span>
          <span className="text-xs text-muted truncate">{tagline}</span>
          {expanded ? (
            <ChevronUp size={14} className="text-muted shrink-0 ml-auto" />
          ) : (
            <ChevronDown size={14} className="text-muted shrink-0 ml-auto" />
          )}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-accent/10 space-y-3">
          <p className="text-xs text-muted leading-relaxed">{description}</p>
          <div className="space-y-1.5">
            {capabilities.map((cap) => (
              <div key={cap} className="flex items-start gap-2">
                <Check size={12} className="text-accent mt-0.5 shrink-0" />
                <span className="text-xs text-muted/80">{cap}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-accent/70 leading-relaxed italic">{valueProp}</p>
        </div>
      )}
    </div>
  );
}
