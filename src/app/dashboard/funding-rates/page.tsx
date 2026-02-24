"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Percent, RefreshCw, Info, Search } from "lucide-react";

interface FundingRate {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
}

type Filter = "all" | "positive" | "negative";
type SortKey = "rate" | "symbol" | "markPrice";

function formatRate(rate: string): { text: string; color: string } {
  const n = parseFloat(rate) * 100;
  if (isNaN(n)) return { text: "—", color: "text-muted" };
  const isPos = n > 0;
  return {
    text: `${isPos ? "+" : ""}${n.toFixed(4)}%`,
    color: isPos ? "text-loss" : n < 0 ? "text-win" : "text-muted",
  };
}

function formatAnnualized(rate: string): string {
  const n = parseFloat(rate) * 100 * 3 * 365; // 3 funding periods/day × 365
  if (isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function formatCountdown(nextTime: number): string {
  const diff = nextTime - Date.now();
  if (diff <= 0) return "Now";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

export default function FundingRatesPage() {
  const [rates, setRates] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [, setTick] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market/funding-rates");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setRates(json.rates ?? []);
      setError(null);
    } catch {
      setError("Failed to load funding rates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Tick countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filteredRates = useMemo(() => {
    let data = rates.filter((r) => r.symbol.endsWith("USDT"));
    if (search) {
      const q = search.toUpperCase();
      data = data.filter((r) => r.symbol.includes(q));
    }
    if (filter === "positive") data = data.filter((r) => parseFloat(r.lastFundingRate) > 0);
    if (filter === "negative") data = data.filter((r) => parseFloat(r.lastFundingRate) < 0);

    data.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rate": cmp = parseFloat(a.lastFundingRate) - parseFloat(b.lastFundingRate); break;
        case "symbol": cmp = a.symbol.localeCompare(b.symbol); break;
        case "markPrice": cmp = parseFloat(a.markPrice) - parseFloat(b.markPrice); break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return data;
  }, [rates, filter, sortKey, sortAsc, search]);

  // Stats
  const stats = useMemo(() => {
    const usdt = rates.filter((r) => r.symbol.endsWith("USDT"));
    const rateValues = usdt.map((r) => parseFloat(r.lastFundingRate)).filter((r) => !isNaN(r));
    if (rateValues.length === 0) return null;
    const avg = rateValues.reduce((s, r) => s + r, 0) / rateValues.length;
    const max = Math.max(...rateValues);
    const min = Math.min(...rateValues);
    const maxSymbol = usdt.find((r) => parseFloat(r.lastFundingRate) === max)?.symbol ?? "";
    const minSymbol = usdt.find((r) => parseFloat(r.lastFundingRate) === min)?.symbol ?? "";
    return { avg, max, min, maxSymbol, minSymbol };
  }, [rates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading funding rates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Percent size={24} className="text-accent" />
            Funding Rates
          </h2>
          <p className="text-sm text-muted mt-0.5">Perpetual futures funding rates from Binance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <Info size={16} />
          </button>
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {showInfo && (
        <div className="glass rounded-xl border border-accent/20 p-4 text-sm text-muted space-y-2" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="font-semibold text-foreground">What are Funding Rates?</p>
          <p>Funding rates keep perpetual futures prices aligned with spot prices. They&apos;re exchanged between long and short traders every 8 hours.</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-win/5 border border-win/10 p-2">
              <span className="font-semibold text-win">Negative rate</span> → Shorts pay longs (bullish signal)
            </div>
            <div className="rounded-lg bg-loss/5 border border-loss/10 p-2">
              <span className="font-semibold text-loss">Positive rate</span> → Longs pay shorts (bearish signal)
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Average Rate</p>
            <p className={`text-lg font-bold tabular-nums ${stats.avg > 0 ? "text-loss" : "text-win"}`}>
              {(stats.avg * 100).toFixed(4)}%
            </p>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Highest (Longs Pay)</p>
            <p className="text-lg font-bold tabular-nums text-loss">{(stats.max * 100).toFixed(4)}%</p>
            <p className="text-[10px] text-muted">{stats.maxSymbol.replace("USDT", "")}</p>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Lowest (Shorts Pay)</p>
            <p className="text-lg font-bold tabular-nums text-win">{(stats.min * 100).toFixed(4)}%</p>
            <p className="text-[10px] text-muted">{stats.minSymbol.replace("USDT", "")}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border/50 p-1 glass" style={{ boxShadow: "var(--shadow-card)" }}>
          {([
            { key: "all" as Filter, label: "All" },
            { key: "positive" as Filter, label: "Longs Pay" },
            { key: "negative" as Filter, label: "Shorts Pay" },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.key
                  ? "bg-accent/10 text-accent shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
        <span className="text-[10px] text-muted/50">{filteredRates.length} pairs</span>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface z-10">
              <tr className="border-b border-border/50">
                <th onClick={() => handleSort("symbol")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                  Symbol {sortKey === "symbol" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th onClick={() => handleSort("markPrice")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                  Mark Price {sortKey === "markPrice" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Index Price</th>
                <th onClick={() => handleSort("rate")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                  Funding Rate {sortKey === "rate" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Annualized</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Next Funding</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((r) => {
                const rate = formatRate(r.lastFundingRate);
                const annualized = formatAnnualized(r.lastFundingRate);
                return (
                  <tr key={r.symbol} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{r.symbol.replace("USDT", "/USDT")}</td>
                    <td className="px-4 py-2.5 text-xs text-foreground tabular-nums">${parseFloat(r.markPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-xs text-muted tabular-nums">${parseFloat(r.indexPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-bold tabular-nums ${rate.color}`}>{rate.text}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs tabular-nums ${rate.color}`}>{annualized}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted tabular-nums">{formatCountdown(r.nextFundingTime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
