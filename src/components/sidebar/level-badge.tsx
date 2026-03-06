"use client";

import Link from "next/link";
import { useLevel } from "@/lib/xp";
import { useCosmetics, renderCosmeticIcon } from "@/lib/cosmetics";

/**
 * Circular level badge with XP progress ring, equipped frame, flair, and avatar icon.
 * Displayed in the sidebar rail below the logo. Clicks navigate to /dashboard/profile.
 */
export function LevelBadge() {
  const { level, xpProgress, loading } = useLevel();
  const { equipped, getDefinition } = useCosmetics();

  if (loading) return null;

  // Resolve equipped cosmetic CSS classes
  const frameDef = equipped.avatar_frame ? getDefinition(equipped.avatar_frame) : undefined;
  const flairDef = equipped.sidebar_flair ? getDefinition(equipped.sidebar_flair) : undefined;
  const iconDef = equipped.avatar_icon ? getDefinition(equipped.avatar_icon) : undefined;
  const frameCss = frameDef?.css_class ?? null;
  const flairCss = flairDef?.css_class ?? null;
  const iconCss = iconDef?.css_class ?? null;

  // SVG circle math
  const size = 40;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (xpProgress / 100) * circumference;

  // Outer container is larger to fit frame + flair without clipping
  const outerSize = 52;

  return (
    <Link
      href="/dashboard/profile"
      className="flex flex-col items-center gap-0.5 group"
      title={`Level ${level} — ${Math.round(xpProgress)}% to next`}
    >
      <div
        className="relative group-hover:scale-110 transition-transform duration-200"
        style={{ width: outerSize, height: outerSize, overflow: "visible" }}
      >
        {/* Flair effect layer (behind everything) */}
        {flairCss && (
          <div
            className={`absolute rounded-full ${flairCss}`}
            style={{
              inset: -2,
              zIndex: 0,
            }}
          />
        )}

        {/* Frame effect layer */}
        {frameCss && (
          <div
            className={`absolute rounded-full ${frameCss}`}
            style={{
              inset: 4,
              zIndex: 1,
            }}
          />
        )}

        {/* SVG progress arc */}
        <svg
          width={size}
          height={size}
          className="absolute -rotate-90"
          style={{
            left: (outerSize - size) / 2,
            top: (outerSize - size) / 2,
            zIndex: 2,
          }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: "drop-shadow(0 0 4px var(--accent-glow))",
            }}
          />
        </svg>

        {/* Avatar icon or level number */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 3 }}
        >
          {iconCss ? (
            <span className="text-accent">
              {renderCosmeticIcon(iconCss, 18)}
            </span>
          ) : (
            <span className="text-xs font-bold text-foreground leading-none">
              {level}
            </span>
          )}
        </div>
      </div>
      <span className="text-[8px] font-semibold text-muted uppercase tracking-widest">
        LVL
      </span>
    </Link>
  );
}
