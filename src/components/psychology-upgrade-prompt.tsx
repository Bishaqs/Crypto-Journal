"use client";

import { useEffect, useState } from "react";
import { Brain, X } from "lucide-react";
import { usePsychologyTier } from "@/lib/psychology-tier-context";

const TIER_BENEFITS: Record<string, string> = {
  advanced: "emotion-performance insights, bias detection, and somatic tracking",
  expert: "deep pattern analysis, money script coaching, and belief system protocols",
};

export function PsychologyUpgradePrompt() {
  const { upgradeSuggestion, dismissUpgrade, setTier } = usePsychologyTier();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!upgradeSuggestion) {
      setShow(false);
      return;
    }
    // Delay appearance slightly so it doesn't flash on load
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, [upgradeSuggestion]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(dismissUpgrade, 300);
    }, 10000);
    return () => clearTimeout(t);
  }, [show, dismissUpgrade]);

  if (!upgradeSuggestion) return null;

  const { targetTier, tradeCount } = upgradeSuggestion;

  function handleUpgrade() {
    setTier(targetTier);
    setShow(false);
    setTimeout(dismissUpgrade, 300);
  }

  function handleDismiss() {
    setShow(false);
    setTimeout(dismissUpgrade, 300);
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm transition-all duration-300 ${
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="glass rounded-2xl border border-accent/20 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-accent/10 p-2">
            <Brain className="text-accent" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              You&apos;ve logged {tradeCount} trades!
            </p>
            <p className="text-xs text-muted mt-1">
              Upgrade to <span className="capitalize font-medium text-accent">{targetTier}</span> psychology
              for {TIER_BENEFITS[targetTier]}.
            </p>
            <button
              onClick={handleUpgrade}
              className="mt-3 px-4 py-1.5 rounded-xl bg-accent text-background text-xs font-semibold hover:bg-accent/90 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted hover:text-foreground transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
