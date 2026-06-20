"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { PredictionMarket } from "@/lib/schemas/prediction-market";

const PLATFORMS = [
  "Polymarket",
  "Kalshi",
  "Manifold",
  "Sports",
  "Crypto",
  "Other",
] as const;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type PredictionMarketFormProps = {
  editPrediction?: PredictionMarket | null;
  onClose: () => void;
  onSaved: () => void;
};

export function PredictionMarketForm({
  editPrediction,
  onClose,
  onSaved,
}: PredictionMarketFormProps) {
  const isEdit = !!editPrediction;

  const [title, setTitle] = useState(editPrediction?.title ?? "");
  const [platform, setPlatform] = useState<string>(
    editPrediction?.platform ?? "Polymarket"
  );
  const [direction, setDirection] = useState(editPrediction?.direction ?? "");
  const [yourProb, setYourProb] = useState<number>(
    editPrediction?.your_prob ?? 50
  );
  const [marketProb, setMarketProb] = useState<string>(
    editPrediction?.market_prob != null ? String(editPrediction.market_prob) : ""
  );
  const [stake, setStake] = useState<string>(
    editPrediction?.stake != null ? String(editPrediction.stake) : ""
  );
  const [entryDate, setEntryDate] = useState(
    editPrediction?.entry_date ?? todayISO()
  );
  const [resolveDate, setResolveDate] = useState(
    editPrediction?.resolve_date ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clampProb(value: number): number {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Math.round(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!title.trim()) {
        setError("Title is required");
        return;
      }

      const trimmedMarketProb = marketProb.trim();
      const trimmedStake = stake.trim();

      let marketProbValue: number | null = null;
      if (trimmedMarketProb !== "") {
        const parsed = Number(trimmedMarketProb);
        if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
          setError("Market probability must be a number between 0 and 100");
          return;
        }
        marketProbValue = Math.round(parsed);
      }

      let stakeValue: number | null = null;
      if (trimmedStake !== "") {
        const parsed = Number(trimmedStake);
        if (Number.isNaN(parsed) || parsed < 0) {
          setError("Stake must be a positive number");
          return;
        }
        stakeValue = parsed;
      }

      const payload = {
        title: title.trim(),
        platform: platform || null,
        direction: direction.trim() || null,
        your_prob: clampProb(yourProb),
        market_prob: marketProbValue,
        stake: stakeValue,
        entry_date: entryDate,
        resolve_date: resolveDate || null,
      };

      const url = isEdit
        ? `/api/prediction-markets/${editPrediction.id}`
        : "/api/prediction-markets";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save prediction");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {isEdit ? "Edit Prediction" : "New Prediction"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 px-4 py-2.5 rounded-xl bg-loss/10 border border-loss/20 text-loss text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Question / Title <span className="text-loss">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Will BTC close above $100k by year end?"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
              autoFocus
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs text-muted mb-2">Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    platform === p
                      ? "bg-accent/10 border-accent/30 text-accent shadow-sm"
                      : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Direction</label>
            <input
              type="text"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              placeholder='e.g. "Yes", "No", "Above $100k"'
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
            />
          </div>

          {/* Your probability — slider + % readout */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">
                Your Probability <span className="text-loss">*</span>
              </label>
              <span className="text-sm font-bold text-accent tabular-nums">
                {clampProb(yourProb)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={yourProb}
                onChange={(e) => setYourProb(Number(e.target.value))}
                className="flex-1 accent-accent cursor-pointer"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={yourProb}
                onChange={(e) => setYourProb(clampProb(Number(e.target.value)))}
                className="w-20 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm text-right focus:outline-none focus:border-accent/50 transition-all tabular-nums"
              />
            </div>
            <p className="text-[10px] text-muted/60 mt-1.5">
              Your honest estimate that this resolves in your favor.
            </p>
          </div>

          {/* Market prob & stake */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Market Probability (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={marketProb}
                onChange={(e) => setMarketProb(e.target.value)}
                placeholder="e.g. 42"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Stake</label>
              <input
                type="number"
                min={0}
                step="any"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Amount risked"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 tabular-nums"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Entry Date <span className="text-loss">*</span>
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Resolve Date
              </label>
              <input
                type="date"
                value={resolveDate}
                onChange={(e) => setResolveDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Prediction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
