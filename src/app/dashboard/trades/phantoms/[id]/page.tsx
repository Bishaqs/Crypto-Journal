"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PhantomTrade, PhantomTradeOutcome } from "@/lib/types";
import { analyzePhantomTrade } from "@/lib/phantom-price-analysis";
import { PhantomTradeForm } from "@/components/phantom-trade-form";
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Ghost, Target, ShieldAlert,
  TrendingUp, TrendingDown, Clock, Edit3, CheckCircle2, XCircle,
} from "lucide-react";
import Link from "next/link";

type OhlcBar = { date: string; open: number; high: number; low: number; close: number; timestamp: number };

export default function PhantomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [phantom, setPhantom] = useState<PhantomTrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [ohlc, setOhlc] = useState<OhlcBar[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Resolution state
  const [resolving, setResolving] = useState(false);
  const [outcome, setOutcome] = useState<PhantomTradeOutcome>("neither");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [savingResolution, setSavingResolution] = useState(false);

  const fetchPhantom = useCallback(async () => {
    const { data, error } = await supabase
      .from("phantom_trades")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Failed to fetch phantom trade:", error?.message);
      setLoading(false);
      return;
    }
    setPhantom(data);
    setOutcome(data.outcome ?? "neither");
    setOutcomeNotes(data.outcome_notes ?? "");
    setLoading(false);
  }, [supabase, id]);

  const fetchPriceData = useCallback(async (symbol: string, observedAt: string) => {
    setPriceLoading(true);
    try {
      const days = Math.min(
        Math.ceil((Date.now() - new Date(observedAt).getTime()) / (1000 * 60 * 60 * 24)) + 7,
        1825,
      );
      const res = await fetch(`/api/market/historical?symbol=${symbol}&days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch price data");
      const json = await res.json();
      setOhlc(json.ohlc ?? []);
    } catch (err) {
      console.error("Price fetch error:", err);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhantom();
  }, [fetchPhantom]);

  useEffect(() => {
    if (phantom) {
      fetchPriceData(phantom.symbol, phantom.observed_at);
    }
  }, [phantom?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update cached price extremes in DB when we get fresh data
  useEffect(() => {
    if (!phantom || ohlc.length === 0) return;

    const analysis = analyzePhantomTrade(
      ohlc,
      phantom.entry_price,
      phantom.position,
      phantom.stop_loss,
      phantom.profit_target,
      phantom.observed_at,
    );

    // Update cached price extremes
    supabase
      .from("phantom_trades")
      .update({
        price_high_since: analysis.highSince,
        price_high_date: analysis.highDate,
        price_low_since: analysis.lowSince,
        price_low_date: analysis.lowDate,
      })
      .eq("id", phantom.id)
      .then(() => {}); // Fire and forget
  }, [ohlc]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResolve() {
    if (!phantom) return;
    setSavingResolution(true);

    try {
      const { error } = await supabase
        .from("phantom_trades")
        .update({
          status: "resolved",
          outcome,
          outcome_notes: outcomeNotes || null,
          outcome_price: ohlc.length > 0 ? ohlc[ohlc.length - 1].close : null,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", phantom.id);

      if (error) throw error;
      await fetchPhantom();
      setResolving(false);
    } catch (err) {
      console.error("Failed to resolve:", err);
    } finally {
      setSavingResolution(false);
    }
  }

  async function handleDelete() {
    if (!phantom || !confirm("Delete this phantom trade?")) return;
    const { error } = await supabase.from("phantom_trades").delete().eq("id", phantom.id);
    if (!error) router.push("/dashboard/trades/phantoms");
  }

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!phantom) return <div className="py-12 text-center text-muted-foreground">Phantom trade not found.</div>;

  const analysis = ohlc.length > 0
    ? analyzePhantomTrade(ohlc, phantom.entry_price, phantom.position, phantom.stop_loss, phantom.profit_target, phantom.observed_at)
    : null;

  const daysElapsed = Math.ceil((Date.now() - new Date(phantom.observed_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/trades/phantoms" className="rounded-lg p-2 hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-2 ${phantom.position === "long" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
              {phantom.position === "long" ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{phantom.symbol}</h1>
                <span className={`text-sm font-medium ${phantom.position === "long" ? "text-green-400" : "text-red-400"}`}>
                  {phantom.position.toUpperCase()}
                </span>
                <Ghost size={16} className="text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Observed {new Date(phantom.observed_at).toLocaleDateString()} · {daysElapsed} days ago
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Price Levels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Entry Price" value={`$${phantom.entry_price.toLocaleString()}`} />
        <StatCard label="Stop Loss" value={phantom.stop_loss ? `$${phantom.stop_loss.toLocaleString()}` : "—"} accent={phantom.stop_loss ? "red" : undefined} />
        <StatCard label="Profit Target" value={phantom.profit_target ? `$${phantom.profit_target.toLocaleString()}` : "—"} accent={phantom.profit_target ? "green" : undefined} />
        <StatCard label="Status" value={phantom.status === "active" ? "Active" : "Resolved"} />
      </div>

      {/* Price Analysis */}
      {priceLoading ? (
        <div className="rounded-xl bg-surface border border-border p-6 text-center text-muted-foreground">
          Fetching price data...
        </div>
      ) : analysis ? (
        <div className="rounded-xl bg-surface border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp size={16} /> Price Analysis
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Current Price" value={`$${analysis.currentPrice.toLocaleString()}`} />
            <StatCard
              label="Hypothetical PnL"
              value={`${analysis.hypotheticalPnlPct >= 0 ? "+" : ""}${analysis.hypotheticalPnlPct.toFixed(2)}%`}
              accent={analysis.hypotheticalPnlPct >= 0 ? "green" : "red"}
            />
            <StatCard
              label="High Since"
              value={`$${analysis.highSince.toLocaleString()}`}
              sub={analysis.highDate}
              accent="green"
            />
            <StatCard
              label="Low Since"
              value={`$${analysis.lowSince.toLocaleString()}`}
              sub={analysis.lowDate}
              accent="red"
            />
          </div>

          {/* Outcome badges */}
          <div className="flex flex-wrap gap-2">
            {analysis.targetHit && (
              <span className="flex items-center gap-1 rounded-full bg-green-400/10 text-green-400 px-3 py-1 text-xs font-medium">
                <CheckCircle2 size={14} /> Target would have been hit
                {analysis.targetHitDate && ` on ${analysis.targetHitDate}`}
              </span>
            )}
            {analysis.stopHit && (
              <span className="flex items-center gap-1 rounded-full bg-red-400/10 text-red-400 px-3 py-1 text-xs font-medium">
                <XCircle size={14} /> Stop would have been hit
                {analysis.stopHitDate && ` on ${analysis.stopHitDate}`}
              </span>
            )}
            {!analysis.targetHit && !analysis.stopHit && (
              <span className="flex items-center gap-1 rounded-full bg-muted/50 text-muted-foreground px-3 py-1 text-xs font-medium">
                <Clock size={14} /> Neither target nor stop hit yet
              </span>
            )}
            {analysis.firstHit !== "neither" && (
              <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${analysis.firstHit === "target" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                {analysis.firstHit === "target" ? <Target size={14} /> : <ShieldAlert size={14} />}
                {analysis.firstHit === "target" ? "Target hit first" : "Stop hit first"}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {/* Thesis */}
      {phantom.thesis && (
        <div className="rounded-xl bg-surface border border-border p-6">
          <h2 className="text-sm font-semibold mb-2">Thesis</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{phantom.thesis}</p>
        </div>
      )}

      {/* Psychology */}
      {(phantom.emotion || phantom.setup_type || phantom.confidence) && (
        <div className="rounded-xl bg-surface border border-border p-6">
          <h2 className="text-sm font-semibold mb-3">Psychology</h2>
          <div className="grid grid-cols-3 gap-3">
            {phantom.emotion && <StatCard label="Emotion" value={phantom.emotion} />}
            {phantom.setup_type && <StatCard label="Setup" value={phantom.setup_type} />}
            {phantom.confidence && <StatCard label="Confidence" value={`${phantom.confidence}/10`} />}
          </div>
        </div>
      )}

      {/* Tags */}
      {phantom.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {phantom.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Resolution Section */}
      {phantom.status === "active" ? (
        <div className="rounded-xl bg-surface border border-border p-6">
          {!resolving ? (
            <button
              onClick={() => setResolving(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              <CheckCircle2 size={16} /> Resolve This Phantom
            </button>
          ) : (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Resolve Phantom Trade</h2>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Outcome</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { value: "target_hit", label: "Target Hit", color: "peer-checked:border-green-400 peer-checked:bg-green-400/10 peer-checked:text-green-400" },
                    { value: "stop_hit", label: "Stop Hit", color: "peer-checked:border-red-400 peer-checked:bg-red-400/10 peer-checked:text-red-400" },
                    { value: "partial", label: "Partial", color: "peer-checked:border-yellow-400 peer-checked:bg-yellow-400/10 peer-checked:text-yellow-400" },
                    { value: "neither", label: "Neither", color: "peer-checked:border-accent peer-checked:bg-accent/10" },
                  ] as const).map((opt) => (
                    <label key={opt.value}>
                      <input
                        type="radio"
                        name="outcome"
                        value={opt.value}
                        checked={outcome === opt.value}
                        onChange={() => setOutcome(opt.value)}
                        className="sr-only peer"
                      />
                      <div className={`cursor-pointer rounded-lg border border-border px-3 py-2 text-center text-sm font-medium transition-colors ${opt.color}`}>
                        {opt.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Reflection</label>
                <textarea
                  rows={3}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="What did you learn? Were you right to pass?"
                  className="w-full rounded-lg bg-muted/50 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResolve}
                  disabled={savingResolution}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  {savingResolution ? "Saving..." : "Save Resolution"}
                </button>
                <button
                  onClick={() => setResolving(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-surface border border-border p-6 space-y-3">
          <h2 className="text-sm font-semibold">Resolution</h2>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
              phantom.outcome === "target_hit" ? "bg-green-400/10 text-green-400" :
              phantom.outcome === "stop_hit" ? "bg-red-400/10 text-red-400" :
              phantom.outcome === "partial" ? "bg-yellow-400/10 text-yellow-400" :
              "bg-muted/50 text-muted-foreground"
            }`}>
              {phantom.outcome === "target_hit" ? "Target Hit" :
               phantom.outcome === "stop_hit" ? "Stop Hit" :
               phantom.outcome === "partial" ? "Partial" : "Neither"}
            </span>
            {phantom.resolved_at && (
              <span className="text-xs text-muted-foreground">
                Resolved {new Date(phantom.resolved_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {phantom.outcome_price && (
            <p className="text-sm text-muted-foreground">Price at resolution: ${phantom.outcome_price.toLocaleString()}</p>
          )}
          {phantom.outcome_notes && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{phantom.outcome_notes}</p>
          )}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <PhantomTradeForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchPhantom(); }}
          editPhantom={phantom}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "green" | "red" }) {
  return (
    <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${accent === "green" ? "text-green-400" : accent === "red" ? "text-red-400" : ""}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
