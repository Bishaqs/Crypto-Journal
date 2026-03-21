"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { Trade } from "@/lib/types";
import { detectTradeNudges, detectTimeNudges } from "@/lib/nova-triggers";
import { useGuide } from "./guide-context";

const DISMISSED_KEY = "traverse-nova-dismissed-nudges";
const SNOOZED_KEY = "traverse-nova-snoozed-until";
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useNovaNudge() {
  const { setNovaNudge } = useGuide();
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const evaluate = useCallback(async () => {
    // Check snooze
    const snoozedUntil = localStorage.getItem(SNOOZED_KEY);
    if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) return;

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
        supabase.from("journal_notes").select("id").eq("user_id", user.id).gte("created_at", `${today}T00:00:00`).limit(1),
        supabase.from("daily_checkins").select("id").eq("user_id", user.id).gte("created_at", `${today}T00:00:00`).limit(1),
      ]);

      const hasJournal = (journalRes.data?.length ?? 0) > 0;
      const hasCheckin = (checkinRes.data?.length ?? 0) > 0;

      const tradeNudges = detectTradeNudges(recentTrades);
      const timeNudges = detectTimeNudges(hasJournal, hasCheckin);
      const allNudges = [...tradeNudges, ...timeNudges]
        .filter((n) => !dismissed.has(n.id))
        .sort((a, b) => a.priority - b.priority);

      setNovaNudge(allNudges[0] ?? null);
    } catch {
      // Non-critical
    }
  }, [supabase, setNovaNudge]);

  useEffect(() => {
    // Check consent before evaluating
    const stored = localStorage.getItem("stargate-privacy-ai-consent");
    if (stored !== "true") {
      // Also check via API
      fetch("/api/consent")
        .then((r) => r.json())
        .then((data) => {
          const granted = data.consents?.find(
            (c: { consent_type: string; granted: boolean }) => c.consent_type === "ai_data_processing"
          )?.granted;
          if (granted) evaluate();
        })
        .catch(() => {});
    } else {
      evaluate();
    }

    intervalRef.current = setInterval(evaluate, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [evaluate]);
}

export function dismissNovaNudge(nudgeId: string) {
  const raw = localStorage.getItem(DISMISSED_KEY);
  const dismissed: string[] = raw ? JSON.parse(raw) : [];
  dismissed.push(nudgeId);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed.slice(-50)));
}

export function snoozeNovaNudges() {
  localStorage.setItem(SNOOZED_KEY, String(Date.now() + 2 * 60 * 60 * 1000));
}
