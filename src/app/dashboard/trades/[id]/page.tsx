"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { Trade, JournalNote, CHAINS } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { formatAndSanitizeMarkdown } from "@/lib/sanitize";
import { useTheme } from "@/lib/theme-context";
import {
  ArrowLeft,
  DollarSign,
  Brain,
  BarChart2,
  Sparkles,
  Loader2,
  ExternalLink,
  Fuel,
  ChevronLeft,
  ChevronRight,
  Tag,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Shield,
  TrendingUp,
  Clock,
  Users,
  FileText,
  LayoutList,
  Grid3x3,
} from "lucide-react";
import { TradeForm } from "@/components/trade-form";
import { RiskMetricsCard } from "@/components/trade-detail/risk-metrics-card";
import { TradeRunningPnlChart } from "@/components/trade-detail/trade-running-pnl-chart";
import { SimilarTradesTable } from "@/components/trade-detail/similar-trades-table";
import { LinkedNotesSection } from "@/components/trade-detail/linked-notes-section";
import { TradeTimeline } from "@/components/trade-detail/trade-timeline";
import { CollapsibleSection } from "@/components/trade-detail/collapsible-section";
import { ExecutionsTable } from "@/components/trade-detail/executions-table";
import { MultiTimeframeExit } from "@/components/trade-detail/multi-timeframe-exit";
import { NoteLinkPicker } from "@/components/trade-detail/note-link-picker";

// ---------------------------------------------------------------------------
// TradingView Mini Chart
// ---------------------------------------------------------------------------

function TradingViewMiniChart({ symbol, colorTheme }: { symbol: string; colorTheme: "dark" | "light" }) {
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
    const tvSymbol = symbol.includes(":") ? symbol : symbol.endsWith("USDT") ? `BINANCE:${symbol}` : `NASDAQ:${symbol}`;
    script.textContent = JSON.stringify({
      symbol: tvSymbol, width: "100%", height: 400, locale: "en", dateRange: "3M",
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
// TradingView Advanced Chart
// ---------------------------------------------------------------------------

function TradingViewAdvancedChart({ symbol, colorTheme }: { symbol: string; colorTheme: "dark" | "light" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "900px";
    widgetDiv.style.width = "100%";
    el.appendChild(widgetDiv);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    const tvSymbol = symbol.includes(":") ? symbol : symbol.endsWith("USDT") ? `BINANCE:${symbol}` : `NASDAQ:${symbol}`;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: colorTheme,
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    el.appendChild(script);
    return () => { el.innerHTML = ""; };
  }, [symbol, colorTheme]);

  return <div ref={containerRef} className="tradingview-widget-container rounded-xl overflow-hidden" style={{ height: 900 }} />;
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
  const tvColorTheme = (theme as string) === "solara" ? "light" : "dark";

  const [trade, setTrade] = useState<Trade | null>(null);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [allTradeIds, setAllTradeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkedNotes, setLinkedNotes] = useState<JournalNote[]>([]);
  const [showNotePicker, setShowNotePicker] = useState(false);
  const supabase = createClient();

  const tradeId = params.id as string;

  const fetchTrade = useCallback(async () => {
    const { data: allTradeData } = await fetchAllTrades(supabase, "*");
    const trades = (allTradeData as Trade[]) ?? [];

    if (trades.length > 0) {
      setAllTrades(trades);
      setAllTradeIds(trades.map((t) => t.id));
      const found = trades.find((t) => t.id === tradeId);
      if (found) { setTrade(found); setLoading(false); return; }
    }

    // Fallback to demo
    setAllTrades(DEMO_TRADES);
    setAllTradeIds(DEMO_TRADES.map((t) => t.id));
    const demo = DEMO_TRADES.find((t) => t.id === tradeId);
    setTrade(demo ?? null);
    setLoading(false);
  }, [supabase, tradeId]);

  const fetchLinkedNotes = useCallback(async () => {
    const { data } = await supabase
      .from("journal_notes")
      .select("*")
      .eq("trade_id", tradeId)
      .order("created_at", { ascending: false });
    setLinkedNotes((data as JournalNote[]) ?? []);
  }, [supabase, tradeId]);

  useEffect(() => { fetchTrade(); fetchLinkedNotes(); }, [fetchTrade, fetchLinkedNotes]);

  // Load cached AI summary
  useEffect(() => {
    if (!tradeId) return;
    const cached = localStorage.getItem(`stargate-ai-summary-${tradeId}`);
    if (cached) setAiSummary(cached);
  }, [tradeId]);

  async function generateSummary() {
    if (!trade) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/trade-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade }),
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
        localStorage.setItem(`stargate-ai-summary-${tradeId}`, data.summary);
      } else {
        setAiSummary(`Error: ${data.error}`);
      }
    } catch {
      setAiSummary("Failed to generate summary.");
    }
    setAiLoading(false);
  }

  async function handleDelete() {
    if (!trade) return;
    await supabase.from("trades").delete().eq("id", trade.id);
    router.push("/dashboard/trades");
  }

  // Navigation
  const currentIdx = allTradeIds.indexOf(tradeId);
  const prevId = currentIdx > 0 ? allTradeIds[currentIdx - 1] : null;
  const nextId = currentIdx < allTradeIds.length - 1 ? allTradeIds[currentIdx + 1] : null;

  // Similar trades (same symbol)
  const similarTrades = allTrades.filter((t) => t.symbol === trade?.symbol && t.id !== tradeId);

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
    <div className="space-y-6 mx-auto max-w-[1400px] pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
              {trade.setup_type && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-border/50 text-muted font-medium">{trade.setup_type}</span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">{new Date(trade.open_timestamp).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Action Buttons */}
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
          >
            <Pencil size={14} /> Edit Trade
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-loss/10 text-loss text-xs font-semibold hover:bg-loss/20 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>

          {/* PnL Display */}
          <div className="text-right pl-4 border-l border-border/30">
            <p className={`text-2xl font-bold ${isOpen ? "text-muted" : isWin ? "text-win" : "text-loss"}`}>
              {isOpen ? "OPEN" : `${isWin ? "+" : ""}$${pnl.toFixed(2)}`}
            </p>
            {!isOpen && <p className="text-xs text-muted">{((pnl / costBasis) * 100).toFixed(2)}% return</p>}
          </div>
        </div>
      </div>

      {/* Top Row: Stats + Psychology + Mini Chart */}
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

        {/* Psychology Card */}
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

        {/* Mini TradingView Chart */}
        <div className="glass rounded-2xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <BarChart2 size={14} className="text-accent" /> Chart
          </h3>
          <TradingViewMiniChart symbol={trade.symbol} colorTheme={tvColorTheme} />
        </div>
      </div>

      {/* Risk Metrics */}
      <RiskMetricsCard trade={trade} />

      {/* Running PnL Chart */}
      <TradeRunningPnlChart trade={trade} />

      {/* Post-Trade Review + AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              dangerouslySetInnerHTML={{ __html: formatAndSanitizeMarkdown(aiSummary) }} />
          ) : (
            <p className="text-xs text-muted/50 italic">Click &quot;Generate&quot; for an AI analysis of this trade.</p>
          )}
        </div>
      </div>

      {/* Notes + Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        {/* DEX Info or empty */}
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

      {/* Multi-Timeframe Exit Analysis */}
      <CollapsibleSection
        title="Multi-Timeframe Exit Analysis"
        icon={<Grid3x3 size={14} className="text-accent" />}
      >
        <MultiTimeframeExit trade={trade} />
      </CollapsibleSection>

      {/* Executions */}
      <CollapsibleSection
        title="Executions"
        icon={<LayoutList size={14} className="text-accent" />}
        defaultOpen
      >
        <ExecutionsTable trade={trade} />
      </CollapsibleSection>

      {/* Advanced TradingView Chart */}
      <CollapsibleSection
        title="Delayed Chart"
        icon={<BarChart2 size={14} className="text-accent" />}
      >
        <TradingViewAdvancedChart symbol={trade.symbol} colorTheme={tvColorTheme} />
      </CollapsibleSection>

      {/* Trade Timeline */}
      <TradeTimeline
        trade={trade}
        notes={linkedNotes}
        onCreateNote={() => router.push(`/dashboard/journal?new=true&link_trade=${trade.id}&asset=crypto`)}
        onLinkExisting={() => setShowNotePicker(true)}
        onRefresh={fetchLinkedNotes}
      />

      {/* Linked Journal Notes */}
      <LinkedNotesSection
        tradeId={trade.id}
        notes={linkedNotes}
        onCreateNote={() => router.push(`/dashboard/journal?new=true&link_trade=${trade.id}&asset=crypto`)}
        onLinkExisting={() => setShowNotePicker(true)}
        onRefresh={fetchLinkedNotes}
      />

      {/* Similar Trades */}
      {similarTrades.length > 0 && (
        <CollapsibleSection
          title={`Similar Trades (${trade.symbol})`}
          icon={<Users size={14} className="text-accent" />}
        >
          <SimilarTradesTable trades={similarTrades} currentTradeId={trade.id} symbol={trade.symbol} />
        </CollapsibleSection>
      )}

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

      {/* Edit Trade Modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-2xl mx-4 mb-10">
            <TradeForm
              editTrade={trade}
              onClose={() => setShowEditForm(false)}
              onSaved={() => { setShowEditForm(false); fetchTrade(); }}
              variant="modal"
            />
          </div>
        </div>
      )}

      {/* Note Link Picker */}
      {showNotePicker && (
        <NoteLinkPicker
          tradeId={trade.id}
          assetType="crypto"
          onLinked={() => { setShowNotePicker(false); fetchLinkedNotes(); }}
          onClose={() => setShowNotePicker(false)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-2xl border border-border/50 p-6 max-w-sm mx-4 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-lg font-bold text-foreground">Delete Trade</h3>
            <p className="text-sm text-muted">
              Are you sure you want to delete this {trade.symbol} {trade.position} trade? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-border/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-loss hover:bg-loss/80 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
