"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, ChevronRight, MinusCircle } from "lucide-react";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { createClient } from "@/lib/supabase/client";

type ReadinessResult = "green" | "yellow" | "red";

const SKIP_KEY = "stargate-readiness-skip-count";
const MAX_SKIPS = 5;

/**
 * Lightweight pre-trade readiness check that wraps trade forms.
 * Shows a quick 2-question check before opening the form.
 * Skippable, and auto-disables after 5 consecutive skips.
 */
export function ReadinessGate({
  children,
  isEdit,
}: {
  children: React.ReactNode;
  isEdit?: boolean;
}) {
  const [phase, setPhase] = useState<"check" | "form">("check");
  const [trafficLight, setTrafficLight] = useState<ReadinessResult | null>(null);
  const [recentLoss, setRecentLoss] = useState<boolean | null>(null);
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [todayTradeCount, setTodayTradeCount] = useState<number | null>(null);
  const { tier } = usePsychologyTier();

  // Skip for edits or if user has skipped too many times
  useEffect(() => {
    if (isEdit) {
      setPhase("form");
      return;
    }
    const skipCount = parseInt(localStorage.getItem(SKIP_KEY) || "0", 10);
    if (skipCount >= MAX_SKIPS) {
      setPhase("form");
    }
  }, [isEdit]);

  // Load today's trade count for context
  useEffect(() => {
    if (phase !== "check") return;
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("trades")
      .select("*", { count: "exact", head: true })
      .gte("open_timestamp", `${today}T00:00:00`)
      .then(({ count }: { count: number | null }) => setTodayTradeCount(count ?? 0));
  }, [phase]);

  function evaluate() {
    if (!trafficLight) return;
    let r: ReadinessResult = trafficLight;
    // Escalate if recent loss + not green
    if (recentLoss && trafficLight !== "red") {
      r = trafficLight === "green" ? "yellow" : "red";
    }
    // Escalate if many trades today
    if (todayTradeCount !== null && todayTradeCount >= 5 && r !== "red") {
      r = r === "green" ? "yellow" : "red";
    }
    setResult(r);
  }

  useEffect(() => {
    if (trafficLight !== null && recentLoss !== null) {
      evaluate();
    }
  }, [trafficLight, recentLoss, todayTradeCount]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSkip() {
    const current = parseInt(localStorage.getItem(SKIP_KEY) || "0", 10);
    localStorage.setItem(SKIP_KEY, String(current + 1));
    setPhase("form");
  }

  function handleProceed() {
    // Reset skip counter when user completes a check
    localStorage.setItem(SKIP_KEY, "0");
    setPhase("form");
  }

  if (phase === "form") return <>{children}</>;

  return (
    <div className="p-6 space-y-5">
      <div className="text-center">
        <h3 className="text-base font-semibold text-foreground">Quick check before you trade</h3>
        <p className="text-xs text-muted mt-1">Takes 5 seconds. Helps you trade better.</p>
      </div>

      {/* Traffic light */}
      <div className="space-y-2">
        <p className="text-sm text-muted">How are you feeling right now?</p>
        <div className="flex gap-2">
          {([
            { value: "green", label: "Good", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" },
            { value: "yellow", label: "Uncertain", color: "bg-amber-500/20 border-amber-500/40 text-amber-400" },
            { value: "red", label: "Stressed", color: "bg-red-500/20 border-red-500/40 text-red-400" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTrafficLight(opt.value)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                trafficLight === opt.value
                  ? `${opt.color} ring-1 ring-current`
                  : "border-border text-muted hover:border-border/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent loss */}
      <div className="space-y-2">
        <p className="text-sm text-muted">Did you have a loss in the last hour?</p>
        <div className="flex gap-2">
          {([
            { value: true, label: "Yes" },
            { value: false, label: "No" },
          ] as const).map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setRecentLoss(opt.value)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                recentLoss === opt.value
                  ? "border-accent/40 bg-accent/10 text-accent ring-1 ring-accent/30"
                  : "border-border text-muted hover:border-border/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Today's trade count context */}
      {todayTradeCount !== null && todayTradeCount > 0 && (
        <p className="text-xs text-muted text-center">
          You&apos;ve made {todayTradeCount} trade{todayTradeCount !== 1 ? "s" : ""} today.
        </p>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-3 flex items-start gap-3 ${
          result === "green"
            ? "border-emerald-500/30 bg-emerald-500/5"
            : result === "yellow"
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}>
          {result === "green" && <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />}
          {result === "yellow" && <MinusCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />}
          {result === "red" && <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />}
          <div>
            <p className="text-sm font-medium text-foreground">
              {result === "green" && "You're in a good state. Let's go."}
              {result === "yellow" && "Proceed with caution."}
              {result === "red" && "Consider stepping away."}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {result === "green" && "Your mindset looks clear for trading."}
              {result === "yellow" && "Be extra disciplined with your rules. Stick to your plan."}
              {result === "red" && "Trading while stressed or after losses often leads to poor decisions. Take a break if you can."}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSkip}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-foreground transition-colors"
        >
          Skip
        </button>
        {result && (
          <button
            onClick={handleProceed}
            className="flex-1 py-2.5 rounded-xl bg-accent text-background text-sm font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-1"
          >
            {result === "red" ? "Trade anyway" : "Continue"}
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {tier !== "simple" && (
        <p className="text-[10px] text-muted/60 text-center">
          For a deeper check, use the Pre-Trade Readiness tool on the dashboard.
        </p>
      )}
    </div>
  );
}
