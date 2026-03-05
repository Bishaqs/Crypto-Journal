"use client";

// SVG Stargate portal logo — 2 concentric rings with glowing center
// Uses var(--accent) so it adapts to the active theme/page overrides

export function StargateLogo({ size = 32, collapsed = false }: { size?: number; collapsed?: boolean }) {
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
        <radialGradient id="portalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-hover)" stopOpacity="0.9" />
          <stop offset="40%" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      {/* Subtle outer glow */}
      <circle cx="20" cy="20" r="19.5" fill="url(#outerGlow)" />
      {/* Outer ring — solid, thin */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="var(--accent)"
        strokeWidth="1"
        opacity="0.7"
        className="stargate-ring"
        style={{ transformOrigin: "20px 20px" }}
      />
      {/* Inner ring */}
      <circle
        cx="20"
        cy="20"
        r="9"
        stroke="var(--accent)"
        strokeWidth="1.2"
        opacity="0.5"
      />
      {/* Portal glow center */}
      <circle cx="20" cy="20" r="6" fill="url(#portalGlow)" />
      {/* Chevrons — 6 evenly spaced */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = 20 + 18 * Math.cos(rad);
        const y = 20 + 18 * Math.sin(rad);
        return (
          <circle
            key={angle}
            cx={x}
            cy={y}
            r="1.2"
            fill="var(--accent)"
            opacity={0.85}
          />
        );
      })}
    </svg>
    </div>
  );
}
