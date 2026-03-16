"use client";

import { useState } from "react";
import { SOMATIC_AREAS } from "@/lib/validators";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { SomaticArea, SomaticIntensity } from "@/lib/types";

const INTENSITY_OPTIONS: { id: SomaticIntensity; label: string; color: string }[] = [
  { id: "light", label: "Light", color: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400" },
  { id: "moderate", label: "Moderate", color: "bg-orange-500/15 border-orange-500/30 text-orange-400" },
  { id: "strong", label: "Strong", color: "bg-red-500/15 border-red-500/30 text-red-400" },
];

// Body region positions (relative to SVG viewBox 0 0 100 200)
const REGION_POSITIONS: Record<string, { cx: number; cy: number; r: number }> = {
  jaw: { cx: 50, cy: 22, r: 8 },
  shoulders: { cx: 50, cy: 52, r: 14 },
  chest: { cx: 50, cy: 72, r: 12 },
  stomach: { cx: 50, cy: 95, r: 11 },
  hands: { cx: 50, cy: 130, r: 8 },
};

export function SomaticBodyMap({
  areas,
  onAreasChange,
  intensity,
  onIntensityChange,
}: {
  areas: SomaticArea[];
  onAreasChange: (areas: SomaticArea[]) => void;
  intensity: SomaticIntensity | null;
  onIntensityChange: (intensity: SomaticIntensity | null) => void;
}) {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  function toggleArea(area: SomaticArea) {
    if (area === "none") {
      onAreasChange(["none"]);
      onIntensityChange(null);
      return;
    }
    const filtered = areas.filter((a) => a !== "none");
    if (filtered.includes(area)) {
      const next = filtered.filter((a) => a !== area);
      onAreasChange(next.length === 0 ? [] : next);
    } else {
      onAreasChange([...filtered, area]);
    }
  }

  const hasAreas = areas.length > 0 && !areas.includes("none");

  return (
    <div>
      <label className="block text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
        Where do you feel tension?
        <InfoTooltip text="Your body knows before your mind does. Research shows physical tension predicts trading mistakes. Track where you feel it to build a somatic early-warning system." size={10} articleId="tj-somatic-body-map" />
      </label>

      <div className="flex gap-4">
        {/* Body silhouette */}
        <div className="relative w-24 flex-shrink-0">
          <svg viewBox="0 0 100 200" className="w-full h-auto">
            {/* Simple body outline */}
            {/* Head */}
            <circle cx="50" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
            {/* Neck */}
            <line x1="50" y1="27" x2="50" y2="35" stroke="currentColor" strokeWidth="1" className="text-border" />
            {/* Torso */}
            <path d="M 30 35 L 70 35 L 65 110 L 35 110 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
            {/* Arms */}
            <path d="M 30 35 L 15 80 L 12 120" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
            <path d="M 70 35 L 85 80 L 88 120" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
            {/* Legs */}
            <path d="M 35 110 L 30 170 L 25 195" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
            <path d="M 65 110 L 70 170 L 75 195" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />

            {/* Tappable regions */}
            {Object.entries(REGION_POSITIONS).map(([key, pos]) => {
              const isActive = areas.includes(key as SomaticArea);
              const isHovered = hoveredArea === key;
              return (
                <g key={key}>
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r={pos.r}
                    fill={isActive ? "rgba(0,180,216,0.25)" : isHovered ? "rgba(0,180,216,0.1)" : "transparent"}
                    stroke={isActive ? "rgba(0,180,216,0.6)" : isHovered ? "rgba(0,180,216,0.3)" : "transparent"}
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => toggleArea(key as SomaticArea)}
                    onMouseEnter={() => setHoveredArea(key)}
                    onMouseLeave={() => setHoveredArea(null)}
                  />
                  {isActive && (
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r={pos.r + 2}
                      fill="none"
                      stroke="rgba(0,180,216,0.3)"
                      strokeWidth="1"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Area buttons + intensity */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {SOMATIC_AREAS.map((area) => {
              const isActive = areas.includes(area.id as SomaticArea);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => toggleArea(area.id as SomaticArea)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    isActive
                      ? area.id === "none"
                        ? "bg-win/10 border-win/30 text-win"
                        : "bg-accent/15 border-accent/30 text-accent"
                      : "bg-background border-border text-muted hover:border-accent/20"
                  }`}
                >
                  <span>{area.emoji}</span>
                  {area.label}
                </button>
              );
            })}
          </div>

          {/* Intensity selector */}
          {hasAreas && (
            <div>
              <label className="block text-[9px] text-muted/50 mb-1">Intensity</label>
              <div className="flex gap-1.5">
                {INTENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onIntensityChange(intensity === opt.id ? null : opt.id)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                      intensity === opt.id ? opt.color : "bg-background border-border text-muted hover:border-accent/20"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
