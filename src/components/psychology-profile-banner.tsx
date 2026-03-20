"use client";

import { useEffect, useState } from "react";
import { Brain, X } from "lucide-react";
import Link from "next/link";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { createClient } from "@/lib/supabase/client";

const DISMISSED_KEY = "stargate-psych-profile-banner-dismissed";

/**
 * Dismissible banner on the dashboard encouraging users to complete
 * their Psychology Profile. Only shows when:
 * 1. User has no psychology profile
 * 2. User has 5+ trades (don't bother brand-new users)
 * 3. Not previously dismissed
 */
export function PsychologyProfileBanner() {
  const { profile, profileLoading } = usePsychologyTier();
  const [dismissed, setDismissed] = useState(true); // default hidden
  const [tradeCount, setTradeCount] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setDismissed(false);

    const supabase = createClient();
    supabase
      .from("trades")
      .select("*", { count: "exact", head: true })
      .then(({ count }: { count: number | null }) => setTradeCount(count ?? 0));
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }

  // Don't show while loading, if profile exists, if dismissed, or if too few trades
  if (profileLoading || profile || dismissed || tradeCount < 5) return null;

  return (
    <div className="glass rounded-2xl border border-accent/20 p-4 flex items-center gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="rounded-xl bg-accent/10 p-2.5 shrink-0">
        <Brain className="text-accent" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Unlock personalized AI coaching
        </p>
        <p className="text-xs text-muted mt-0.5">
          Complete your Psychology Profile to help Nova understand your trading personality and give better advice.
        </p>
      </div>
      <Link
        href="/dashboard/insights"
        className="px-4 py-2 rounded-xl bg-accent text-background text-xs font-semibold hover:bg-accent/90 transition-colors shrink-0"
      >
        Start
      </Link>
      <button
        onClick={dismiss}
        className="text-muted hover:text-foreground transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
