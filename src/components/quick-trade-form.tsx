"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateTradePnl } from "@/lib/calculations";
import { Trade } from "@/lib/types";
import { X, Zap } from "lucide-react";

interface QuickTradeFormProps {
  onClose: () => void;
  onSaved: () => void;
  onTradeCompleted?: (trade: { id: string; symbol: string; pnl: number }) => void;
  onSwitchToFull?: (values: { symbol: string; position: string; entry_price: number; quantity: number; exit_price?: number }) => void;
}

export function QuickTradeForm({ onClose, onSaved, onTradeCompleted, onSwitchToFull, variant = "modal" }: QuickTradeFormProps & { variant?: "modal" | "inline" }) {
  const [symbol, setSymbol] = useState("");
  const [position, setPosition] = useState<"long" | "short">("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [exitPrice, setExitPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSubmit() {
    setError("");

    if (!symbol.trim()) { setError("Symbol is required"); return; }
    if (!entryPrice || isNaN(Number(entryPrice))) { setError("Valid entry price required"); return; }
    if (!quantity || isNaN(Number(quantity))) { setError("Valid quantity required"); return; }
    if (isClosed && (!exitPrice || isNaN(Number(exitPrice)))) { setError("Valid exit price required"); return; }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      let pnl: number | null = null;
      if (isClosed && exitPrice) {
        const tempTrade = {
          position,
          entry_price: Number(entryPrice),
          exit_price: Number(exitPrice),
          quantity: Number(quantity),
          fees: 0,
        } as Trade;
        pnl = calculateTradePnl(tempTrade);
      }

      const payload = {
        symbol: symbol.trim().toUpperCase(),
        position,
        entry_price: Number(entryPrice),
        exit_price: isClosed ? Number(exitPrice) : null,
        quantity: Number(quantity),
        fees: 0,
        open_timestamp: now,
        close_timestamp: isClosed ? now : null,
        pnl,
        trade_source: "cex" as const,
        notes: null,
        tags: [],
        emotion: null,
        confidence: null,
        setup_type: null,
        process_score: null,
        checklist: null,
        review: null,
        chain: null,
        dex_protocol: null,
        tx_hash: null,
        wallet_address: null,
        gas_fee: 0,
        gas_fee_native: 0,
        stop_loss: null,
        profit_target: null,
      };

      const { error: dbError } = await supabase.from("trades").insert(payload);

      if (dbError) {
        setError(dbError.message);
        return;
      }

      // Award XP
      try {
        const { awardXP } = await import("@/lib/xp/engine");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await awardXP(supabase, user.id, "trade_logged");
      } catch { /* XP tables may not exist yet */ }

      onSaved();

      // Trigger post-trade prompt for closed trades
      if (isClosed && onTradeCompleted) {
        const { data: inserted } = await supabase
          .from("trades")
          .select("id")
          .eq("symbol", payload.symbol)
          .eq("entry_price", payload.entry_price)
          .order("created_at", { ascending: false })
          .limit(1);

        if (inserted && inserted.length > 0) {
          onTradeCompleted({
            id: inserted[0].id,
            symbol: payload.symbol,
            pnl: pnl ?? 0,
          });
          return;
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trade. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const formContent = (
    <>
      {variant === "modal" && (
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">Quick Trade</span>
            <span className="text-[9px] text-muted bg-accent/10 px-1.5 py-0.5 rounded-md font-medium">~15s</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

        <div className="p-4 space-y-3">
          {/* Symbol + Position */}
          <div className="flex gap-2">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BTC, ETH, AAPL..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all placeholder-muted/40"
              autoFocus
            />
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setPosition("long")}
                className={`px-4 py-2.5 text-xs font-semibold transition-all ${
                  position === "long"
                    ? "bg-win/20 text-win border-r border-win/20"
                    : "bg-background text-muted border-r border-border hover:text-foreground"
                }`}
              >
                Long
              </button>
              <button
                onClick={() => setPosition("short")}
                className={`px-4 py-2.5 text-xs font-semibold transition-all ${
                  position === "short"
                    ? "bg-loss/20 text-loss"
                    : "bg-background text-muted hover:text-foreground"
                }`}
              >
                Short
              </button>
            </div>
          </div>

          {/* Entry Price + Quantity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-muted uppercase tracking-wider font-semibold mb-1 block">Entry</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/40"
              />
            </div>
            <div>
              <label className="text-[9px] text-muted uppercase tracking-wider font-semibold mb-1 block">Quantity</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/40"
              />
            </div>
          </div>

          {/* Closed toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-muted">Already closed?</span>
            <button
              onClick={() => setIsClosed(!isClosed)}
              className={`relative w-10 h-5 rounded-full transition-all ${
                isClosed ? "bg-accent" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  isClosed ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Exit Price (conditional) */}
          {isClosed && (
            <div>
              <label className="text-[9px] text-muted uppercase tracking-wider font-semibold mb-1 block">Exit Price</label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/40"
                autoFocus
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[11px] text-loss bg-loss/10 px-3 py-1.5 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all disabled:opacity-40"
            >
              {saving ? "Logging..." : "Log Trade"}
            </button>
          </div>

          {/* Switch to full form */}
          {onSwitchToFull && (
            <button
              onClick={() => {
                onSwitchToFull({
                  symbol: symbol.trim().toUpperCase(),
                  position,
                  entry_price: Number(entryPrice) || 0,
                  quantity: Number(quantity) || 0,
                  ...(isClosed && exitPrice ? { exit_price: Number(exitPrice) } : {}),
                });
              }}
              className="w-full text-center text-[10px] text-muted hover:text-accent transition-colors py-1"
            >
              Need more fields? Switch to full form →
            </button>
          )}
        </div>
    </>
  );

  if (variant === "inline") {
    return (
      <div className="glass border border-border/50 rounded-2xl w-full overflow-hidden">
        {formContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-border/50 rounded-2xl w-full max-w-sm overflow-hidden">
        {formContent}
      </div>
    </div>
  );
}
