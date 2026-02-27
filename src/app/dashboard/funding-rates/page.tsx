"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BarChart3, RefreshCw, Info, Search, Percent, Zap } from "lucide-react";
import { PageInfoButton } from "@/components/ui/page-info-button";
import { usePageTour } from "@/lib/use-page-tour";

// ── Types ──────────────────────────────────────────────

interface FundingRate {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
}

interface TickerData {
  symbol: string;
  volume: string;
  quoteVolume: string;
  count: number;
  weightedAvgPrice: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
}

interface LiquidationEvent {
  symbol: string;
  side: "BUY" | "SELL";
  price: string;
  quantity: string;
  tradeTime: number;
}

type Tab = "funding" | "volume" | "liquidations";
type FundingFilter = "all" | "positive" | "negative";
type VolumeFilter = "all" | "gainers" | "losers";
type LiqFilter = "all" | "longs" | "shorts";
type FundingSortKey = "rate" | "symbol" | "markPrice";
type VolumeSortKey = "symbol" | "lastPrice" | "change" | "volume" | "trades";
type LiqSortKey = "time" | "symbol" | "side" | "price" | "size";

// ── Helpers ────────────────────────────────────────────

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
  const n = parseFloat(rate) * 100 * 3 * 365;
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

function formatVolume(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Constants ──────────────────────────────────────────

const FUNDING_URLS = [
  "https://fapi.binance.com/fapi/v1/premiumIndex",
  "https://fapi1.binance.com/fapi/v1/premiumIndex",
  "https://fapi2.binance.com/fapi/v1/premiumIndex",
];

const VOLUME_URLS = [
  "https://fapi.binance.com/fapi/v1/ticker/24hr",
  "https://fapi1.binance.com/fapi/v1/ticker/24hr",
  "https://fapi2.binance.com/fapi/v1/ticker/24hr",
];

const WS_URL = "wss://fstream.binance.com/ws/!forceOrder@arr";
const MAX_LIQUIDATIONS = 500;

// ── Component ──────────────────────────────────────────

export default function DerivativesPage() {
  usePageTour("funding-rates-page");

  // Tab
  const [tab, setTab] = useState<Tab>("funding");

  // Funding rates state
  const [rates, setRates] = useState<FundingRate[]>([]);
  const [fundingFilter, setFundingFilter] = useState<FundingFilter>("all");
  const [fundingSortKey, setFundingSortKey] = useState<FundingSortKey>("rate");
  const [fundingSortAsc, setFundingSortAsc] = useState(false);

  // Volume state
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [volumeFilter, setVolumeFilter] = useState<VolumeFilter>("all");
  const [volumeSortKey, setVolumeSortKey] = useState<VolumeSortKey>("volume");
  const [volumeSortAsc, setVolumeSortAsc] = useState(false);

  // Liquidations state
  const [liquidations, setLiquidations] = useState<LiquidationEvent[]>([]);
  const [liqFilter, setLiqFilter] = useState<LiqFilter>("all");
  const [liqSortKey, setLiqSortKey] = useState<LiqSortKey>("time");
  const [liqSortAsc, setLiqSortAsc] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shared state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // ── REST data fetch ──────────────────────────────────

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    const fetchFromUrls = async <T,>(urls: string[]): Promise<T[] | null> => {
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          return await res.json();
        } catch {
          continue;
        }
      }
      return null;
    };

    const [fundingData, volumeData] = await Promise.all([
      fetchFromUrls<FundingRate>(FUNDING_URLS),
      fetchFromUrls<TickerData>(VOLUME_URLS),
    ]);

    if (fundingData) setRates(fundingData);
    if (volumeData) setTickers(volumeData);

    if (!fundingData && !volumeData) {
      if (rates.length === 0 && tickers.length === 0) {
        setError("Failed to load data.");
      } else {
        setError("Refresh failed — showing cached data.");
      }
    } else {
      setError(null);
    }

    setLoading(false);
    setRefreshing(false);
  }, [rates.length, tickers.length]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── WebSocket for liquidations ───────────────────────

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const o = raw.o;
          if (!o) return;
          const evt: LiquidationEvent = {
            symbol: o.s,
            side: o.S,
            price: o.p,
            quantity: o.q,
            tradeTime: o.T,
          };
          setLiquidations((prev) => {
            const next = [evt, ...prev];
            return next.length > MAX_LIQUIDATIONS ? next.slice(0, MAX_LIQUIDATIONS) : next;
          });
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
      }
    };
  }, []);

  // Tick countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Sort handlers ────────────────────────────────────

  const handleFundingSort = (key: FundingSortKey) => {
    if (fundingSortKey === key) setFundingSortAsc(!fundingSortAsc);
    else { setFundingSortKey(key); setFundingSortAsc(false); }
  };

  const handleVolumeSort = (key: VolumeSortKey) => {
    if (volumeSortKey === key) setVolumeSortAsc(!volumeSortAsc);
    else { setVolumeSortKey(key); setVolumeSortAsc(false); }
  };

  const handleLiqSort = (key: LiqSortKey) => {
    if (liqSortKey === key) setLiqSortAsc(!liqSortAsc);
    else { setLiqSortKey(key); setLiqSortAsc(false); }
  };

  // ── Filtered data ────────────────────────────────────

  const filteredRates = useMemo(() => {
    let data = rates.filter((r) => r.symbol.endsWith("USDT"));
    if (search) {
      const q = search.toUpperCase();
      data = data.filter((r) => r.symbol.includes(q));
    }
    if (fundingFilter === "positive") data = data.filter((r) => parseFloat(r.lastFundingRate) > 0);
    if (fundingFilter === "negative") data = data.filter((r) => parseFloat(r.lastFundingRate) < 0);

    data.sort((a, b) => {
      let cmp = 0;
      switch (fundingSortKey) {
        case "rate": cmp = parseFloat(a.lastFundingRate) - parseFloat(b.lastFundingRate); break;
        case "symbol": cmp = a.symbol.localeCompare(b.symbol); break;
        case "markPrice": cmp = parseFloat(a.markPrice) - parseFloat(b.markPrice); break;
      }
      return fundingSortAsc ? cmp : -cmp;
    });
    return data;
  }, [rates, fundingFilter, fundingSortKey, fundingSortAsc, search]);

  const filteredTickers = useMemo(() => {
    let data = tickers.filter((t) => t.symbol.endsWith("USDT"));
    if (search) {
      const q = search.toUpperCase();
      data = data.filter((t) => t.symbol.includes(q));
    }
    if (volumeFilter === "gainers") data = data.filter((t) => parseFloat(t.priceChangePercent) > 0);
    if (volumeFilter === "losers") data = data.filter((t) => parseFloat(t.priceChangePercent) < 0);

    data.sort((a, b) => {
      let cmp = 0;
      switch (volumeSortKey) {
        case "symbol": cmp = a.symbol.localeCompare(b.symbol); break;
        case "lastPrice": cmp = parseFloat(a.lastPrice) - parseFloat(b.lastPrice); break;
        case "change": cmp = parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent); break;
        case "volume": cmp = parseFloat(a.quoteVolume) - parseFloat(b.quoteVolume); break;
        case "trades": cmp = a.count - b.count; break;
      }
      return volumeSortAsc ? cmp : -cmp;
    });
    return data;
  }, [tickers, volumeFilter, volumeSortKey, volumeSortAsc, search]);

  const filteredLiquidations = useMemo(() => {
    let data = liquidations.filter((l) => l.symbol.endsWith("USDT"));
    if (search) {
      const q = search.toUpperCase();
      data = data.filter((l) => l.symbol.includes(q));
    }
    // BUY = short liquidated, SELL = long liquidated
    if (liqFilter === "longs") data = data.filter((l) => l.side === "SELL");
    if (liqFilter === "shorts") data = data.filter((l) => l.side === "BUY");

    data.sort((a, b) => {
      let cmp = 0;
      switch (liqSortKey) {
        case "time": cmp = a.tradeTime - b.tradeTime; break;
        case "symbol": cmp = a.symbol.localeCompare(b.symbol); break;
        case "side": cmp = a.side.localeCompare(b.side); break;
        case "price": cmp = parseFloat(a.price) - parseFloat(b.price); break;
        case "size": cmp = (parseFloat(a.price) * parseFloat(a.quantity)) - (parseFloat(b.price) * parseFloat(b.quantity)); break;
      }
      return liqSortAsc ? cmp : -cmp;
    });
    return data;
  }, [liquidations, liqFilter, liqSortKey, liqSortAsc, search]);

  // ── Stats ────────────────────────────────────────────

  const fundingStats = useMemo(() => {
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

  const volumeStats = useMemo(() => {
    const usdt = tickers.filter((t) => t.symbol.endsWith("USDT"));
    if (usdt.length === 0) return null;
    const totalVolume = usdt.reduce((s, t) => s + parseFloat(t.quoteVolume), 0);
    const mostActive = usdt.reduce((best, t) => t.count > best.count ? t : best, usdt[0]);
    const biggestGainer = usdt.reduce((best, t) =>
      parseFloat(t.priceChangePercent) > parseFloat(best.priceChangePercent) ? t : best, usdt[0]);
    return { totalVolume, mostActive, biggestGainer };
  }, [tickers]);

  const liqStats = useMemo(() => {
    if (liquidations.length === 0) return null;
    const usdtLiqs = liquidations.filter((l) => l.symbol.endsWith("USDT"));
    const sizes = usdtLiqs.map((l) => ({ ...l, usd: parseFloat(l.price) * parseFloat(l.quantity) }));
    const totalUsd = sizes.reduce((s, l) => s + l.usd, 0);
    const biggest = sizes.reduce((best, l) => l.usd > best.usd ? l : best, sizes[0]);
    const longCount = usdtLiqs.filter((l) => l.side === "SELL").length;
    const shortCount = usdtLiqs.filter((l) => l.side === "BUY").length;
    return { totalUsd, biggest, longCount, shortCount };
  }, [liquidations]);

  // ── Render ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading data...</div>
      </div>
    );
  }

  const sortIndicator = (active: boolean, asc: boolean) => active ? (asc ? " ↑" : " ↓") : "";
  const currentCount = tab === "funding" ? filteredRates.length : tab === "volume" ? filteredTickers.length : filteredLiquidations.length;

  const subtitles: Record<Tab, string> = {
    funding: "Perpetual futures funding rates from Binance",
    volume: "24-hour trading volume and price changes from Binance Futures",
    liquidations: "Real-time forced liquidation events from Binance Futures",
  };

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div id="tour-funding-header">
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-accent" />
            Derivatives
            <PageInfoButton tourName="funding-rates-page" />
          </h2>
          <p className="text-sm text-muted mt-0.5">{subtitles[tab]}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <Info size={16} />
          </button>
          {tab !== "liquidations" && (
            <button onClick={() => fetchData(true)} disabled={refreshing} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all disabled:opacity-50">
              <RefreshCw size={16} className={refreshing ? "animate-spin text-accent" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-xl border border-border/50 p-1 glass w-fit" style={{ boxShadow: "var(--shadow-card)" }}>
        <button
          onClick={() => setTab("funding")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            tab === "funding" ? "bg-accent/10 text-accent shadow-sm" : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          <Percent size={12} /> Funding Rates
        </button>
        <button
          onClick={() => setTab("volume")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            tab === "volume" ? "bg-accent/10 text-accent shadow-sm" : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          <BarChart3 size={12} /> 24h Volume
        </button>
        <button
          onClick={() => setTab("liquidations")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            tab === "liquidations" ? "bg-accent/10 text-accent shadow-sm" : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          <Zap size={12} /> Liquidations
          {wsConnected && <span className="w-1.5 h-1.5 rounded-full bg-win animate-pulse" />}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {/* Info Panel */}
      {showInfo && (
        <div className="glass rounded-xl border border-accent/20 p-4 text-sm text-muted space-y-2" style={{ boxShadow: "var(--shadow-card)" }}>
          {tab === "funding" && (
            <>
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
            </>
          )}
          {tab === "volume" && (
            <>
              <p className="font-semibold text-foreground">24h Volume Data</p>
              <p>Shows trading activity over the last 24 hours for all Binance Futures perpetual contracts. High volume indicates strong market interest and liquidity.</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-win/5 border border-win/10 p-2">
                  <span className="font-semibold text-win">Volume spike</span> → Increased interest / potential breakout
                </div>
                <div className="rounded-lg bg-loss/5 border border-loss/10 p-2">
                  <span className="font-semibold text-loss">Low volume</span> → Low liquidity / wider spreads
                </div>
              </div>
            </>
          )}
          {tab === "liquidations" && (
            <>
              <p className="font-semibold text-foreground">Liquidation Events</p>
              <p>Real-time forced liquidation orders from Binance Futures. When a trader&apos;s margin is insufficient, their position is forcefully closed.</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-loss/5 border border-loss/10 p-2">
                  <span className="font-semibold text-loss">Long liquidated</span> → Longs forced out (price dropped)
                </div>
                <div className="rounded-lg bg-win/5 border border-win/10 p-2">
                  <span className="font-semibold text-win">Short liquidated</span> → Shorts forced out (price rose)
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Stats Cards ── */}
      {tab === "funding" && fundingStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Average Rate</p>
            <p className={`text-lg font-bold tabular-nums ${fundingStats.avg > 0 ? "text-loss" : "text-win"}`}>
              {(fundingStats.avg * 100).toFixed(4)}%
            </p>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Highest (Longs Pay)</p>
            <p className="text-lg font-bold tabular-nums text-loss">{(fundingStats.max * 100).toFixed(4)}%</p>
            <p className="text-[10px] text-muted">{fundingStats.maxSymbol.replace("USDT", "")}</p>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Lowest (Shorts Pay)</p>
            <p className="text-lg font-bold tabular-nums text-win">{(fundingStats.min * 100).toFixed(4)}%</p>
            <p className="text-[10px] text-muted">{fundingStats.minSymbol.replace("USDT", "")}</p>
          </div>
        </div>
      )}

      {tab === "volume" && volumeStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Total 24h Volume</p>
            <p className="text-lg font-bold tabular-nums text-foreground">{formatVolume(volumeStats.totalVolume)}</p>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Most Active</p>
            <p className="text-lg font-bold tabular-nums text-accent">{formatCount(volumeStats.mostActive.count)} trades</p>
            <p className="text-[10px] text-muted">{volumeStats.mostActive.symbol.replace("USDT", "")}</p>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Biggest Gainer</p>
            <p className="text-lg font-bold tabular-nums text-win">+{parseFloat(volumeStats.biggestGainer.priceChangePercent).toFixed(2)}%</p>
            <p className="text-[10px] text-muted">{volumeStats.biggestGainer.symbol.replace("USDT", "")}</p>
          </div>
        </div>
      )}

      {tab === "liquidations" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {liqStats ? (
            <>
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Total Liquidated</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{formatVolume(liqStats.totalUsd)}</p>
                <p className="text-[10px] text-muted">{liquidations.length} events</p>
              </div>
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Biggest Liquidation</p>
                <p className="text-lg font-bold tabular-nums text-loss">{formatVolume(liqStats.biggest.usd)}</p>
                <p className="text-[10px] text-muted">{liqStats.biggest.symbol.replace("USDT", "")} — {liqStats.biggest.side === "SELL" ? "Long" : "Short"}</p>
              </div>
              <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Long vs Short</p>
                <p className="text-lg font-bold tabular-nums">
                  <span className="text-loss">{liqStats.longCount}</span>
                  <span className="text-muted/40 mx-1">/</span>
                  <span className="text-win">{liqStats.shortCount}</span>
                </p>
                <p className="text-[10px] text-muted">longs liq. / shorts liq.</p>
              </div>
            </>
          ) : (
            <div className="glass rounded-xl border border-border/50 p-4 col-span-3 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-sm text-muted">
                {wsConnected ? "Waiting for liquidation events..." : "Connecting to Binance WebSocket..."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border/50 p-1 glass" style={{ boxShadow: "var(--shadow-card)" }}>
          {tab === "funding" && ([
            { key: "all" as FundingFilter, label: "All" },
            { key: "positive" as FundingFilter, label: "Longs Pay" },
            { key: "negative" as FundingFilter, label: "Shorts Pay" },
          ]).map((f) => (
            <button key={f.key} onClick={() => setFundingFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                fundingFilter === f.key ? "bg-accent/10 text-accent shadow-sm" : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}>{f.label}</button>
          ))}
          {tab === "volume" && ([
            { key: "all" as VolumeFilter, label: "All" },
            { key: "gainers" as VolumeFilter, label: "Gainers" },
            { key: "losers" as VolumeFilter, label: "Losers" },
          ]).map((f) => (
            <button key={f.key} onClick={() => setVolumeFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                volumeFilter === f.key ? "bg-accent/10 text-accent shadow-sm" : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}>{f.label}</button>
          ))}
          {tab === "liquidations" && ([
            { key: "all" as LiqFilter, label: "All" },
            { key: "longs" as LiqFilter, label: "Longs Liq." },
            { key: "shorts" as LiqFilter, label: "Shorts Liq." },
          ]).map((f) => (
            <button key={f.key} onClick={() => setLiqFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                liqFilter === f.key ? "bg-accent/10 text-accent shadow-sm" : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}>{f.label}</button>
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
        <span className="text-[10px] text-muted/50">{currentCount} {tab === "liquidations" ? "events" : "pairs"}</span>
      </div>

      {/* ── Funding Rates Table ── */}
      {tab === "funding" && (
        <div id="tour-funding-data" className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-border/50">
                  <th onClick={() => handleFundingSort("symbol")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                    Symbol{sortIndicator(fundingSortKey === "symbol", fundingSortAsc)}
                  </th>
                  <th onClick={() => handleFundingSort("markPrice")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                    Mark Price{sortIndicator(fundingSortKey === "markPrice", fundingSortAsc)}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Index Price</th>
                  <th onClick={() => handleFundingSort("rate")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                    Funding Rate{sortIndicator(fundingSortKey === "rate", fundingSortAsc)}
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
                      <td className="px-4 py-2.5"><span className={`text-xs font-bold tabular-nums ${rate.color}`}>{rate.text}</span></td>
                      <td className="px-4 py-2.5"><span className={`text-xs tabular-nums ${rate.color}`}>{annualized}</span></td>
                      <td className="px-4 py-2.5 text-xs text-muted tabular-nums">{formatCountdown(r.nextFundingTime)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Volume Table ── */}
      {tab === "volume" && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-border/50">
                  <th onClick={() => handleVolumeSort("symbol")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                    Symbol{sortIndicator(volumeSortKey === "symbol", volumeSortAsc)}
                  </th>
                  <th onClick={() => handleVolumeSort("lastPrice")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                    Last Price{sortIndicator(volumeSortKey === "lastPrice", volumeSortAsc)}
                  </th>
                  <th onClick={() => handleVolumeSort("change")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                    24h Change{sortIndicator(volumeSortKey === "change", volumeSortAsc)}
                  </th>
                  <th onClick={() => handleVolumeSort("volume")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                    24h Volume{sortIndicator(volumeSortKey === "volume", volumeSortAsc)}
                  </th>
                  <th onClick={() => handleVolumeSort("trades")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                    Trades{sortIndicator(volumeSortKey === "trades", volumeSortAsc)}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">High / Low</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickers.map((t) => {
                  const changePercent = parseFloat(t.priceChangePercent);
                  const changeColor = changePercent > 0 ? "text-win" : changePercent < 0 ? "text-loss" : "text-muted";
                  return (
                    <tr key={t.symbol} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{t.symbol.replace("USDT", "/USDT")}</td>
                      <td className="px-4 py-2.5 text-xs text-foreground tabular-nums">${parseFloat(t.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs font-bold tabular-nums ${changeColor}`}>{changePercent > 0 ? "+" : ""}{changePercent.toFixed(2)}%</span></td>
                      <td className="px-4 py-2.5 text-xs text-foreground tabular-nums">{formatVolume(parseFloat(t.quoteVolume))}</td>
                      <td className="px-4 py-2.5 text-xs text-muted tabular-nums">{formatCount(t.count)}</td>
                      <td className="px-4 py-2.5 text-xs text-muted tabular-nums">${parseFloat(t.highPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })} / ${parseFloat(t.lowPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Liquidations Table ── */}
      {tab === "liquidations" && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {filteredLiquidations.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-muted">
                {wsConnected ? "Waiting for liquidation events..." : "Connecting..."}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface z-10">
                  <tr className="border-b border-border/50">
                    <th onClick={() => handleLiqSort("time")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                      Time{sortIndicator(liqSortKey === "time", liqSortAsc)}
                    </th>
                    <th onClick={() => handleLiqSort("symbol")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                      Symbol{sortIndicator(liqSortKey === "symbol", liqSortAsc)}
                    </th>
                    <th onClick={() => handleLiqSort("side")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                      Side{sortIndicator(liqSortKey === "side", liqSortAsc)}
                    </th>
                    <th onClick={() => handleLiqSort("price")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                      Price{sortIndicator(liqSortKey === "price", liqSortAsc)}
                    </th>
                    <th onClick={() => handleLiqSort("size")} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold cursor-pointer hover:text-foreground">
                      Size{sortIndicator(liqSortKey === "size", liqSortAsc)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLiquidations.map((l, i) => {
                    const isLongLiq = l.side === "SELL";
                    const size = parseFloat(l.price) * parseFloat(l.quantity);
                    return (
                      <tr key={`${l.symbol}-${l.tradeTime}-${i}`} className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-muted tabular-nums">{formatTime(l.tradeTime)}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{l.symbol.replace("USDT", "/USDT")}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-bold ${isLongLiq ? "text-loss" : "text-win"}`}>
                            {isLongLiq ? "Long Liq." : "Short Liq."}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-foreground tabular-nums">${parseFloat(l.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2.5 text-xs text-foreground tabular-nums font-semibold">{formatVolume(size)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
