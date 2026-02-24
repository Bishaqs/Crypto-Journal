"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, TrendingUp, TrendingDown, RefreshCw, Activity } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";
import {
  Sparklines,
  SparklinesLine,
} from "react-sparklines";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
  market_cap_rank: number;
}

interface MarketData {
  coins: CoinData[];
  global: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    active_cryptocurrencies: number;
    market_cap_change_percentage_24h_usd: number;
  } | null;
  fearGreed: { value: string; value_classification: string } | null;
  trending: { item: { id: string; name: string; symbol: string; thumb: string; data?: { price_change_percentage_24h?: Record<string, number> } } }[];
  timestamp: number;
}

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(6)}`;
}

function PctBadge({ value }: { value?: number }) {
  if (value == null) return <span className="text-muted">—</span>;
  const isPos = value >= 0;
  return (
    <span className={`text-xs font-semibold tabular-nums ${isPos ? "text-win" : "text-loss"}`}>
      {isPos ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const getColor = (v: number) => {
    if (v <= 24) return "#ef4444";
    if (v <= 49) return "#f97316";
    if (v <= 54) return "#eab308";
    if (v <= 74) return "#22c55e";
    return "#16a34a";
  };
  const color = getColor(value);
  const rotation = (value / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="var(--color-border)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 157} 157`} />
          <line x1="60" y1="55" x2="60" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${rotation}, 60, 55)`} />
        </svg>
      </div>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">{label}</span>
    </div>
  );
}

export default function MarketOverviewPage() {
  usePageTour("market-page");
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market/overview");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Failed to load market data. Retrying...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000); // 5 min
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading market data...</div>
      </div>
    );
  }

  const g = data?.global;
  const fng = data?.fearGreed;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div id="tour-market-header">
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Globe size={24} className="text-accent" />
            Market Overview
            <PageInfoButton tourName="market-page" />
          </h2>
          <p className="text-sm text-muted mt-0.5">Live crypto market data</p>
        </div>
        <div className="flex items-center gap-3">
          {data?.timestamp && (
            <span className="text-[10px] text-muted/50">
              Updated {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {/* Global stats + Fear & Greed */}
      <div id="tour-market-data" className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Market Cap", value: g ? formatLargeNumber(g.total_market_cap.usd) : "—", sub: g ? `${g.market_cap_change_percentage_24h_usd >= 0 ? "+" : ""}${g.market_cap_change_percentage_24h_usd.toFixed(2)}% 24h` : "", color: g && g.market_cap_change_percentage_24h_usd >= 0 ? "text-win" : "text-loss" },
          { label: "24h Volume", value: g ? formatLargeNumber(g.total_volume.usd) : "—", sub: "", color: "text-foreground" },
          { label: "BTC Dominance", value: g ? `${g.market_cap_percentage.btc.toFixed(1)}%` : "—", sub: "", color: "text-accent" },
          { label: "Active Cryptos", value: g ? g.active_cryptocurrencies.toLocaleString() : "—", sub: "", color: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{s.label}</p>
            <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
            {s.sub && <p className={`text-[10px] tabular-nums ${s.color}`}>{s.sub}</p>}
          </div>
        ))}
        {/* Fear & Greed card */}
        <div className="glass rounded-xl border border-border/50 p-4 flex items-center justify-center" style={{ boxShadow: "var(--shadow-card)" }}>
          {fng ? (
            <FearGreedGauge value={Number(fng.value)} label={fng.value_classification} />
          ) : (
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Fear & Greed</p>
              <p className="text-lg font-bold text-muted">—</p>
            </div>
          )}
        </div>
      </div>

      {/* Trending coins */}
      {data && data.trending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity size={14} className="text-accent" />
            Trending
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {data.trending.map((t, i) => (
              <div
                key={t.item.id}
                className="glass rounded-xl border border-border/50 p-3 min-w-[140px] shrink-0"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-muted/40 font-bold">#{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.item.thumb} alt={t.item.name} width={20} height={20} className="rounded-full" />
                  <span className="text-xs font-semibold text-foreground truncate">{t.item.symbol.toUpperCase()}</span>
                </div>
                <p className="text-[10px] text-muted truncate">{t.item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top coins table */}
      {data && data.coins.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["#", "Coin", "Price", "1h", "24h", "7d", "Market Cap", "Volume (24h)", "7d Chart"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.coins.map((coin) => (
                  <tr key={coin.id} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted">{coin.market_cap_rank}</td>
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
                    <td className="px-4 py-3"><PctBadge value={coin.price_change_percentage_1h_in_currency} /></td>
                    <td className="px-4 py-3"><PctBadge value={coin.price_change_percentage_24h_in_currency} /></td>
                    <td className="px-4 py-3"><PctBadge value={coin.price_change_percentage_7d_in_currency} /></td>
                    <td className="px-4 py-3 text-xs text-foreground tabular-nums">{formatLargeNumber(coin.market_cap)}</td>
                    <td className="px-4 py-3 text-xs text-muted tabular-nums">{formatLargeNumber(coin.total_volume)}</td>
                    <td className="px-4 py-3 w-[100px]">
                      {coin.sparkline_in_7d?.price && (
                        <Sparklines data={coin.sparkline_in_7d.price} width={80} height={30}>
                          <SparklinesLine
                            color={(coin.price_change_percentage_7d_in_currency ?? 0) >= 0 ? colors.win : colors.loss}
                            style={{ fill: "none", strokeWidth: 1.5 }}
                          />
                        </Sparklines>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!data?.coins?.length && !loading && !error && (
        <div className="text-center py-16">
          <Globe size={48} className="text-accent/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">No market data</p>
          <p className="text-sm text-muted">Unable to load data. Try refreshing.</p>
        </div>
      )}
    </div>
  );
}
