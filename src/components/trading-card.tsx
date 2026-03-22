"use client";

import type { ArchetypeInfo } from "@/lib/psychology-scoring";

interface TradingCardProps {
  archetypeInfo: ArchetypeInfo;
  tagline?: string;
  topStrength?: string;
  topBlindSpot?: string;
  size?: "full" | "compact";
}

const ARCHETYPE_EMOJI: Record<string, string> = {
  disciplined_strategist: "chess_pawn",
  intuitive_risk_taker: "fire",
  cautious_perfectionist: "shield",
  emotional_reactor: "zap",
  adaptive_analyst: "target",
  status_driven_competitor: "trophy",
  resilient_survivor: "anchor",
  anxious_overthinker: "brain",
};

export function TradingCard({
  archetypeInfo,
  tagline,
  topStrength,
  topBlindSpot,
  size = "full",
}: TradingCardProps) {
  const isCompact = size === "compact";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#0a0f1e] to-[#0c1425] ${
        isCompact ? "p-4 max-w-[320px]" : "p-8 max-w-[480px]"
      }`}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400/60">
            Trading Psychology
          </span>
        </div>

        <h3
          className={`font-bold text-white ${
            isCompact ? "text-xl mb-1" : "text-3xl mb-2"
          }`}
        >
          {archetypeInfo.name}
        </h3>

        {tagline && (
          <p
            className={`text-cyan-400 font-medium italic ${
              isCompact ? "text-xs mb-3" : "text-sm mb-4"
            }`}
          >
            &ldquo;{tagline}&rdquo;
          </p>
        )}

        {!isCompact && (
          <p className="text-white/50 text-sm leading-relaxed mb-6 line-clamp-3">
            {archetypeInfo.description}
          </p>
        )}

        {/* Strengths & Blind Spots */}
        <div className={`grid grid-cols-2 gap-3 ${isCompact ? "mb-3" : "mb-6"}`}>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-green-400/70 mb-1.5">
              Top Strength
            </p>
            <p className={`text-white font-medium ${isCompact ? "text-xs" : "text-sm"}`}>
              {topStrength ?? archetypeInfo.strengths[0]}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400/70 mb-1.5">
              Top Blind Spot
            </p>
            <p className={`text-white font-medium ${isCompact ? "text-xs" : "text-sm"}`}>
              {topBlindSpot ?? archetypeInfo.blindSpots[0]}
            </p>
          </div>
        </div>

        {/* Full size: show all strengths and blind spots */}
        {!isCompact && (
          <div className="space-y-3 mb-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-green-400/60 mb-2">
                Strengths
              </p>
              <div className="space-y-1">
                {archetypeInfo.strengths.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                    <span className="text-green-400 shrink-0 mt-0.5">&#10003;</span>
                    {s}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400/60 mb-2">
                Blind Spots
              </p>
              <div className="space-y-1">
                {archetypeInfo.blindSpots.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0 mt-0.5">&#9888;</span>
                    {s}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">
            Traverse Journal
          </span>
          <span className="text-[10px] font-mono text-cyan-400/40">
            traversejournal.com
          </span>
        </div>
      </div>
    </div>
  );
}
