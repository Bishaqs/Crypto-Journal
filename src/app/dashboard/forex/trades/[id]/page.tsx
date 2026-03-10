"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ForexTrade } from "@/lib/types";
import {
  ArrowLeft,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Brain,
  BarChart2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data (fallback when no DB trades exist)
// ---------------------------------------------------------------------------

const MOCK_FOREX_TRADES: ForexTrade[] = [
  {
    id: "fx-1", user_id: "u1", pair: "EUR/USD", base_currency: "EUR", quote_currency: "USD",
    pair_category: "major", lot_type: "standard", lot_size: 1,
    position: "long", entry_price: 1.0850, exit_price: 1.0920,
    fees: 7, open_timestamp: "2026-02-20T08:00:00Z",
    close_timestamp: "2026-02-20T14:30:00Z",
    pip_value: 10, leverage: 50, spread: 1.2, swap_fee: 0,
    session: "london", broker: "OANDA",
    emotion: "Confident", confidence: 8, setup_type: "Trend Follow",
    process_score: 9, checklist: null, review: null,
    notes: "Clean trend continuation.", tags: ["trend", "major"],
    stop_loss: null, profit_target: null, pnl: 693, created_at: "2026-02-20T08:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Stat Helper
// ---------------------------------------------------------------------------

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</p>
      <p className={`text-sm font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  major: "Major", minor: "Minor", exotic: "Exotic",
};

const SESSION_LABELS: Record<string, string> = {
  london: "London", new_york: "New York", tokyo: "Tokyo", sydney: "Sydney", overlap: "Overlap",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ForexTradeDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [trade, setTrade] = useState<ForexTrade | null>(null);
  const [allTradeIds, setAllTradeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const tradeId = params.id as string;

  const fetchTrade = useCallback(async () => {
    const { data: allTrades } = await supabase
      .from("forex_trades").select("id, open_timestamp").order("open_timestamp", { ascending: false });
    const ids = (allTrades ?? []).map((t: { id: string }) => t.id);

    if (ids.length > 0) {
      setAllTradeIds(ids);
      const { data } = await supabase.from("forex_trades").select("*").eq("id", tradeId).single();
      if (data) { setTrade(data as ForexTrade); setLoading(false); return; }
    }

    setAllTradeIds(MOCK_FOREX_TRADES.map((t) => t.id));
    const demo = MOCK_FOREX_TRADES.find((t) => t.id === tradeId);
    setTrade(demo ?? null);
    setLoading(false);
  }, [supabase, tradeId]);

  useEffect(() => { fetchTrade(); }, [fetchTrade]);

  const currentIndex = allTradeIds.indexOf(tradeId);
  const prevId = currentIndex > 0 ? allTradeIds[currentIndex - 1] : null;
  const nextId = currentIndex < allTradeIds.length - 1 ? allTradeIds[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="space-y-6 mx-auto max-w-[1200px] pb-20">
        <button onClick={() => router.push("/dashboard/forex/trades")} className="flex items-center gap-2 text-muted hover:text-foreground">
          <ArrowLeft size={18} /> Back to Trade Log
        </button>
        <div className="glass rounded-2xl border border-border/50 p-12 text-center">
          <p className="text-muted">Trade not found</p>
        </div>
      </div>
    );
  }

  const pnl = trade.pnl ?? 0;
  const isOpen = trade.exit_price === null;
  const isWin = pnl > 0;

  return (
    <div className="space-y-6 mx-auto max-w-[1200px] pb-20">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/forex/trades")}
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft size={20} className="text-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign size={22} className="text-accent" />
              {trade.pair}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              {new Date(trade.open_timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => prevId && router.push(`/dashboard/forex/trades/${prevId}`)} disabled={!prevId}
            className="p-2 rounded-xl hover:bg-surface-hover disabled:opacity-30 transition-colors"><ChevronLeft size={18} className="text-muted" /></button>
          <span className="text-xs text-muted tabular-nums">{currentIndex + 1}/{allTradeIds.length}</span>
          <button onClick={() => nextId && router.push(`/dashboard/forex/trades/${nextId}`)} disabled={!nextId}
            className="p-2 rounded-xl hover:bg-surface-hover disabled:opacity-30 transition-colors"><ChevronRight size={18} className="text-muted" /></button>
        </div>
      </div>

      {/* P&L Banner */}
      <div className={`rounded-2xl p-6 text-center ${isOpen ? "bg-accent/5 border border-accent/20" : isWin ? "bg-win/5 border border-win/20" : "bg-loss/5 border border-loss/20"}`}>
        <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
          {isOpen ? "Open Position" : "Realized P&L"}
        </p>
        <p className={`text-3xl font-bold ${isOpen ? "text-accent" : isWin ? "text-win" : "text-loss"}`}>
          {isOpen ? "Open" : `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`}
        </p>
        <div className="flex items-center justify-center gap-1 mt-2">
          {isWin ? <CheckCircle2 size={14} className="text-win" /> : isOpen ? null : <XCircle size={14} className="text-loss" />}
          <span className={`text-xs font-medium ${isOpen ? "text-accent" : isWin ? "text-win" : "text-loss"}`}>
            {trade.position.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Trade Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trade Info */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart2 size={16} className="text-accent" /> Trade Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Pair" value={trade.pair} />
            <Stat label="Category" value={trade.pair_category ? CATEGORY_LABELS[trade.pair_category] ?? trade.pair_category : "—"} />
            <Stat label="Entry Price" value={trade.entry_price.toString()} />
            <Stat label="Exit Price" value={trade.exit_price !== null ? trade.exit_price.toString() : "Open"} />
            <Stat label="Lot Size" value={`${trade.lot_size} ${trade.lot_type ?? ""}`} />
            <Stat label="Fees" value={`$${(trade.fees ?? 0).toFixed(2)}`} />
            {trade.pip_value && <Stat label="Pip Value" value={`$${trade.pip_value}`} />}
            {trade.leverage && <Stat label="Leverage" value={`${trade.leverage}x`} />}
            {trade.spread && <Stat label="Spread" value={`${trade.spread} pips`} />}
            {trade.swap_fee ? <Stat label="Swap Fee" value={`$${trade.swap_fee}`} /> : null}
            {trade.session && <Stat label="Session" value={SESSION_LABELS[trade.session] ?? trade.session} />}
            {trade.broker && <Stat label="Broker" value={trade.broker} />}
          </div>
        </div>

        {/* Psychology */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Brain size={16} className="text-accent" /> Psychology
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Emotion" value={trade.emotion ?? "—"} />
            <Stat label="Confidence" value={trade.confidence ? `${trade.confidence}/10` : "—"} accent />
            <Stat label="Setup Type" value={trade.setup_type ?? "—"} />
            <Stat label="Process Score" value={trade.process_score ? `${trade.process_score}/10` : "—"} accent />
          </div>
          {trade.notes && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">Notes</p>
              <p className="text-sm text-foreground/80 bg-background/50 rounded-xl p-3 border border-border/30">
                {trade.notes}
              </p>
            </div>
          )}
          {trade.tags && trade.tags.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2 flex items-center gap-1">
                <Tag size={12} /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {trade.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-accent/10 text-accent font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="glass rounded-2xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Opened" value={new Date(trade.open_timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} />
          <Stat label="Closed" value={trade.close_timestamp ? new Date(trade.close_timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Open"} />
          <Stat label="Base/Quote" value={`${trade.base_currency}/${trade.quote_currency}`} />
          <Stat label="Created" value={trade.created_at ? new Date(trade.created_at).toLocaleDateString() : "—"} />
        </div>
      </div>
    </div>
  );
}
