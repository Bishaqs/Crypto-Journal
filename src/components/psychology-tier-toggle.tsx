"use client";

import { usePsychologyTier } from "@/lib/psychology-tier-context";
import type { PsychologyTier } from "@/lib/types";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

const TIERS: { id: PsychologyTier; label: string; emoji: string; description: string; subLabel: string }[] = [
  { id: "simple", label: "Simple", emoji: "⚡", description: "Quick emotion tracking", subLabel: "Free" },
  { id: "advanced", label: "Advanced", emoji: "🧠", description: "Mind + body awareness", subLabel: "Pro" },
  { id: "expert", label: "Expert", emoji: "🔬", description: "Deep psychological analysis", subLabel: "Max" },
];

export function PsychologyTierToggle({
  compact = false,
  onExpertFirstTime,
}: {
  compact?: boolean;
  onExpertFirstTime?: () => void;
}) {
  const { tier, setTier, profile, isLocked, requiredSubForTier } = usePsychologyTier();
  const router = useRouter();

  async function handleSelect(newTier: PsychologyTier) {
    if (isLocked(newTier)) {
      router.push("/dashboard/settings?tab=subscription");
      return;
    }
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
        {TIERS.map((t) => {
          const locked = isLocked(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-200 ${
                locked
                  ? "text-muted/30 cursor-not-allowed"
                  : tier === t.id
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "text-muted hover:text-foreground"
              }`}
              title={locked ? `Requires ${requiredSubForTier(t.id)} plan` : t.description}
            >
              {locked ? <Lock size={10} /> : t.emoji}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs text-muted">Psychology Depth</label>
      <div className="flex gap-1 bg-card/50 rounded-xl p-1 border border-border/50">
        {TIERS.map((t) => {
          const locked = isLocked(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                locked
                  ? "text-muted/40 cursor-not-allowed"
                  : tier === t.id
                    ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-accent/5"
              }`}
            >
              <span className="text-sm">{locked ? "🔒" : t.emoji}</span>
              <span className="flex items-center gap-1">
                {t.label}
                {locked && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-accent/10 text-accent font-bold uppercase">
                    {requiredSubForTier(t.id)}
                  </span>
                )}
              </span>
              <span className="text-[10px] text-muted/70 font-normal">
                {locked ? `Upgrade to ${requiredSubForTier(t.id)}` : t.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
