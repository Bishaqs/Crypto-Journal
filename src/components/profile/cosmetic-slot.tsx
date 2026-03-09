"use client";

import { useState } from "react";
import { Lock, Check, X } from "lucide-react";
import { useCosmetics, renderCosmeticIcon } from "@/lib/cosmetics";
import type { CosmeticType, CosmeticRarity, CosmeticDefinition } from "@/lib/cosmetics";
import { getAccentDef } from "@/lib/cosmetics/accent-map";

const TYPE_LABELS: Record<CosmeticType, string> = {
  avatar_frame: "Frame",
  banner: "Banner",
  title_badge: "Title",
  sidebar_flair: "Flair",
  avatar_icon: "Icon",
  theme_accent: "Accent",
  name_style: "Name",
};

const RARITY_META: Record<CosmeticRarity, { label: string; text: string }> = {
  common: { label: "Common", text: "text-gray-400" },
  uncommon: { label: "Uncommon", text: "text-emerald-400" },
  rare: { label: "Rare", text: "text-blue-400" },
  epic: { label: "Epic", text: "text-purple-400" },
  legendary: { label: "Legendary", text: "text-amber-400" },
  mythic: { label: "Mythic", text: "text-red-400" },
};

function CosmeticPreview({ cosmetic, small }: { cosmetic: CosmeticDefinition; small?: boolean }) {
  const size = small ? 28 : 40;

  switch (cosmetic.type) {
    case "avatar_frame":
      return (
        <div
          className={`rounded-full bg-surface flex items-center justify-center ${cosmetic.css_class ?? ""}`}
          style={{ width: size, height: size, overflow: "visible" }}
        >
          <span className="text-[10px] font-bold text-muted">F</span>
        </div>
      );
    case "banner":
      return (
        <div
          className={`rounded-lg ${cosmetic.css_class ?? ""}`}
          style={{ width: small ? 48 : 64, height: small ? 16 : 24, overflow: "hidden" }}
        />
      );
    case "title_badge":
      return (
        <span className={`text-xs font-bold ${RARITY_META[cosmetic.rarity].text}`}>
          {cosmetic.name}
        </span>
      );
    case "sidebar_flair":
      return (
        <div style={{ position: "relative", width: size, height: size }}>
          <div
            className={`rounded-full bg-accent/20 ${cosmetic.css_class ?? ""}`}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
          />
        </div>
      );
    case "avatar_icon":
      return (
        <span className="text-accent">
          {cosmetic.css_class ? renderCosmeticIcon(cosmetic.css_class, small ? 20 : 28) : null}
        </span>
      );
    case "theme_accent": {
      const accentInfo = cosmetic.css_class ? getAccentDef(cosmetic.css_class) : undefined;
      return (
        <div
          className="rounded-full border-2 border-border/30"
          style={{
            width: size,
            height: size,
            backgroundColor: accentInfo?.accent ?? "var(--accent)",
          }}
        />
      );
    }
    case "name_style":
      return (
        <span className={`text-xs font-bold ${cosmetic.css_class ?? "text-foreground"}`}>
          Aa
        </span>
      );
    default:
      return null;
  }
}

/**
 * A single cosmetic equip slot with a picker modal.
 */
export function CosmeticSlot({ type }: { type: CosmeticType }) {
  const { definitions, equipped, isOwned, equip, unequip, getDefinition } = useCosmetics();
  const [open, setOpen] = useState(false);

  const equippedId = equipped[type];
  const equippedDef = equippedId ? getDefinition(equippedId) : undefined;

  const allOfType = definitions.filter((d) => d.type === type);
  const ownedOfType = allOfType.filter((d) => isOwned(d.id));
  const sortedItems = [...allOfType].sort((a, b) => {
    const order: CosmeticRarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];
    return order.indexOf(a.rarity) - order.indexOf(b.rarity);
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`glass rounded-2xl border p-4 transition-all text-center hover:border-accent/30 ${
          equippedDef ? "border-accent/30 bg-accent/5" : "border-border/50"
        }`}
        style={{ boxShadow: "var(--shadow-card)", overflow: "visible" }}
      >
        <div className="flex items-center justify-center h-12" style={{ overflow: "visible" }}>
          {equippedDef ? (
            <CosmeticPreview cosmetic={equippedDef} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-border/30 flex items-center justify-center">
              <Lock size={14} className="text-muted/40" />
            </div>
          )}
        </div>
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mt-2">
          {TYPE_LABELS[type]}
        </p>
        <p className="text-[9px] text-muted/60 mt-0.5">
          {ownedOfType.length}/{allOfType.length}
        </p>
      </button>

      {/* Picker Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass border border-border/50 rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col"
            style={{ boxShadow: "var(--shadow-glow)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Choose {TYPE_LABELS[type]}
                </h3>
                <p className="text-[10px] text-muted mt-0.5">
                  {ownedOfType.length} of {allOfType.length} unlocked
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Unequip option */}
              {equippedId && (
                <button
                  onClick={async () => {
                    await unequip(type);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/30 hover:bg-surface-hover transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-border/20 flex items-center justify-center">
                    <X size={14} className="text-muted" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">None</p>
                    <p className="text-[10px] text-muted">Remove equipped {TYPE_LABELS[type].toLowerCase()}</p>
                  </div>
                </button>
              )}

              {sortedItems.map((cosmetic) => {
                const owned = isOwned(cosmetic.id);
                const isEquipped = equippedId === cosmetic.id;
                const rarity = RARITY_META[cosmetic.rarity];

                return (
                  <button
                    key={cosmetic.id}
                    onClick={async () => {
                      if (!owned) return;
                      await equip(type, cosmetic.id);
                      setOpen(false);
                    }}
                    disabled={!owned}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                      isEquipped
                        ? "border-accent/40 bg-accent/5"
                        : owned
                          ? "border-border/30 hover:bg-surface-hover"
                          : "border-border/20 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div style={{ overflow: "visible" }}>
                      <CosmeticPreview cosmetic={cosmetic} small />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {cosmetic.name}
                        </p>
                        {isEquipped && <Check size={12} className="text-win shrink-0" />}
                        {!owned && <Lock size={10} className="text-muted/40 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted truncate">{cosmetic.description}</p>
                      <span className={`text-[9px] font-semibold ${rarity.text}`}>
                        {rarity.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
