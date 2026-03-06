"use client";

import { useLevel } from "@/lib/xp";
import { useCosmetics, renderCosmeticIcon } from "@/lib/cosmetics";
import type { CosmeticRarity } from "@/lib/cosmetics";
import { getAccentDef } from "@/lib/cosmetics/accent-map";

const RARITY_TEXT: Record<CosmeticRarity, string> = {
  common: "text-gray-400",
  uncommon: "text-emerald-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

/**
 * Character-sheet style preview card showing all equipped cosmetics together.
 */
export function ProfileCard({ displayName }: { displayName: string }) {
  const { level, totalXP, xpProgress } = useLevel();
  const { equipped, getDefinition } = useCosmetics();

  const frameDef = equipped.avatar_frame ? getDefinition(equipped.avatar_frame) : undefined;
  const flairDef = equipped.sidebar_flair ? getDefinition(equipped.sidebar_flair) : undefined;
  const bannerDef = equipped.banner ? getDefinition(equipped.banner) : undefined;
  const titleDef = equipped.title_badge ? getDefinition(equipped.title_badge) : undefined;
  const iconDef = equipped.avatar_icon ? getDefinition(equipped.avatar_icon) : undefined;
  const accentDef = equipped.theme_accent ? getAccentDef(equipped.theme_accent) : undefined;

  const frameCss = frameDef?.css_class ?? "";
  const flairCss = flairDef?.css_class ?? "";
  const bannerCss = bannerDef?.css_class ?? "";
  const iconCss = iconDef?.css_class ?? null;

  const avatarSize = 80;
  const outerSize = 96;

  return (
    <div
      className="glass rounded-2xl border border-border/50 overflow-hidden relative"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Banner gradient overlay */}
      <div
        className={`absolute inset-0 ${bannerCss}`}
        style={{ opacity: bannerCss ? 0.5 : 0 }}
      />

      <div className="relative z-10 p-8 flex items-center gap-6">
        {/* Avatar with frame + flair */}
        <div
          className="relative shrink-0"
          style={{ width: outerSize, height: outerSize, overflow: "visible" }}
        >
          {/* Flair behind */}
          {flairCss && (
            <div
              className={`absolute rounded-full ${flairCss}`}
              style={{ inset: -4, zIndex: 0 }}
            />
          )}

          {/* Frame */}
          {frameCss && (
            <div
              className={`absolute rounded-full ${frameCss}`}
              style={{ inset: 6, zIndex: 1 }}
            />
          )}

          {/* Avatar circle */}
          <div
            className="absolute rounded-full bg-surface border border-border/50 flex items-center justify-center"
            style={{
              inset: (outerSize - avatarSize) / 2,
              zIndex: 2,
              width: avatarSize,
              height: avatarSize,
            }}
          >
            {iconCss ? (
              <span className="text-accent">
                {renderCosmeticIcon(iconCss, 32)}
              </span>
            ) : (
              <span className="text-xl font-bold text-foreground">{level}</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-foreground truncate">
            {displayName || "Trader"}
          </h2>
          {titleDef && (
            <p className={`text-sm font-semibold ${RARITY_TEXT[titleDef.rarity]}`}>
              {titleDef.name}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted">
            <span>Level {level}</span>
            <span className="text-border">·</span>
            <span>{totalXP.toLocaleString()} XP</span>
            <span className="text-border">·</span>
            <span>{Math.round(xpProgress)}% to next</span>
          </div>
          {accentDef && (
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: accentDef.accent }}
              />
              <span className="text-[10px] text-muted">{accentDef.label} Accent</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
