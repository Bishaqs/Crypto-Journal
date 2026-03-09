"use client";

import { useMemo } from "react";
import { Lock, ChevronRight } from "lucide-react";
import { useLevel } from "@/lib/xp";
import { useCosmetics, renderCosmeticIcon } from "@/lib/cosmetics";
import type { CosmeticDefinition, CosmeticRarity, UnlockCondition } from "@/lib/cosmetics";
import { getAccentDef } from "@/lib/cosmetics/accent-map";

const RARITY_TEXT: Record<CosmeticRarity, string> = {
  common: "text-gray-400",
  uncommon: "text-emerald-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
  mythic: "text-red-400",
};

const TYPE_EMOJI: Record<string, string> = {
  avatar_frame: "Frame",
  banner: "Banner",
  title_badge: "Title",
  sidebar_flair: "Flair",
  avatar_icon: "Icon",
  theme_accent: "Accent",
  name_style: "Name",
};

function SmallPreview({ cosmetic }: { cosmetic: CosmeticDefinition }) {
  switch (cosmetic.type) {
    case "avatar_icon":
      return cosmetic.css_class ? (
        <span className="text-accent">{renderCosmeticIcon(cosmetic.css_class, 16)}</span>
      ) : null;
    case "theme_accent": {
      const ad = cosmetic.css_class ? getAccentDef(cosmetic.css_class) : undefined;
      return (
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: ad?.accent ?? "var(--accent)" }}
        />
      );
    }
    case "avatar_frame":
      return (
        <div
          className={`w-5 h-5 rounded-full bg-surface ${cosmetic.css_class ?? ""}`}
          style={{ overflow: "visible" }}
        />
      );
    case "banner":
      return <div className={`w-8 h-3 rounded ${cosmetic.css_class ?? ""}`} />;
    case "sidebar_flair":
      return (
        <div
          className={`w-4 h-4 rounded-full bg-accent/20 ${cosmetic.css_class ?? ""}`}
          style={{ overflow: "visible" }}
        />
      );
    case "name_style":
      return (
        <span className={`text-[10px] font-bold ${cosmetic.css_class ?? "text-foreground"}`}>
          Aa
        </span>
      );
    default:
      return <Lock size={12} className="text-muted/40" />;
  }
}

/**
 * Compact widget showing the next 5 level-based unlocks.
 */
export function NextUnlocks({ onViewRoadmap }: { onViewRoadmap: () => void }) {
  const { level, xpToNext } = useLevel();
  const { definitions, isOwned } = useCosmetics();

  const nextUnlocks = useMemo(() => {
    return definitions
      .filter((d) => {
        const cond = d.unlock_condition as UnlockCondition;
        return cond.type === "level" && cond.value > level && !isOwned(d.id);
      })
      .sort((a, b) => {
        const aLv = (a.unlock_condition as { value: number }).value;
        const bLv = (b.unlock_condition as { value: number }).value;
        return aLv - bLv;
      })
      .slice(0, 5);
  }, [definitions, level, isOwned]);

  const nextLevel = nextUnlocks.length > 0
    ? (nextUnlocks[0].unlock_condition as { value: number }).value
    : null;

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Next Unlocks</h3>
        {nextLevel && (
          <span className="text-[10px] text-muted">
            {xpToNext.toLocaleString()} XP to Level {level + 1}
          </span>
        )}
      </div>

      {nextUnlocks.length === 0 ? (
        <p className="text-xs text-muted text-center py-4">
          All level rewards unlocked!
        </p>
      ) : (
        <div className="space-y-2.5">
          {nextUnlocks.map((cosmetic) => {
            const unlockLevel = (cosmetic.unlock_condition as { value: number }).value;
            const levelsAway = unlockLevel - level;

            return (
              <div
                key={cosmetic.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background/50 border border-border/30"
              >
                <div className="w-6 flex items-center justify-center" style={{ overflow: "visible" }}>
                  <SmallPreview cosmetic={cosmetic} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {cosmetic.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-semibold ${RARITY_TEXT[cosmetic.rarity]}`}>
                      {TYPE_EMOJI[cosmetic.type]}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-accent">Lv {unlockLevel}</p>
                  <p className="text-[9px] text-muted">
                    {levelsAway === 1 ? "Next level!" : `${levelsAway} levels`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onViewRoadmap}
        className="mt-4 w-full py-2 rounded-xl border border-border text-xs font-semibold text-muted hover:text-foreground hover:border-accent/30 transition-all flex items-center justify-center gap-1"
      >
        View Full Roadmap
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
