"use client";

import { usePsychologyTier } from "@/lib/psychology-tier-context";
import type { PsychologyTier } from "@/lib/types";

const TIERS: { id: PsychologyTier; label: string; emoji: string; description: string }[] = [
  { id: "simple", label: "Simple", emoji: "⚡", description: "Quick emotion tracking" },
  { id: "advanced", label: "Advanced", emoji: "🧠", description: "Mind + body awareness" },
  { id: "expert", label: "Expert", emoji: "🔬", description: "Deep psychological analysis" },
];

export function PsychologyTierToggle({
  compact = false,
  onExpertFirstTime,
}: {
  compact?: boolean;
  onExpertFirstTime?: () => void;
}) {
  const { tier, setTier, profile } = usePsychologyTier();

  async function handleSelect(newTier: PsychologyTier) {
    // If switching to expert for the first time (no profile), trigger wizard
    if (newTier === "expert" && !profile && onExpertFirstTime) {
      onExpertFirstTime();
      return;
    }
    await setTier(newTier);
  }

  if (compact) {
    return (
      <div className="flex gap-1 bg-card/50 rounded-lg p-0.5 border border-border/50">
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t.id)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-200 ${
              tier === t.id
                ? "bg-accent/20 text-accent border border-accent/30"
                : "text-muted hover:text-foreground"
            }`}
            title={t.description}
          >
            {t.emoji}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs text-muted">Psychology Depth</label>
      <div className="flex gap-1 bg-card/50 rounded-xl p-1 border border-border/50">
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              tier === t.id
                ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                : "text-muted hover:text-foreground hover:bg-accent/5"
            }`}
          >
            <span className="text-sm">{t.emoji}</span>
            <span>{t.label}</span>
            <span className="text-[10px] text-muted/70 font-normal">{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
