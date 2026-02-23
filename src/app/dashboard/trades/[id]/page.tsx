"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trade, CHAINS } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { useTheme } from "@/lib/theme-context";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Brain,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  ExternalLink,
  Fuel,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";

// ---------------------------------------------------------------------------
// TradingView Chart (reused pattern from watchlist)
// ---------------------------------------------------------------------------

function TradingViewChart({ symbol, colorTheme }: { symbol: string; colorTheme: "dark" | "light" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    el.appendChild(widgetDiv);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    // Map crypto pairs: BTCUSDT → BINANCE:BTCUSDT
    const tvSymbol = symbol.includes(":") ? symbol : symbol.endsWith("USDT") ? `BINANCE:${symbol}` : `NASDAQ:${symbol}`;
    script.textContent = JSON.stringify({
      symbol: tvSymbol, width: "100%", height: 300, locale: "en", dateRange: "3M",
      colorTheme, isTransparent: true, autosize: false, largeChartUrl: "",
      trendLineColor: "rgba(139, 92, 246, 1)", underLineColor: "rgba(139, 92, 246, 0.1)",
      underLineBottomColor: "rgba(139, 92, 246, 0)",
    });
    el.appendChild(script);
    return () => { el.innerHTML = ""; };
  }, [symbol, colorTheme]);

  return <div ref={containerRef} className="tradingview-widget-container rounded-xl overflow-hidden" />;
}

// ---------------------------------------------------------------------------
// Stat Row Helper
// ---------------------------------------------------------------------------

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</p>
      <p className={`text-sm font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const tvColorTheme = theme === "light" ? "light" : "dark";

  const [trade, setTrade] = useState<Trade | null>(null);
  const [allTradeIds, setAllTradeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const supabase = createClient();

  const tradeId = params.id as string;

  const fetchTrade = useCallback(async () => {
    // Try Supabase first
    const { data: allTrades } = await supabase
      .from("trades").select("id, open_timestamp").order("open_timestamp", { ascending: false });
    const ids = (allTrades ?? []).map((t: { id: string }) => t.id);

    if (ids.length > 0) {
      setAllTradeIds(ids);
      const { data } = await supabase.from("trades").select("*").eq("id", tradeId).single();
      if (data) { setTrade(data as Trade); setLoading(false); return; }
    }

    // Fallback to demo
    setAllTradeIds(DEMO_TRADES.map((t) => t.id));
    const demo = DEMO_TRADES.find((t) => t.id === tradeId);
    setTrade(demo ?? null);
    setLoading(false);
  }, [supabase, tradeId]);

  useEffect(() => { fetchTrade(); }, [fetchTrade]);

  // Load cached AI summary
  useEffect(() => {
    if (!tradeId) return;
    const cached = localStorage.getItem(`stargate-ai-summary-${tradeId}`);
    if (cached) setAiSummary(cached);
  }, [tradeId]);

  async function generateSummary() {
    if (!trade) return;
    setAiLoading(true);
    const apiKey = localStorage.getItem("stargate-ai-api-key") || "";
    try {
      const res = await fetch("/api/ai/trade-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade, apiKey }),
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
        localStorage.setItem(`stargate-ai-summary-${tradeId}`, data.summary);
      } else {
        setAiSummary(`Error: ${data.error}`);
      }
    } catch {
      setAiSummary("Failed to generate summary. Check your API key in AI Coach settings.");
    }
    setAiLoading(false);
  }

  // Navigation
  const currentIdx = allTradeIds.indexOf(tradeId);
  const prevId = currentIdx > 0 ? allTradeIds[currentIdx - 1] : null;
  const nextId = currentIdx < allTradeIds.length - 1 ? allTradeIds[currentIdx + 1] : null;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-accent" size={32} /></div>;
  if (!trade) return (
    <div className="text-center py-20">
      <p className="text-muted">Trade not found.</p>
      <button onClick={() => router.push("/dashboard/trades")} className="text-accent hover:underline mt-2 text-sm">Back to trades</button>
    </div>
  );

  const pnl = trade.pnl ?? 0;
  const isWin = pnl > 0;
  const isOpen = !trade.close_timestamp;
  const duration = trade.close_timestamp
    ? ((new Date(trade.close_timestamp).getTime() - new Date(trade.open_timestamp).getTime()) / 3600000).toFixed(1) + "h"
    : "Open";
  const costBasis = trade.entry_price * trade.quantity;
  const chainInfo = trade.chain ? CHAINS.find((c) => c.id === trade.chain) : null;

  return (
    <div className="space-y-6 mx-auto max-w-[1200px] pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/trades")} className="p-2 rounded-xl hover:bg-surface-hover transition-colors">
            <ArrowLeft size={20} className="text-muted" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{trade.symbol}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
                {trade.position.toUpperCase()}
              </span>
              {trade.trade_source === "dex" && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-semibold">DEX</span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">{new Date(trade.open_timestamp).toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${isOpen ? "text-muted" : isWin ? "text-win" : "text-loss"}`}>
            {isOpen ? "OPEN" : `${isWin ? "+" : ""}$${pnl.toFixed(2)}`}
          </p>
          {!isOpen && <p className="text-xs text-muted">{((pnl / costBasis) * 100).toFixed(2)}% return</p>}
        </div>
      </div>

      {/* Top Row: Stats + Risk + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stats Card */}
        <div className="glass rounded-2xl border border-border/50 p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign size={14} className="text-accent" /> Trade Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Entry" value={`$${trade.entry_price.toLocaleString()}`} />
            <Stat label="Exit" value={trade.exit_price ? `$${trade.exit_price.toLocaleString()}` : "—"} />
            <Stat label="Quantity" value={trade.quantity.toString()} />
            <Stat label="Fees" value={`$${trade.fees.toFixed(2)}`} />
            <Stat label="Duration" value={duration} />
            <Stat label="Cost Basis" value={`$${costBasis.toFixed(2)}`} />
            {trade.trade_source === "dex" && trade.gas_fee > 0 && (
              <Stat label="Gas Fee" value={`$${trade.gas_fee.toFixed(2)}`} />
            )}
          </div>
        </div>

        {/* Risk / Psychology Card */}
        <div className="glass rounded-2xl border border-border/50 p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Brain size={14} className="text-accent" /> Psychology
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Emotion" value={trade.emotion || "—"} />
            <Stat label="Confidence" value={trade.confidence != null ? `${trade.confidence}/10` : "—"} />
            <Stat label="Setup" value={trade.setup_type || "—"} />
            <Stat label="Process" value={trade.process_score != null ? `${trade.process_score}/10` : "—"} accent />
          </div>

          {/* Checklist */}
          {trade.checklist && (
            <div className="pt-2 border-t border-border/30">
              <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">Pre-Trade Checklist</p>
              <div className="space-y-1">
                {Object.entries(trade.checklist).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    {val ? <CheckCircle2 size={12} className="text-win" /> : <XCircle size={12} className="text-loss" />}
                    <span className="text-foreground">{key.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TradingView Chart */}
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <BarChart2 size={14} className="text-accent" /> Chart
          </h3>
          <TradingViewChart symbol={trade.symbol} colorTheme={tvColorTheme} />
        </div>
      </div>

      {/* Middle Row: Review + AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Post-Trade Review */}
        <div className="glass rounded-2xl border border-border/50 p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Post-Trade Review</h3>
          {trade.review ? (
            <div className="space-y-2">
              {Object.entries(trade.review).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">{key.replace(/_/g, " ")}</p>
                  <p className="text-sm text-foreground">{val}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted/50 italic">No post-trade review recorded.</p>
          )}
        </div>

        {/* AI Summary */}
        <div className="glass rounded-2xl border border-border/50 p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-accent" /> AI Analysis
            </h3>
            <button
              onClick={generateSummary}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {aiSummary ? "Regenerate" : "Generate"}
            </button>
          </div>
          {aiSummary ? (
            <div className="text-sm text-foreground leading-relaxed prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />
          ) : (
            <p className="text-xs text-muted/50 italic">Click &quot;Generate&quot; for an AI analysis of this trade.</p>
          )}
        </div>
      </div>

      {/* Bottom: Notes + Tags + DEX Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notes */}
        <div className="glass rounded-2xl border border-border/50 p-5 space-y-2" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Notes</h3>
          {trade.notes ? (
            <p className="text-sm text-foreground leading-relaxed">{trade.notes}</p>
          ) : (
            <p className="text-xs text-muted/50 italic">No notes recorded.</p>
          )}
          {trade.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              <Tag size={12} className="text-muted" />
              {trade.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* DEX Info (if applicable) */}
        {trade.trade_source === "dex" && (
          <div className="glass rounded-2xl border border-border/50 p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Fuel size={14} className="text-accent" /> On-Chain Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Chain" value={chainInfo?.label ?? trade.chain ?? "—"} />
              <Stat label="Protocol" value={trade.dex_protocol ?? "—"} />
              <Stat label="Gas Fee" value={`$${trade.gas_fee.toFixed(2)}`} />
              {trade.gas_fee_native > 0 && <Stat label="Gas (Native)" value={trade.gas_fee_native.toFixed(6)} />}
            </div>
            {trade.tx_hash && chainInfo && (
              <a href={`${chainInfo.explorer}${trade.tx_hash}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-accent hover:underline">
                <ExternalLink size={12} /> View on {chainInfo.label} Explorer
              </a>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <button
          onClick={() => prevId && router.push(`/dashboard/trades/${prevId}`)}
          disabled={!prevId}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} /> Previous Trade
        </button>
        <span className="text-xs text-muted/50">{currentIdx + 1} of {allTradeIds.length}</span>
        <button
          onClick={() => nextId && router.push(`/dashboard/trades/${nextId}`)}
          disabled={!nextId}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground disabled:opacity-30 transition-colors"
        >
          Next Trade <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
