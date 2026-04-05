"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Trade, TradingRule } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  analyzeNewTrades,
  TRADES_SYNCED_EVENT,
  type PostSyncAlert as AlertData,
} from "@/lib/post-sync-analysis";
import type { MiniArchetype } from "@/lib/mini-quiz-archetypes";
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Zap,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const SEVERITY_STYLES = {
  danger: {
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    icon: AlertOctagon,
    iconColor: "text-red-400",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
  },
  info: {
    border: "border-accent/40",
    bg: "bg-accent/10",
    icon: Zap,
    iconColor: "text-accent",
  },
};

export function PostSyncAlertBanner({
  trades,
}: {
  trades: Trade[];
}) {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [rules, setRules] = useState<TradingRule[]>([]);
  const supabase = createClient();

  const archetype = useMemo<MiniArchetype | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("stargate-mini-archetype") as MiniArchetype | null;
  }, []);

  // Fetch rules once
  useEffect(() => {
    supabase
      .from("trading_rules")
      .select("*")
      .eq("active", true)
      .then(({ data }: { data: TradingRule[] | null }) => {
        if (data) setRules(data);
      });
  }, [supabase]);

  // Listen for sync events
  const handleSyncEvent = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.count || detail.count <= 0) return;

      const newAlerts = analyzeNewTrades({
        newTradeCount: detail.count,
        allTrades: trades,
        rules,
        archetype,
      });

      if (newAlerts.length > 0) {
        setAlerts(newAlerts);
        setDismissed(new Set());

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
          setAlerts([]);
        }, 30_000);
      }
    },
    [trades, rules, archetype],
  );

  useEffect(() => {
    window.addEventListener(TRADES_SYNCED_EVENT, handleSyncEvent);
    return () => window.removeEventListener(TRADES_SYNCED_EVENT, handleSyncEvent);
  }, [handleSyncEvent]);

  // Also check on mount if there are sessionStorage alerts from cron sync
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("stargate-pending-sync-alerts");
      if (stored) {
        const parsed = JSON.parse(stored) as AlertData[];
        if (parsed.length > 0) {
          setAlerts(parsed);
          sessionStorage.removeItem("stargate-pending-sync-alerts");
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => {
        const style = SEVERITY_STYLES[alert.severity];
        const Icon = style.icon;

        return (
          <div
            key={alert.id}
            className={`rounded-xl border ${style.border} ${style.bg} px-4 py-3 animate-in slide-in-from-top-2 duration-300`}
          >
            <div className="flex items-start gap-3">
              <Icon size={16} className={`${style.iconColor} shrink-0 mt-0.5`} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                <p className="text-xs text-foreground/70 mt-0.5">{alert.message}</p>

                {/* CTAs */}
                {alert.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {alert.suggestedActions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background/50 border border-border/50 text-[11px] font-medium text-foreground hover:bg-background hover:border-accent/30 transition-all"
                      >
                        {action.label}
                        <ChevronRight size={10} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
