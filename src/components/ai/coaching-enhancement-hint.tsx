"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePsychologyTier } from "@/lib/psychology-tier-context";

/**
 * Subtle inline hint in Nova chat showing what's missing for
 * better coaching. Disappears when profile + Expert tier are active.
 */
export function CoachingEnhancementHint() {
  const { tier, profile } = usePsychologyTier();

  // Fully configured — nothing to show
  if (tier === "expert" && profile) return null;

  const message = !profile
    ? { text: "Nova's coaching improves with your Psychology Profile", action: "Complete Profile", href: "/dashboard/insights" }
    : tier === "simple"
    ? { text: "Upgrade to Advanced tier for emotion-performance insights", action: "Upgrade", href: "/dashboard/insights" }
    : tier === "advanced"
    ? { text: "Unlock Expert tier for deep pattern analysis and belief protocols", action: "Upgrade", href: "/dashboard/insights" }
    : null;

  if (!message) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/5 border border-accent/10 text-xs text-muted max-w-2xl w-full">
      <Sparkles size={12} className="text-accent shrink-0" />
      <span>{message.text}</span>
      <Link href={message.href} className="text-accent hover:underline ml-auto shrink-0 font-medium">
        {message.action}
      </Link>
    </div>
  );
}
