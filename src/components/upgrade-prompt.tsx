"use client";

import { useRouter } from "next/navigation";
import { Crown, ArrowRight, Lock } from "lucide-react";

const FEATURE_NAMES: Record<string, string> = {
  "ai-coach": "AI Coach",
  "monte-carlo": "Monte Carlo Simulations",
  "prop-firm": "Prop Firm Tracking",
  "heatmaps": "Heat Maps",
  "risk-analysis": "Risk Analysis",
  "stock-trading": "Stock Trading",
  "tax-reports": "Tax Reports",
  "weekly-reports": "Weekly Reports",
  "premium-themes": "Premium Themes",
  "advanced-analytics": "Advanced Analytics",
  "playbook": "Playbook",
  "risk-calculator": "Risk Calculator",
  "psychology-engine": "Psychology Engine",
  "rule-tracker": "Rule Tracker",
};

export function UpgradePrompt({ feature, requiredTier = "pro" }: { feature: string; requiredTier?: "pro" | "max" }) {
  const router = useRouter();
  const name = FEATURE_NAMES[feature] ?? feature;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full glass rounded-2xl border border-border p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Unlock {name}</h2>
        <p className="text-muted mb-6">
          This feature requires {requiredTier === "max" ? "Max" : "Pro"} tier. Upgrade to get full access.
        </p>
        <button
          onClick={() => router.push("/dashboard/settings?tab=subscription")}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-background font-semibold hover:bg-accent-hover transition-all"
        >
          <Crown size={18} />
          Upgrade to {requiredTier === "max" ? "Max" : "Pro"}
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => router.back()}
          className="w-full mt-3 px-6 py-2.5 rounded-xl border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
