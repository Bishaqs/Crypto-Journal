"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowUp } from "lucide-react";
import { useLevel } from "@/lib/xp";
import { useCosmetics, renderCosmeticIcon } from "@/lib/cosmetics";
import { getAccentDef } from "@/lib/cosmetics/accent-map";
import type { UnlockCondition, CosmeticRarity } from "@/lib/cosmetics/types";

/**
 * Toast notification when user levels up.
 * Appears top-center with celebration animation.
 */
const RARITY_TEXT: Record<CosmeticRarity, string> = {
  common: "text-gray-400",
  uncommon: "text-emerald-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
  mythic: "text-red-400",
};

export function LevelUpToast() {
  const { recentLevelUp, dismissLevelUp } = useLevel();
  const { definitions } = useCosmetics();
  const [visible, setVisible] = useState(false);

  // Find cosmetics unlocked at this level
  const unlocked = useMemo(() => {
    if (recentLevelUp === null) return [];
    return definitions.filter((d) => {
      const cond = d.unlock_condition as UnlockCondition;
      return cond.type === "level" && cond.value === recentLevelUp;
    });
  }, [recentLevelUp, definitions]);

  useEffect(() => {
    if (recentLevelUp !== null) {
      setVisible(true);
      const duration = unlocked.length > 0 ? 5500 : 4000;
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(dismissLevelUp, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [recentLevelUp, dismissLevelUp, unlocked.length]);

  if (recentLevelUp === null) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[250] transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-4 scale-95"
      }`}
    >
      <div
        className="glass rounded-2xl border border-accent/40 px-6 py-4 flex items-center gap-4"
        style={{
          boxShadow:
            "0 0 30px var(--accent-glow), 0 0 60px var(--accent-glow), var(--shadow-card)",
        }}
      >
        {/* Animated arrow icon */}
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center animate-bounce">
          <ArrowUp size={20} className="text-accent" />
        </div>

        <div>
          <p className="text-[10px] font-semibold text-accent uppercase tracking-widest">
            Level Up!
          </p>
          <p className="text-xl font-bold text-foreground">
            Level {recentLevelUp}
          </p>
          {unlocked.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-[10px] text-muted">Unlocked:</span>
              {unlocked.map((item) => (
                <span
                  key={item.id}
                  className={`text-[10px] font-semibold ${RARITY_TEXT[item.rarity]}`}
                >
                  {item.type === "avatar_icon" && item.css_class && (
                    <span className="inline-block align-middle mr-0.5">
                      {renderCosmeticIcon(item.css_class, 12)}
                    </span>
                  )}
                  {item.type === "theme_accent" && item.css_class && (
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full align-middle mr-0.5 border border-border/30"
                      style={{ backgroundColor: getAccentDef(item.css_class)?.accent ?? "var(--accent)" }}
                    />
                  )}
                  {item.type === "name_style" && item.css_class ? (
                    <span className={item.css_class}>{item.name}</span>
                  ) : (
                    item.name
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
