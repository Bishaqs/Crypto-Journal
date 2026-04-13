"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade, SetupStats } from "@/lib/types";
import { calculateTradePnl } from "@/lib/calculations";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import type { Playbook } from "@/lib/schemas/playbook";

type PlaybookStatsResult = {
  /** Stats keyed by playbook ID */
  playbookStats: Map<string, SetupStats>;
  /** All playbooks for the user */
  playbooks: Playbook[];
  loading: boolean;
};

/**
 * Computes win rate, P&L, and process stats per playbook from closed trades.
 * Matches via playbook_id (hard link) or setup_type name (fuzzy fallback).
 */
export function usePlaybookStats(): PlaybookStatsResult {
  const supabase = createClient();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaybooks = useCallback(async () => {
    try {
      const res = await fetch("/api/playbook");
      if (res.ok) {
        const data = await res.json();
        return (data.playbooks ?? []) as Playbook[];
      }
    } catch {
      // Silently fail — playbook stats are non-critical
    }
    return [] as Playbook[];
  }, []);

  const fetchTradesData = useCallback(async () => {
    const { data } = await fetchAllTrades(supabase);
    return (data as Trade[]) ?? [];
  }, [supabase]);

  useEffect(() => {
    Promise.all([fetchPlaybooks(), fetchTradesData()]).then(([pbs, tds]) => {
      setPlaybooks(pbs);
      setTrades(tds);
      setLoading(false);
    });
  }, [fetchPlaybooks, fetchTradesData]);

  const playbookStats = useMemo(() => {
    const map = new Map<string, { pnl: number; wins: number; count: number; processTotal: number; processCount: number }>();

    for (const t of trades.filter((t) => t.close_timestamp)) {
      const tradeAny = t as Record<string, unknown>;
      const pbId = tradeAny.playbook_id as string | null;

      if (pbId) {
        const p = t.pnl ?? calculateTradePnl(t) ?? 0;
        const e = map.get(pbId) ?? { pnl: 0, wins: 0, count: 0, processTotal: 0, processCount: 0 };
        map.set(pbId, {
          pnl: e.pnl + p,
          wins: e.wins + (p > 0 ? 1 : 0),
          count: e.count + 1,
          processTotal: e.processTotal + (t.process_score ?? 0),
          processCount: e.processCount + (t.process_score !== null ? 1 : 0),
        });
      } else if (t.setup_type) {
        const matchedPb = playbooks.find(
          (pb) => pb.name.toLowerCase() === t.setup_type!.toLowerCase()
        );
        if (matchedPb) {
          const p = t.pnl ?? calculateTradePnl(t) ?? 0;
          const e = map.get(matchedPb.id) ?? { pnl: 0, wins: 0, count: 0, processTotal: 0, processCount: 0 };
          map.set(matchedPb.id, {
            pnl: e.pnl + p,
            wins: e.wins + (p > 0 ? 1 : 0),
            count: e.count + 1,
            processTotal: e.processTotal + (t.process_score ?? 0),
            processCount: e.processCount + (t.process_score !== null ? 1 : 0),
          });
        }
      }
    }

    const result = new Map<string, SetupStats>();
    for (const [key, d] of map) {
      result.set(key, {
        tradeCount: d.count,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        totalPnl: d.pnl,
        avgPnl: d.count > 0 ? d.pnl / d.count : 0,
        avgProcess: d.processCount > 0 ? d.processTotal / d.processCount : 0,
      });
    }
    return result;
  }, [trades, playbooks]);

  return { playbookStats, playbooks, loading };
}

/**
 * Looks up stats for a trade by playbook_id (hard) or setup_type (fuzzy).
 * Returns the stats + playbook name, or null if no match.
 */
export function getStatsForTrade(
  trade: Trade,
  playbookStats: Map<string, SetupStats>,
  playbooks: Playbook[],
): { stats: SetupStats; playbookName: string } | null {
  const tradeAny = trade as Record<string, unknown>;
  const pbId = tradeAny.playbook_id as string | null;

  if (pbId) {
    const stats = playbookStats.get(pbId);
    const pb = playbooks.find((p) => p.id === pbId);
    if (stats && pb) return { stats, playbookName: pb.name };
  }

  if (trade.setup_type) {
    const matchedPb = playbooks.find(
      (pb) => pb.name.toLowerCase() === trade.setup_type!.toLowerCase()
    );
    if (matchedPb) {
      const stats = playbookStats.get(matchedPb.id);
      if (stats) return { stats, playbookName: matchedPb.name };
    }
  }

  return null;
}
