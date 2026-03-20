"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { Trade } from "@/lib/types";
import { detectTradeNudges, detectTimeNudges, type NovaNudge } from "@/lib/nova-triggers";

const DISMISSED_KEY = "traverse-nova-dismissed-nudges";
const SNOOZED_KEY = "traverse-nova-snoozed-until";
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function NovaFab() {
  const pathname = usePathname();
  const router = useRouter();
  const [nudge, setNudge] = useState<NovaNudge | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check AI consent
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/consent");
        if (res.ok) {
          const { consents } = await res.json();
          const aiConsent = consents?.find(
            (c: { consent_type: string; granted: boolean }) => c.consent_type === "ai_data_processing"
          );
          setHasConsent(aiConsent?.granted ?? false);
        } else {
          const stored = localStorage.getItem("stargate-privacy-ai-consent");
          setHasConsent(stored === "true");
        }
      } catch {
        const stored = localStorage.getItem("stargate-privacy-ai-consent");
        setHasConsent(stored === "true");
      }
    }
    check();
  }, []);

  // Detect nudges
  const evaluate = useCallback(async () => {
    if (hasConsent !== true) return;

    // Check snooze
    const snoozedUntil = localStorage.getItem(SNOOZED_KEY);
    if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) return;

    // Load dismissed set
    const dismissedRaw = localStorage.getItem(DISMISSED_KEY);
    const dismissed = new Set<string>(dismissedRaw ? JSON.parse(dismissedRaw) : []);

    try {
      const { data: allTrades } = await fetchAllTrades(supabase);
      const recentTrades = (allTrades ?? [])
        .filter((t: Trade) => t.close_timestamp)
        .sort((a: Trade, b: Trade) => (b.close_timestamp ?? "").localeCompare(a.close_timestamp ?? ""))
        .slice(0, 20);

      const today = new Date().toISOString().split("T")[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [journalRes, checkinRes] = await Promise.all([
        supabase
          .from("journal_notes")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", `${today}T00:00:00`)
          .limit(1),
        supabase
          .from("daily_checkins")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", `${today}T00:00:00`)
          .limit(1),
      ]);

      const hasJournal = (journalRes.data?.length ?? 0) > 0;
      const hasCheckin = (checkinRes.data?.length ?? 0) > 0;

      const tradeNudges = detectTradeNudges(recentTrades);
      const timeNudges = detectTimeNudges(hasJournal, hasCheckin);
      const allNudges = [...tradeNudges, ...timeNudges]
        .filter((n) => !dismissed.has(n.id))
        .sort((a, b) => a.priority - b.priority);

      const topNudge = allNudges[0] ?? null;
      setNudge(topNudge);
      if (topNudge) {
        setShowBubble(true);
      }
    } catch {
      // Non-critical
    }
  }, [hasConsent, supabase]);

  useEffect(() => {
    evaluate();
    intervalRef.current = setInterval(evaluate, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [evaluate]);

  function dismiss() {
    if (nudge) {
      const dismissedRaw = localStorage.getItem(DISMISSED_KEY);
      const dismissed: string[] = dismissedRaw ? JSON.parse(dismissedRaw) : [];
      dismissed.push(nudge.id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed.slice(-50)));
    }
    setShowBubble(false);
    setNudge(null);
  }

  function snooze() {
    localStorage.setItem(SNOOZED_KEY, String(Date.now() + 2 * 60 * 60 * 1000));
    setShowBubble(false);
    setNudge(null);
  }

  function handleFabClick() {
    if (nudge && showBubble) {
      router.push(nudge.ctaLink);
    } else if (nudge && !showBubble) {
      setShowBubble(true);
    } else {
      router.push("/dashboard/ai");
    }
  }

  // Hide on AI page or without consent
  if (pathname === "/dashboard/ai" || hasConsent !== true) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
      {/* Speech bubble */}
      <AnimatePresence>
        {showBubble && nudge && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="relative max-w-[280px] rounded-2xl border border-border bg-surface p-4 shadow-xl"
          >
            <button
              onClick={dismiss}
              className="absolute top-2 right-2 p-0.5 text-muted hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>

            <p className="text-sm text-foreground leading-snug pr-4 mb-3">
              {nudge.message}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(nudge.ctaLink)}
                className="px-3 py-1.5 rounded-lg bg-accent text-background text-xs font-semibold hover:bg-accent-hover transition-colors"
              >
                {nudge.cta}
              </button>
              <button
                onClick={snooze}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-muted hover:text-foreground transition-colors"
                title="Remind me later (2 hours)"
              >
                <Clock size={10} />
                Later
              </button>
            </div>

            {/* Caret pointing down */}
            <div className="absolute -bottom-[6px] left-5 w-3 h-3 rotate-45 bg-surface border-r border-b border-border" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <button
        onClick={handleFabClick}
        className={`relative w-11 h-11 rounded-full border shadow-lg flex items-center justify-center transition-all ${
          nudge
            ? "bg-accent/10 border-accent/40 hover:bg-accent/20"
            : "bg-surface border-border hover:border-accent/30"
        }`}
        title="Talk to Nova"
      >
        <Sparkles size={18} className={nudge ? "text-accent" : "text-muted"} />
        {nudge && (
          <span className="absolute inset-0 rounded-full border-2 border-accent/50 animate-ping" />
        )}
      </button>
    </div>
  );
}
