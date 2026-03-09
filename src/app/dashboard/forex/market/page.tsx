"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, RefreshCw, BarChart3, TrendingUp } from "lucide-react";
import { TradingViewMiniChart, TradingViewTechnicalAnalysis } from "@/components/tradingview-mini-chart";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ForexMarketData {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
}

const MAJOR_PAIRS: { symbol: string; label: string; currency: string; invert: boolean; flag: string }[] = [
  { symbol: "FX:EURUSD", label: "EUR/USD", currency: "EUR", invert: true, flag: "🇪🇺" },
  { symbol: "FX:GBPUSD", label: "GBP/USD", currency: "GBP", invert: true, flag: "🇬🇧" },
  { symbol: "FX:USDJPY", label: "USD/JPY", currency: "JPY", invert: false, flag: "🇯🇵" },
  { symbol: "FX:USDCHF", label: "USD/CHF", currency: "CHF", invert: false, flag: "🇨🇭" },
  { symbol: "FX:USDCAD", label: "USD/CAD", currency: "CAD", invert: false, flag: "🇨🇦" },
  { symbol: "FX:AUDUSD", label: "AUD/USD", currency: "AUD", invert: true, flag: "🇦🇺" },
];

const MINOR_PAIRS: { symbol: string; label: string; base: string; quote: string; flag: string }[] = [
  { symbol: "FX:NZDUSD", label: "NZD/USD", base: "NZD", quote: "USD", flag: "🇳🇿" },
  { symbol: "FX:EURGBP", label: "EUR/GBP", base: "EUR", quote: "GBP", flag: "🇪🇺" },
  { symbol: "FX:EURJPY", label: "EUR/JPY", base: "EUR", quote: "JPY", flag: "🇪🇺" },
  { symbol: "FX:GBPJPY", label: "GBP/JPY", base: "GBP", quote: "JPY", flag: "🇬🇧" },
];

const EXOTIC_PAIRS: { symbol: string; label: string; currency: string; invert: boolean; flag: string }[] = [
  { symbol: "FX:USDMXN", label: "USD/MXN", currency: "MXN", invert: false, flag: "🇲🇽" },
  { symbol: "FX:USDZAR", label: "USD/ZAR", currency: "ZAR", invert: false, flag: "🇿🇦" },
  { symbol: "FX:USDTRY", label: "USD/TRY", currency: "TRY", invert: false, flag: "🇹🇷" },
  { symbol: "FX:USDSGD", label: "USD/SGD", currency: "SGD", invert: false, flag: "🇸🇬" },
];

function ForexRateCard({
  label,
  rate,
  flag,
  decimals = 4,
}: {
  label: string;
  rate: number | null;
  flag: string;
  decimals?: number;
}) {
  return (
    <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{label}</p>
        <span className="text-xs">{flag}</span>
      </div>
      <p className="text-lg font-bold tabular-nums text-foreground">
        {rate !== null ? rate.toFixed(decimals) : "—"}
      </p>
    </div>
  );
}

export default function ForexMarketPage() {
  const [data, setData] = useState<ForexMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market/forex");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Failed to load forex data. Retrying...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getRate = (currency: string, invert: boolean): number | null => {
    const rate = data?.rates?.[currency];
    if (rate == null) return null;
    return invert ? 1 / rate : rate;
  };

  const getCrossRate = (base: string, quote: string): number | null => {
    const baseRate = data?.rates?.[base];
    const quoteRate = data?.rates?.[quote];
    if (baseRate == null || quoteRate == null) return null;
    return quoteRate / baseRate;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading forex data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Globe size={24} className="text-accent" />
            Forex Market
            <InfoTooltip text="Live forex rates — major, minor, and exotic currency pairs with charts" />
          </h2>
          <p className="text-sm text-muted mt-0.5">Currency pairs & exchange rates</p>
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

      {/* Section 1: Major Pairs — rates */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          Major Pairs
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {MAJOR_PAIRS.map(p => (
            <ForexRateCard
              key={p.symbol}
              label={p.label}
              rate={getRate(p.currency, p.invert)}
              flag={p.flag}
              decimals={p.currency === "JPY" ? 2 : 4}
            />
          ))}
        </div>
      </div>

      {/* Section 2: DXY chart + EUR/USD Technical */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-accent" />
            US Dollar Index (DXY)
          </h3>
          <TradingViewMiniChart symbol="PEPPERSTONE:USDX" height={180} />
        </div>

        <div className="glass rounded-xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-accent" />
            EUR/USD Sentiment
          </h3>
          <TradingViewTechnicalAnalysis symbol="FX:EURUSD" height={350} />
        </div>
      </div>

      {/* Section 3: Major Pairs with TradingView Charts */}
      <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-accent" />
          Major Pair Charts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MAJOR_PAIRS.map(({ symbol, label, currency, invert, flag }) => {
            const rate = getRate(currency, invert);
            return (
              <div key={symbol} className="glass rounded-xl border border-border/50 p-3" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground">{flag} {label}</span>
                  {rate !== null && (
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {rate.toFixed(currency === "JPY" ? 2 : 4)}
                    </span>
                  )}
                </div>
                <TradingViewMiniChart symbol={symbol} height={120} dateRange="1M" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Minor Pairs */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          Minor / Cross Pairs
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MINOR_PAIRS.map(p => (
            <ForexRateCard
              key={p.symbol}
              label={p.label}
              rate={getCrossRate(p.base, p.quote)}
              flag={p.flag}
              decimals={p.quote === "JPY" ? 2 : 4}
            />
          ))}
        </div>
      </div>

      {/* Section 5: Exotic Pairs */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Globe size={16} className="text-accent" />
          Exotic Pairs
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EXOTIC_PAIRS.map(p => (
            <ForexRateCard
              key={p.symbol}
              label={p.label}
              rate={getRate(p.currency, p.invert)}
              flag={p.flag}
              decimals={p.currency === "TRY" || p.currency === "ZAR" ? 2 : 4}
            />
          ))}
        </div>
      </div>

      {/* Section 6: Exotic pair charts */}
      <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-accent" />
          Exotic & Cross Charts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...MINOR_PAIRS, ...EXOTIC_PAIRS].map(p => (
            <div key={p.symbol} className="glass rounded-xl border border-border/50 p-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">{"flag" in p ? p.flag : ""} {p.label}</span>
              </div>
              <TradingViewMiniChart symbol={p.symbol} height={120} dateRange="1M" />
            </div>
          ))}
        </div>
      </div>

      {!data && !loading && !error && (
        <div className="text-center py-16">
          <Globe size={48} className="text-accent/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">No forex data</p>
          <p className="text-sm text-muted">Unable to load data. Try refreshing.</p>
        </div>
      )}
    </div>
  );
}
