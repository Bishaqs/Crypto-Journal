"use client";

import { useState, useEffect } from "react";
import { X, Shield, Target, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { TagInput } from "@/components/tag-input";
import { addCustomTagPreset } from "@/lib/tag-manager";
import { calculateRMultiple, formatRMultiple } from "@/lib/calculations";

type QuickEditPanelProps = {
  trade: Trade;
  onClose: () => void;
  onSaved: () => void;
};

export function QuickEditPanel({ trade, onClose, onSaved }: QuickEditPanelProps) {
  const [stopLoss, setStopLoss] = useState(trade.stop_loss?.toString() ?? "");
  const [profitTarget, setProfitTarget] = useState(trade.profit_target?.toString() ?? "");
  const [priceMfe, setPriceMfe] = useState(trade.price_mfe?.toString() ?? "");
  const [priceMae, setPriceMae] = useState(trade.price_mae?.toString() ?? "");
  const [notes, setNotes] = useState(trade.notes ?? "");
  const [tags, setTags] = useState<string[]>(trade.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live R-Multiple calculation
  const liveR = calculateRMultiple({
    entry_price: trade.entry_price,
    stop_loss: stopLoss ? parseFloat(stopLoss) : null,
    pnl: trade.pnl,
    exit_price: trade.exit_price,
    quantity: trade.quantity,
  });

  // Expected risk/reward
  const sl = parseFloat(stopLoss);
  const pt = parseFloat(profitTarget);
  const expectedRisk = !isNaN(sl) ? Math.abs(trade.entry_price - sl) * trade.quantity : null;
  const expectedReward = !isNaN(pt) ? Math.abs(pt - trade.entry_price) * trade.quantity : null;
  const rrRatio = expectedRisk && expectedReward && expectedRisk > 0
    ? (expectedReward / expectedRisk).toFixed(2)
    : null;

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("trades")
        .update({
          stop_loss: stopLoss ? parseFloat(stopLoss) : null,
          profit_target: profitTarget ? parseFloat(profitTarget) : null,
          price_mfe: priceMfe ? parseFloat(priceMfe) : null,
          price_mae: priceMae ? parseFloat(priceMae) : null,
          notes: notes || null,
          tags,
        })
        .eq("id", trade.id);

      if (dbError) {
        setError(dbError.message);
        return;
      }
      onSaved();
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-[90] w-full max-w-md">
        <div className="h-full glass border-l border-border/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{trade.symbol}</h2>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                  trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
                }`}>
                  {trade.position.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">Quick Edit</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Live derived stats */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">R-Multiple</p>
                <p className={`text-sm font-bold ${liveR !== null ? (liveR >= 0 ? "text-win" : "text-loss") : "text-muted"}`}>
                  {formatRMultiple(liveR) ?? "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Risk</p>
                <p className="text-sm font-bold text-loss">
                  {expectedRisk !== null ? `$${expectedRisk.toFixed(2)}` : "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">R:R</p>
                <p className="text-sm font-bold text-foreground">
                  {rrRatio ? `1:${rrRatio}` : "—"}
                </p>
              </div>
            </div>

            {/* Stop Loss & Profit Target */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5 mb-1.5">
                  <Shield size={12} className="text-loss" /> Stop Loss
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:border-accent/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5 mb-1.5">
                  <Target size={12} className="text-win" /> Profit Target
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input
                    type="number"
                    step="any"
                    value={profitTarget}
                    onChange={(e) => setProfitTarget(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:border-accent/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* MFE & MAE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5 mb-1.5">
                  <TrendingUp size={12} className="text-win" /> MFE Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input
                    type="number"
                    step="any"
                    value={priceMfe}
                    onChange={(e) => setPriceMfe(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:border-accent/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5 mb-1.5">
                  <TrendingDown size={12} className="text-loss" /> MAE Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input
                    type="number"
                    step="any"
                    value={priceMae}
                    onChange={(e) => setPriceMae(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:border-accent/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5 block">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this trade..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5 block">
                Tags
              </label>
              <TagInput value={tags} onChange={setTags} placeholder="Add tags..." onTagAdded={(tag) => addCustomTagPreset(tag)} />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-loss/10 border border-loss/20 text-loss text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border/50 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
