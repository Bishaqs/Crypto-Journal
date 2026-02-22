"use client";

// SVG Stargate portal logo — concentric rings with a glowing center
// Uses var(--accent) so it adapts to the active theme/page overrides

export function StargateLogo({ size = 32, collapsed = false }: { size?: number; collapsed?: boolean }) {
  return (
    <div className="p-1 -m-1 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_12px_var(--accent-glow)] cursor-pointer">
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className="shrink-0"
    >
      {/* Outer ring */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        className="stargate-ring"
        style={{ transformOrigin: "20px 20px" }}
      />
      {/* Middle ring */}
      <circle
        cx="20"
        cy="20"
        r="13"
        stroke="var(--accent)"
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Inner ring */}
      <circle
        cx="20"
        cy="20"
        r="8"
        stroke="var(--accent)"
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* Portal glow center */}
      <circle cx="20" cy="20" r="5" fill="url(#portalGlow)" />
      {/* Chevrons (notches on outer ring) */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = 20 + 18 * Math.cos(rad);
        const y = 20 + 18 * Math.sin(rad);
        return (
          <circle
            key={angle}
            cx={x}
            cy={y}
            r="1.5"
            fill="var(--accent)"
            opacity={0.8}
          />
        );
      })}
      <defs>
        <radialGradient id="portalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-hover)" stopOpacity="0.8" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
    </div>
  );
}
