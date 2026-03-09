"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { useCosmetics, renderCosmeticIcon } from "@/lib/cosmetics";
import { getAccentDef } from "@/lib/cosmetics/accent-map";
import type {
  CosmeticType,
  CosmeticRarity,
  CosmeticDefinition,
  UnlockCondition,
} from "@/lib/cosmetics";

const TYPE_LABELS: Record<CosmeticType, string> = {
  avatar_frame: "Frames",
  banner: "Banners",
  title_badge: "Titles",
  sidebar_flair: "Flair",
  avatar_icon: "Icons",
  theme_accent: "Accents",
  name_style: "Names",
};

const RARITY_META: Record<CosmeticRarity, { label: string; text: string; bg: string; border: string }> = {
  common: { label: "Common", text: "text-gray-400", bg: "bg-gray-500/5", border: "border-gray-500/20" },
  uncommon: { label: "Uncommon", text: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
  rare: { label: "Rare", text: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20" },
  epic: { label: "Epic", text: "text-purple-400", bg: "bg-purple-500/5", border: "border-purple-500/20" },
  legendary: { label: "Legendary", text: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/20" },
  mythic: { label: "Mythic", text: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
};

const COSMETIC_TYPES: CosmeticType[] = ["avatar_frame", "banner", "title_badge", "sidebar_flair", "avatar_icon", "theme_accent", "name_style"];

function getUnlockDescription(condition: UnlockCondition): string {
  switch (condition.type) {
    case "level":
      return `Reach Level ${condition.value} to unlock`;
    case "achievement":
      return `Unlock ${condition.id.replace(/_/g, " ")} at ${condition.tier} tier`;
    case "achievement_category":
      return `Complete all ${condition.category} achievements at ${condition.min_tier} tier`;
    case "special":
      return condition.id === "completionist"
        ? "Earn all achievements at max tier"
        : `Special unlock: ${condition.id}`;
    default:
      return "Keep progressing to unlock";
  }
}

/* ---------- Preview sub-components ---------- */

function FramePreview({ cssClass, locked }: { cssClass: string | null; locked: boolean }) {
  return (
    <div className="flex items-center justify-center py-4" style={{ overflow: "visible" }}>
      <div
        className={`w-[72px] h-[72px] rounded-full bg-surface flex items-center justify-center ${cssClass ?? ""} ${locked ? "opacity-30" : ""}`}
        style={{ overflow: "visible" }}
      >
        {locked ? (
          <Lock size={18} className="text-muted/50" />
        ) : (
          <span className="text-sm font-bold text-muted">LV</span>
        )}
      </div>
    </div>
  );
}

function BannerPreview({ cssClass, locked }: { cssClass: string | null; locked: boolean }) {
  return (
    <div className="py-3">
      <div
        className={`w-full h-12 rounded-xl ${cssClass ?? ""} ${locked ? "opacity-30" : ""}`}
        style={{ overflow: "hidden" }}
      >
        {locked && (
          <div className="w-full h-full flex items-center justify-center">
            <Lock size={16} className="text-muted/50" />
          </div>
        )}
      </div>
    </div>
  );
}

function TitlePreview({
  name,
  rarity,
  locked,
}: {
  name: string;
  rarity: CosmeticRarity;
  locked: boolean;
}) {
  const meta = RARITY_META[rarity];
  return (
    <div className="flex items-center justify-center py-5">
      <div
        className={`px-4 py-2 rounded-xl border ${locked ? "opacity-30 bg-surface border-border/30" : `${meta.bg} ${meta.border}`}`}
      >
        <span
          className={`text-base font-bold ${locked ? "text-muted/40" : meta.text}`}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

function FlairPreview({ cssClass, locked }: { cssClass: string | null; locked: boolean }) {
  return (
    <div className="flex items-center justify-center py-4" style={{ overflow: "visible" }}>
      <div className="relative w-14 h-14">
        <div
          className={`rounded-full bg-accent/20 ${cssClass ?? ""} ${locked ? "flair-locked" : ""}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        />
      </div>
    </div>
  );
}

function IconPreview({ cssClass, locked }: { cssClass: string | null; locked: boolean }) {
  return (
    <div className="flex items-center justify-center py-4">
      <div
        className={`w-16 h-16 rounded-full bg-surface border border-border/30 flex items-center justify-center ${locked ? "opacity-30" : ""}`}
      >
        {cssClass && !locked ? (
          <span className="text-accent">{renderCosmeticIcon(cssClass, 28)}</span>
        ) : (
          <Lock size={18} className="text-muted/50" />
        )}
      </div>
    </div>
  );
}

function AccentPreview({ cssClass, locked }: { cssClass: string | null; locked: boolean }) {
  const ad = cssClass ? getAccentDef(cssClass) : undefined;
  return (
    <div className="flex items-center justify-center py-4">
      <div
        className={`w-14 h-14 rounded-full border-2 ${locked ? "opacity-30 border-border/30" : "border-border/50"}`}
        style={{ backgroundColor: ad?.accent ?? "var(--accent)" }}
      >
        {locked && (
          <div className="w-full h-full flex items-center justify-center">
            <Lock size={16} className="text-white/50" />
          </div>
        )}
      </div>
    </div>
  );
}

function NameStylePreview({ cssClass, name, locked }: { cssClass: string | null; name: string; locked: boolean }) {
  return (
    <div className="flex items-center justify-center py-5">
      <span
        className={`text-lg font-bold ${locked ? "text-muted/30" : cssClass ?? "text-foreground"}`}
      >
        {locked ? "Trader" : name || "Trader"}
      </span>
    </div>
  );
}

/* ---------- Main Grid ---------- */

export function CosmeticGrid() {
  const { definitions, equipped, isOwned, equip, unequip } = useCosmetics();
  const [selectedType, setSelectedType] = useState<CosmeticType>("avatar_frame");

  const filtered = definitions.filter((d) => d.type === selectedType);
  const sortedFiltered = [...filtered].sort((a, b) => {
    const rarityOrder: CosmeticRarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  return (
    <div>
      {/* Type tabs */}
      <div className="flex gap-2 mb-6">
        {COSMETIC_TYPES.map((type) => {
          const count = definitions.filter((d) => d.type === type).length;
          const ownedCount = definitions.filter(
            (d) => d.type === type && isOwned(d.id),
          ).length;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                selectedType === type
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-background border-border text-muted hover:text-foreground hover:border-accent/20"
              }`}
            >
              {TYPE_LABELS[type]}
              <span className="ml-1.5 text-[10px] opacity-60">
                {ownedCount}/{count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Type description */}
      {selectedType === "theme_accent" && (
        <p className="text-xs text-muted mb-4 -mt-2">
          Accents change your dashboard&apos;s theme color — buttons, links, progress bars, and highlights all use this color.
        </p>
      )}
      {selectedType === "name_style" && (
        <p className="text-xs text-muted mb-4 -mt-2">
          Name styles add color, gradients, and animations to your display name across the dashboard, profile, and leaderboard.
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFiltered.map((cosmetic: CosmeticDefinition) => {
          const owned = isOwned(cosmetic.id);
          const isEquipped = equipped[cosmetic.type] === cosmetic.id;
          const rarity = RARITY_META[cosmetic.rarity];

          return (
            <div
              key={cosmetic.id}
              className={`glass rounded-2xl border transition-all ${
                owned
                  ? isEquipped
                    ? "border-accent/40 bg-accent/5"
                    : "border-border/50"
                  : "border-border/30"
              }`}
              style={{ boxShadow: "var(--shadow-card)", overflow: "visible" }}
            >
              {/* Preview area */}
              <div className="px-5 pt-3" style={{ overflow: "visible" }}>
                {cosmetic.type === "avatar_frame" && (
                  <FramePreview cssClass={cosmetic.css_class} locked={!owned} />
                )}
                {cosmetic.type === "banner" && (
                  <BannerPreview cssClass={cosmetic.css_class} locked={!owned} />
                )}
                {cosmetic.type === "title_badge" && (
                  <TitlePreview
                    name={cosmetic.name}
                    rarity={cosmetic.rarity}
                    locked={!owned}
                  />
                )}
                {cosmetic.type === "sidebar_flair" && (
                  <FlairPreview cssClass={cosmetic.css_class} locked={!owned} />
                )}
                {cosmetic.type === "avatar_icon" && (
                  <IconPreview cssClass={cosmetic.css_class} locked={!owned} />
                )}
                {cosmetic.type === "theme_accent" && (
                  <AccentPreview cssClass={cosmetic.css_class} locked={!owned} />
                )}
                {cosmetic.type === "name_style" && (
                  <NameStylePreview cssClass={cosmetic.css_class} name={cosmetic.name} locked={!owned} />
                )}
              </div>

              {/* Info + actions */}
              <div className="px-5 pb-5 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-foreground">{cosmetic.name}</p>
                  {owned ? (
                    <Check size={14} className="text-win shrink-0" />
                  ) : (
                    <Lock size={14} className="text-muted/40 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted">{cosmetic.description}</p>
                <span className={`text-[10px] font-semibold ${rarity.text}`}>
                  {rarity.label}
                </span>

                {/* Equip button or unlock requirement */}
                {owned ? (
                  <button
                    onClick={() =>
                      isEquipped
                        ? unequip(cosmetic.type)
                        : equip(cosmetic.type, cosmetic.id)
                    }
                    className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                      isEquipped
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-surface-hover text-muted hover:text-foreground border border-border"
                    }`}
                  >
                    {isEquipped ? "Equipped" : "Equip"}
                  </button>
                ) : (
                  <p className="mt-3 text-[10px] text-muted/60 italic">
                    {getUnlockDescription(cosmetic.unlock_condition as UnlockCondition)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
