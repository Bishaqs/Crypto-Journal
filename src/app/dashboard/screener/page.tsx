"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, TrendingUp, TrendingDown, BarChart3, RefreshCw } from "lucide-react";
import { PageInfoButton } from "@/components/ui/page-info-button";
import { usePageTour } from "@/lib/use-page-tour";
import { formatLargeNumber, formatPrice } from "@/lib/format";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap_rank: number;
}

type Tab = "gainers" | "losers" | "volume" | "market_cap";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "gainers", label: "Top Gainers", icon: TrendingUp },
  { key: "losers", label: "Top Losers", icon: TrendingDown },
  { key: "volume", label: "Volume Leaders", icon: BarChart3 },
  { key: "market_cap", label: "Market Cap", icon: BarChart3 },
];


export default function TokenScreenerPage() {
  usePageTour("screener-page");
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("gainers");
  const [showCount, setShowCount] = useState(25);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market/screener");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setCoins(json.coins ?? []);
      setError(null);
    } catch {
      setError("Failed to load screener data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredCoins = useMemo(() => {
    let sorted = [...coins];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      sorted = sorted.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }

    // Sort based on tab
    switch (tab) {
      case "gainers":
        sorted.sort((a, b) => (b.price_change_percentage_24h_in_currency ?? 0) - (a.price_change_percentage_24h_in_currency ?? 0));
        break;
      case "losers":
        sorted.sort((a, b) => (a.price_change_percentage_24h_in_currency ?? 0) - (b.price_change_percentage_24h_in_currency ?? 0));
        break;
      case "volume":
        sorted.sort((a, b) => b.total_volume - a.total_volume);
        break;
      case "market_cap":
        sorted.sort((a, b) => b.market_cap - a.market_cap);
        break;
    }

    return sorted.slice(0, showCount);
  }, [coins, tab, showCount, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading screener data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div id="tour-screener-header">
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Search size={24} className="text-accent" />
            Token Screener
            <PageInfoButton tourName="screener-page" />
          </h2>
          <p className="text-sm text-muted mt-0.5">Top movers, volume leaders, and market cap rankings</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border/50 p-1 glass" style={{ boxShadow: "var(--shadow-card)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-accent/10 text-accent shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <t.icon size={12} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coins..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div id="tour-screener-results" className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                {["#", "Coin", "Price", "24h Change", "7d Change", "Market Cap", "Volume (24h)"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCoins.map((coin, idx) => {
                const change24h = coin.price_change_percentage_24h_in_currency;
                const change7d = coin.price_change_percentage_7d_in_currency;
                return (
                  <tr key={coin.id} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coin.image} alt={coin.name} width={24} height={24} className="rounded-full" />
                        <div>
                          <span className="text-xs font-semibold text-foreground">{coin.name}</span>
                          <span className="text-[10px] text-muted ml-1.5 uppercase">{coin.symbol}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">{formatPrice(coin.current_price)}</td>
                    <td className="px-4 py-3">
                      {change24h != null ? (
                        <span className={`text-xs font-semibold tabular-nums ${change24h >= 0 ? "text-win" : "text-loss"}`}>
                          {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {change7d != null ? (
                        <span className={`text-xs font-semibold tabular-nums ${change7d >= 0 ? "text-win" : "text-loss"}`}>
                          {change7d >= 0 ? "+" : ""}{change7d.toFixed(2)}%
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground tabular-nums">{formatLargeNumber(coin.market_cap)}</td>
                    <td className="px-4 py-3 text-xs text-muted tabular-nums">{formatLargeNumber(coin.total_volume)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Show count selector */}
      <div className="flex justify-center gap-2">
        {[25, 50, 100].map((n) => (
          <button
            key={n}
            onClick={() => setShowCount(n)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showCount === n
                ? "bg-accent/10 text-accent border border-accent/30"
                : "text-muted hover:text-foreground border border-border"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
