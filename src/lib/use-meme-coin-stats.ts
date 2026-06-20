"use client";

import { useMemo } from "react";
import type { MemeCoin } from "@/lib/schemas/meme-coin";

export type MemeCoinExtreme = {
  symbol: string;
  multiple: number;
};

export type MemeCoinStats = {
  closedCount: number;
  holdingCount: number;
  watchlistCount: number;
  winRate: number;
  avgMultiple: number;
  realizedPnl: number;
  best: MemeCoinExtreme | null;
  worst: MemeCoinExtreme | null;
};

/**
 * Realized multiple for a CLOSED position.
 * - rugged → 0 (total loss)
 * - sold → exit_market_cap / entry_market_cap when both present, else null
 */
export function realizedMultiple(coin: MemeCoin): number | null {
  if (coin.status === "rugged") return 0;
  if (
    coin.status === "sold" &&
    coin.exit_market_cap != null &&
    coin.entry_market_cap != null &&
    coin.entry_market_cap > 0
  ) {
    return coin.exit_market_cap / coin.entry_market_cap;
  }
  return null;
}

/**
 * Unrealized multiple for an open HOLDING, given a live market cap.
 * Returns null when either value is missing / entry is non-positive.
 */
export function unrealizedMultiple(
  liveMarketCap: number | null | undefined,
  entryMarketCap: number | null | undefined
): number | null {
  if (
    liveMarketCap == null ||
    entryMarketCap == null ||
    entryMarketCap <= 0 ||
    !Number.isFinite(liveMarketCap) ||
    !Number.isFinite(entryMarketCap)
  ) {
    return null;
  }
  return liveMarketCap / entryMarketCap;
}

/**
 * Aggregate stats over a coins array.
 * Closed = status in ('sold','rugged') and not a watchlist entry.
 */
export function useMemeCoinStats(coins: MemeCoin[]): MemeCoinStats {
  return useMemo(() => {
    const watchlistCount = coins.filter((c) => c.is_watchlist).length;
    const positions = coins.filter((c) => !c.is_watchlist);
    const holdingCount = positions.filter((c) => c.status === "holding").length;
    const closed = positions.filter(
      (c) => c.status === "sold" || c.status === "rugged"
    );

    const closedCount = closed.length;

    const multiples: { symbol: string; multiple: number }[] = [];
    for (const c of closed) {
      const m = realizedMultiple(c);
      if (m != null) {
        multiples.push({ symbol: c.symbol ?? "—", multiple: m });
      }
    }

    const wins = multiples.filter((m) => m.multiple > 1).length;
    const winRate = closedCount > 0 ? (wins / closedCount) * 100 : 0;
    const avgMultiple =
      multiples.length > 0
        ? multiples.reduce((sum, m) => sum + m.multiple, 0) / multiples.length
        : 0;

    const realizedPnl = closed.reduce((sum, c) => sum + (c.realized_pnl ?? 0), 0);

    let best: MemeCoinExtreme | null = null;
    let worst: MemeCoinExtreme | null = null;
    for (const m of multiples) {
      if (best === null || m.multiple > best.multiple) best = m;
      if (worst === null || m.multiple < worst.multiple) worst = m;
    }

    return {
      closedCount,
      holdingCount,
      watchlistCount,
      winRate,
      avgMultiple,
      realizedPnl,
      best,
      worst,
    };
  }, [coins]);
}
