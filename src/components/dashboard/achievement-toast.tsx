"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAchievements, ACHIEVEMENT_MAP, TIER_META } from "@/lib/achievements";
import type { AchievementTier } from "@/lib/achievements";
import { XP_AMOUNTS } from "@/lib/xp/types";
import { useTour } from "@/lib/tour-context";

export function AchievementToast() {
  const { recentUnlocks, dismissUnlock } = useAchievements();
  const { state: tourState } = useTour();
  const [visible, setVisible] = useState<
    { id: string; tier: AchievementTier | null; show: boolean }[]
  >([]);

  useEffect(() => {
    if (recentUnlocks.length === 0) return;

    // During active tour, silently dismiss all unlocks to avoid toast spam
    if (tourState.isActive) {
      recentUnlocks.forEach((u) => dismissUnlock(u.achievement_id, u.tier));
      return;
    }

    // Add new unlocks with animation delay
    const newItems = recentUnlocks.map((u, i) => ({
      id: u.achievement_id,
      tier: u.tier,
      show: false,
    }));

    setVisible((prev) => [...prev, ...newItems]);

    // Stagger the show animation
    newItems.forEach((item, i) => {
      setTimeout(() => {
        setVisible((prev) =>
          prev.map((v) =>
            v.id === item.id && v.tier === item.tier ? { ...v, show: true } : v
          )
        );
      }, i * 300);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        handleDismiss(item.id, item.tier);
      }, 5000 + i * 300);
    });
  }, [recentUnlocks]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDismiss(id: string, tier: AchievementTier | null) {
    setVisible((prev) =>
      prev.map((v) =>
        v.id === id && v.tier === tier ? { ...v, show: false } : v
      )
    );
    setTimeout(() => {
      setVisible((prev) =>
        prev.filter((v) => !(v.id === id && v.tier === tier))
      );
      dismissUnlock(id, tier);
    }, 300);
  }

  if (visible.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
      {visible.map((item) => {
        const def = ACHIEVEMENT_MAP[item.id];
        if (!def) return null;

        const tierMeta = item.tier ? TIER_META[item.tier] : null;

        return (
          <div
            key={`${item.id}-${item.tier}`}
            className={`pointer-events-auto w-80 rounded-2xl border p-4 shadow-2xl transition-all duration-300 ${
              item.show
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            } ${
              tierMeta
                ? `${tierMeta.bgColor} ${tierMeta.borderColor}`
                : "bg-accent/10 border-accent/30"
            }`}
            style={{ backdropFilter: "blur(16px)" }}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl shrink-0">{def.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Achievement Unlocked!
                </p>
                <p className="text-sm font-bold text-foreground mt-0.5 truncate">
                  {def.title}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {tierMeta && (
                    <span className={`font-semibold ${tierMeta.color}`}>
                      {tierMeta.label} —{" "}
                    </span>
                  )}
                  {def.description}
                </p>
                <p className="text-[10px] font-bold text-accent mt-1">
                  +{item.tier
                    ? XP_AMOUNTS[`achievement_${item.tier}` as keyof typeof XP_AMOUNTS] ?? 75
                    : XP_AMOUNTS.achievement_single} XP
                </p>
              </div>
              <button
                onClick={() => handleDismiss(item.id, item.tier)}
                className="p-1 rounded-lg text-muted hover:text-foreground transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
