"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { X, Lock, Check, ChevronUp, Sparkles } from "lucide-react";
import { useLevel } from "@/lib/xp";
import { MAX_LEVEL } from "@/lib/xp/types";
import { useCosmetics, renderCosmeticIcon } from "@/lib/cosmetics";
import type { CosmeticDefinition, CosmeticRarity, UnlockCondition } from "@/lib/cosmetics";
import { getAccentDef } from "@/lib/cosmetics/accent-map";

const RARITY_META: Record<CosmeticRarity, { label: string; text: string; dot: string }> = {
  common: { label: "Common", text: "text-gray-400", dot: "bg-gray-400" },
  uncommon: { label: "Uncommon", text: "text-emerald-400", dot: "bg-emerald-400" },
  rare: { label: "Rare", text: "text-blue-400", dot: "bg-blue-400" },
  epic: { label: "Epic", text: "text-purple-400", dot: "bg-purple-400" },
  legendary: { label: "Legendary", text: "text-amber-400", dot: "bg-amber-400" },
  mythic: { label: "Mythic", text: "text-red-400", dot: "bg-red-400" },
};

const TYPE_LABEL: Record<string, string> = {
  avatar_frame: "Frame",
  banner: "Banner",
  title_badge: "Title",
  sidebar_flair: "Flair",
  avatar_icon: "Icon",
  theme_accent: "Accent",
  name_style: "Name",
};

type Filter = "all" | "owned" | "locked";

function CosmeticPreviewSmall({ cosmetic }: { cosmetic: CosmeticDefinition }) {
  switch (cosmetic.type) {
    case "avatar_icon":
      return cosmetic.css_class ? (
        <span className="text-accent">{renderCosmeticIcon(cosmetic.css_class, 18)}</span>
      ) : null;
    case "theme_accent": {
      const ad = cosmetic.css_class ? getAccentDef(cosmetic.css_class) : undefined;
      return (
        <div
          className="w-5 h-5 rounded-full border border-border/30"
          style={{ backgroundColor: ad?.accent ?? "var(--accent)" }}
        />
      );
    }
    case "avatar_frame":
      return (
        <div
          className={`w-6 h-6 rounded-full bg-surface ${cosmetic.css_class ?? ""}`}
          style={{ overflow: "visible" }}
        />
      );
    case "banner":
      return <div className={`w-10 h-4 rounded ${cosmetic.css_class ?? ""}`} />;
    case "sidebar_flair":
      return (
        <div
          className={`w-5 h-5 rounded-full bg-accent/20 ${cosmetic.css_class ?? ""}`}
          style={{ overflow: "visible" }}
        />
      );
    case "title_badge":
      return (
        <span className={`text-[10px] font-bold ${RARITY_META[cosmetic.rarity].text}`}>
          {cosmetic.name.slice(0, 6)}
        </span>
      );
    case "name_style":
      return (
        <span className={`text-[10px] font-bold ${cosmetic.css_class ?? "text-foreground"}`}>
          Aa
        </span>
      );
    default:
      return null;
  }
}

type LevelGroup = {
  level: number;
  cosmetics: CosmeticDefinition[];
};

/**
 * Full scrollable level timeline.
 */
export function UnlockRoadmap({ onClose }: { onClose: () => void }) {
  const { level } = useLevel();
  const { definitions, isOwned, equipped } = useCosmetics();
  const [filter, setFilter] = useState<Filter>("all");
  const currentRef = useRef<HTMLDivElement>(null);

  // Group level-based cosmetics by level
  const levelGroups = useMemo(() => {
    const byLevel = new Map<number, CosmeticDefinition[]>();

    for (const def of definitions) {
      const cond = def.unlock_condition as UnlockCondition;
      if (cond.type !== "level") continue;
      const lv = cond.value;
      const existing = byLevel.get(lv) ?? [];
      existing.push(def);
      byLevel.set(lv, existing);
    }

    const groups: LevelGroup[] = [];
    for (let lv = 1; lv <= MAX_LEVEL; lv++) {
      const cosmetics = byLevel.get(lv);
      if (!cosmetics || cosmetics.length === 0) continue;
      groups.push({ level: lv, cosmetics });
    }

    return groups;
  }, [definitions]);

  // Achievement-based cosmetics
  const specialCosmetics = useMemo(() => {
    return definitions.filter((d) => {
      const cond = d.unlock_condition as UnlockCondition;
      return cond.type !== "level";
    });
  }, [definitions]);

  // Apply filter
  const filteredGroups = useMemo(() => {
    if (filter === "all") return levelGroups;
    return levelGroups
      .map((g) => ({
        ...g,
        cosmetics: g.cosmetics.filter((c) =>
          filter === "owned" ? isOwned(c.id) : !isOwned(c.id),
        ),
      }))
      .filter((g) => g.cosmetics.length > 0);
  }, [levelGroups, filter, isOwned]);

  // Scroll to current level on mount
  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return (
    <div
      className="glass rounded-2xl border border-border/50"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            Unlock Roadmap
          </h3>
          <p className="text-[10px] text-muted mt-0.5">
            Every level unlocks something new
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex gap-1">
            {(["all", "owned", "locked"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                  filter === f
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "text-muted hover:text-foreground border border-transparent"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Jump to level button */}
      <div className="px-5 py-2 border-b border-border/20 bg-accent/3">
        <button
          onClick={() =>
            currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          className="text-[10px] text-accent font-semibold flex items-center gap-1 hover:underline"
        >
          <ChevronUp size={12} />
          Jump to Level {level}
        </button>
      </div>

      {/* Timeline */}
      <div className="max-h-[500px] overflow-y-auto px-5 py-3">
        {filteredGroups.map((group) => {
          const isCurrent = group.level === level;
          const isPast = group.level <= level;

          return (
            <div
              key={group.level}
              ref={isCurrent ? currentRef : undefined}
              className={`relative pl-8 pb-4 ${isCurrent ? "" : ""}`}
            >
              {/* Timeline line */}
              <div
                className={`absolute left-3 top-0 bottom-0 w-px ${
                  isPast ? "bg-accent/30" : "bg-border/50"
                }`}
              />

              {/* Level node */}
              <div
                className={`absolute left-1 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  isCurrent
                    ? "bg-accent text-background ring-2 ring-accent/30 animate-pulse"
                    : isPast
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "bg-border/30 text-muted border border-border/50"
                }`}
              >
                {group.level}
              </div>

              {/* Cosmetics for this level */}
              <div className="space-y-1.5">
                {group.cosmetics.map((cosmetic) => {
                  const owned = isOwned(cosmetic.id);
                  const isEquipped = Object.values(equipped).includes(cosmetic.id);
                  const rarity = RARITY_META[cosmetic.rarity];

                  return (
                    <div
                      key={cosmetic.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        owned
                          ? isEquipped
                            ? "bg-accent/10 border border-accent/30"
                            : "bg-surface/50 border border-border/30"
                          : "opacity-50 border border-border/20"
                      }`}
                    >
                      <div className="w-6 flex items-center justify-center shrink-0" style={{ overflow: "visible" }}>
                        {owned ? (
                          <CosmeticPreviewSmall cosmetic={cosmetic} />
                        ) : (
                          <Lock size={12} className="text-muted/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {cosmetic.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-semibold ${rarity.text}`}>
                            {rarity.label}
                          </span>
                          <span className="text-[9px] text-muted">
                            {TYPE_LABEL[cosmetic.type]}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isEquipped ? (
                          <span className="text-[9px] font-bold text-accent">Equipped</span>
                        ) : owned ? (
                          <Check size={12} className="text-win" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Special Unlocks */}
        {filter !== "locked" && specialCosmetics.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/30">
            <h4 className="text-xs font-bold text-foreground mb-3">
              Special Unlocks
            </h4>
            <div className="space-y-1.5">
              {specialCosmetics.map((cosmetic) => {
                const owned = isOwned(cosmetic.id);
                const cond = cosmetic.unlock_condition as UnlockCondition;
                const rarity = RARITY_META[cosmetic.rarity];

                let condText = "";
                if (cond.type === "achievement") {
                  condText = `${cond.id.replace(/_/g, " ")} (${cond.tier})`;
                } else if (cond.type === "achievement_category") {
                  condText = `All ${cond.category} at ${cond.min_tier}+`;
                } else if (cond.type === "special") {
                  condText = cond.id === "completionist" ? "All achievements maxed" : cond.id;
                }

                return (
                  <div
                    key={cosmetic.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                      owned
                        ? "bg-surface/50 border border-border/30"
                        : "opacity-50 border border-border/20"
                    }`}
                  >
                    <div className="w-6 flex items-center justify-center shrink-0" style={{ overflow: "visible" }}>
                      {owned ? (
                        <CosmeticPreviewSmall cosmetic={cosmetic} />
                      ) : (
                        <Lock size={12} className="text-muted/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {cosmetic.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-semibold ${rarity.text}`}>
                          {rarity.label}
                        </span>
                        <span className="text-[9px] text-muted">{condText}</span>
                      </div>
                    </div>
                    {owned && <Check size={12} className="text-win shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
