"use client";

import { useId } from "react";

// Refined Traverse portal logo — golden-ratio rings with chevron marks
// Uses var(--accent) so it adapts to the active theme

export function TraverseLogo({ size = 32, collapsed = false }: { size?: number; collapsed?: boolean }) {
  const id = useId();
  const glowId = `${id}-glow`;

  return (
    <div className="p-0.5 -m-0.5 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_10px_var(--accent-glow)] cursor-pointer">
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className="shrink-0"
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-hover)" stopOpacity="0.95" />
          <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Ambient halo */}
      <circle cx="20" cy="20" r="19" stroke="var(--accent)" strokeWidth="0.5" opacity="0.15" />
      {/* Outer ring */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="var(--accent)"
        strokeWidth="0.75"
        opacity="0.6"
        className="stargate-ring"
        style={{ transformOrigin: "20px 20px" }}
      />
      {/* Inner ring — golden ratio (18 / 1.618 ≈ 11.1) */}
      <circle
        cx="20"
        cy="20"
        r="11.1"
        stroke="var(--accent)"
        strokeWidth="1"
        opacity="0.7"
      />
      {/* Center glow — tight, jewel-like */}
      <circle cx="20" cy="20" r="4.5" fill={`url(#${glowId})`} />
      {/* Chevron marks — 6 inward-pointing V shapes */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = 20 + 18 * Math.cos(rad);
        const y = 20 + 18 * Math.sin(rad);
        return (
          <path
            key={angle}
            d="M-1.4,-1.5 L0,1.5 L1.4,-1.5"
            transform={`translate(${x},${y}) rotate(${angle + 90})`}
            stroke="var(--accent)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.85"
          />
        );
      })}
    </svg>
    </div>
  );
}
