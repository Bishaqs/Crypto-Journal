"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { TagInput } from "@/components/tag-input";
import type {
  PredictionMarket,
  PredictionMarketLeg,
} from "@/lib/schemas/prediction-market";
import {
  impliedProbFromOdds,
  oddsFromImpliedProb,
  combinedOdds,
  combinedImpliedProb,
  roundOdds,
} from "@/lib/betting-odds";

const PLATFORMS = [
  "Sports",
  "Polymarket",
  "Kalshi",
  "Manifold",
  "Crypto",
  "Other",
] as const;

type BetType = "single" | "combo";

type LegInput = { selection: string; odds: string; marketProb: string };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtMoney(n: number, currency: string): string {
  return `${currency}${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

type PredictionMarketFormProps = {
  editPrediction?: PredictionMarket | null;
  /** Current value of one unit, in the chosen currency (bankroll * unitPct / 100). */
  unitValue: number;
  currency: string;
  /** Existing event labels, offered as autocomplete suggestions. */
  events?: string[];
  /** Existing tags across all predictions, offered as autocomplete suggestions. */
  tagSuggestions?: string[];
  onClose: () => void;
  onSaved: () => void;
};

export function PredictionMarketForm({
  editPrediction,
  unitValue,
  currency,
  events = [],
  tagSuggestions = [],
  onClose,
  onSaved,
}: PredictionMarketFormProps) {
  const isEdit = !!editPrediction;

  const [betType, setBetType] = useState<BetType>(
    editPrediction?.bet_type ?? "single"
  );
  const [title, setTitle] = useState(editPrediction?.title ?? "");
  const [event, setEvent] = useState(editPrediction?.event ?? "");
  const [platform, setPlatform] = useState<string>(
    editPrediction?.platform ?? "Sports"
  );
  const [tags, setTags] = useState<string[]>(() => {
    if (editPrediction?.tags && editPrediction.tags.length > 0) {
      return editPrediction.tags;
    }
    // Seed from a legacy single direction value for older bets.
    const dir = editPrediction?.direction?.trim();
    return dir ? [dir.toLowerCase()] : [];
  });

  // Single-bet odds ↔ market% (linked)
  const [oddsInput, setOddsInput] = useState<string>(
    editPrediction?.odds != null ? String(editPrediction.odds) : ""
  );
  const [marketProbInput, setMarketProbInput] = useState<string>(
    editPrediction?.market_prob != null ? String(editPrediction.market_prob) : ""
  );

  // Combo legs
  const [legs, setLegs] = useState<LegInput[]>(() => {
    const src = editPrediction?.legs;
    if (src && src.length > 0) {
      return src.map((l) => ({
        selection: l.selection ?? "",
        odds: l.odds != null ? String(l.odds) : "",
        marketProb: l.market_prob != null ? String(l.market_prob) : "",
      }));
    }
    return [
      { selection: "", odds: "", marketProb: "" },
      { selection: "", odds: "", marketProb: "" },
    ];
  });

  const [yourProb, setYourProb] = useState<number>(
    editPrediction?.your_prob ?? 50
  );
  const [stakeUnits, setStakeUnits] = useState<string>(
    editPrediction?.stake_units != null ? String(editPrediction.stake_units) : "1"
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

  // ── Linked odds/% handlers (single) ──
  function onSingleOddsChange(v: string) {
    setOddsInput(v);
    const o = Number(v);
    if (v.trim() !== "" && Number.isFinite(o) && o > 0) {
      const p = impliedProbFromOdds(o);
      setMarketProbInput(p != null ? String(Math.round(p)) : "");
    } else {
      setMarketProbInput("");
    }
  }
  function onSingleProbChange(v: string) {
    setMarketProbInput(v);
    const p = Number(v);
    if (v.trim() !== "" && Number.isFinite(p) && p > 0 && p <= 100) {
      const o = oddsFromImpliedProb(p);
      setOddsInput(o != null ? String(roundOdds(o)) : "");
    } else {
      setOddsInput("");
    }
  }

  // ── Linked odds/% handlers (legs) ──
  function updateLeg(idx: number, patch: Partial<LegInput>) {
    setLegs((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  }
  function onLegOddsChange(idx: number, v: string) {
    const o = Number(v);
    const p =
      v.trim() !== "" && Number.isFinite(o) && o > 0
        ? impliedProbFromOdds(o)
        : null;
    updateLeg(idx, { odds: v, marketProb: p != null ? String(Math.round(p)) : "" });
  }
  function onLegProbChange(idx: number, v: string) {
    const p = Number(v);
    const o =
      v.trim() !== "" && Number.isFinite(p) && p > 0 && p <= 100
        ? oddsFromImpliedProb(p)
        : null;
    updateLeg(idx, { marketProb: v, odds: o != null ? String(roundOdds(o)) : "" });
  }
  function addLeg() {
    setLegs((prev) => [...prev, { selection: "", odds: "", marketProb: "" }]);
  }
  function removeLeg(idx: number) {
    setLegs((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  // ── Derived combined values (combo) ──
  const parsedLegs = legs.map((l) => ({ odds: l.odds.trim() ? Number(l.odds) : null }));
  const comboOdds = combinedOdds(parsedLegs);
  const comboImplied = combinedImpliedProb(parsedLegs);

  // Effective odds / implied market % for the whole bet
  const effectiveOdds =
    betType === "combo" ? comboOdds : oddsInput.trim() ? Number(oddsInput) : null;
  const effectiveMarketProb =
    betType === "combo"
      ? comboImplied
      : marketProbInput.trim()
      ? Number(marketProbInput)
      : null;

  const stakeUnitsNum = stakeUnits.trim() ? Number(stakeUnits) : null;
  const stakeMoney =
    stakeUnitsNum != null && Number.isFinite(stakeUnitsNum)
      ? stakeUnitsNum * unitValue
      : null;
  const potentialReturnUnits =
    stakeUnitsNum != null && effectiveOdds != null
      ? stakeUnitsNum * effectiveOdds
      : null;

  function syncYourProbToMarket() {
    if (effectiveMarketProb != null) setYourProb(clampProb(effectiveMarketProb));
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

      let oddsValue: number | null = null;
      let marketProbValue: number | null = null;
      let legsPayload: PredictionMarketLeg[] = [];

      if (betType === "combo") {
        const cleaned = legs.filter(
          (l) => l.selection.trim() !== "" || l.odds.trim() !== ""
        );
        if (cleaned.length < 2) {
          setError("A combo needs at least 2 legs (selection or odds).");
          return;
        }
        legsPayload = cleaned.map((l) => {
          const o = l.odds.trim() ? Number(l.odds) : null;
          const mp = l.marketProb.trim() ? Math.round(Number(l.marketProb)) : null;
          return {
            selection: l.selection.trim(),
            odds: o != null && Number.isFinite(o) && o > 0 ? roundOdds(o) : null,
            market_prob: mp != null && Number.isFinite(mp) ? mp : null,
          };
        });
        oddsValue = combinedOdds(legsPayload);
        const ci = combinedImpliedProb(legsPayload);
        marketProbValue = ci != null ? Math.round(ci) : null;
      } else {
        if (oddsInput.trim()) {
          const o = Number(oddsInput);
          if (!Number.isFinite(o) || o <= 1) {
            setError("Decimal odds must be greater than 1.");
            return;
          }
          oddsValue = roundOdds(o);
        }
        if (marketProbInput.trim()) {
          const p = Number(marketProbInput);
          if (!Number.isFinite(p) || p < 0 || p > 100) {
            setError("Market probability must be between 0 and 100.");
            return;
          }
          marketProbValue = Math.round(p);
        }
      }

      let stakeUnitsValue: number | null = null;
      if (stakeUnits.trim()) {
        const su = Number(stakeUnits);
        if (!Number.isFinite(su) || su <= 0) {
          setError("Stake (units) must be greater than 0.");
          return;
        }
        stakeUnitsValue = su;
      }

      const stakeMoneyValue =
        stakeUnitsValue != null ? stakeUnitsValue * unitValue : null;

      const payload = {
        title: title.trim(),
        platform: platform || null,
        event: event.trim() || null,
        direction: null,
        tags,
        your_prob: clampProb(yourProb),
        market_prob: marketProbValue,
        stake: stakeMoneyValue,
        entry_date: entryDate,
        resolve_date: resolveDate || null,
        bet_type: betType,
        legs: legsPayload,
        odds: oddsValue,
        stake_units: stakeUnitsValue,
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

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 tabular-nums";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {isEdit ? "Edit Bet" : "New Bet"}
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
          {/* Bet type toggle */}
          <div className="flex gap-2">
            {(["single", "combo"] as BetType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBetType(t)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  betType === t
                    ? "bg-accent/10 border-accent/30 text-accent shadow-sm"
                    : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
                }`}
              >
                {t === "single" ? "Single" : "Combo / Parlay"}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Title <span className="text-loss">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                betType === "combo"
                  ? "e.g. Saturday 3-fold"
                  : "e.g. Bayern to win vs Dortmund"
              }
              className={inputClass}
              autoFocus
            />
          </div>

          {/* Event / group */}
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Event / Group{" "}
              <span className="text-muted/50">(for tabs — e.g. &quot;WM 2026&quot;)</span>
            </label>
            <input
              type="text"
              list="prediction-events"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. WM 2026, Bundesliga, Crypto"
              className={inputClass.replace(" tabular-nums", "")}
            />
            {events.length > 0 && (
              <datalist id="prediction-events">
                {events.map((ev) => (
                  <option key={ev} value={ev} />
                ))}
              </datalist>
            )}
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs text-muted mb-2">Platform / Book</label>
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

          {/* Tags — bet-type labels for grouping & per-tag stats */}
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Tags{" "}
              <span className="text-muted/50">
                (e.g. &quot;win&quot;, &quot;handicap 0-3&quot;, &quot;over 2.5&quot;)
              </span>
            </label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={tagSuggestions}
              placeholder='e.g. "germany win, win" — comma adds two at once'
              showAddButton
            />
            {/* Pick from existing tags without retyping */}
            {tagSuggestions.filter((t) => !tags.includes(t)).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-muted/50 uppercase tracking-wider">
                  Vorhandene:
                </span>
                {tagSuggestions
                  .filter((t) => !tags.includes(t))
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTags([...tags, t])}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-muted/10 text-muted border border-border/50 hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-colors"
                    >
                      <Plus size={10} />
                      {t}
                    </button>
                  ))}
              </div>
            )}
            <p className="text-[10px] text-muted/60 mt-1.5">
              Keep tags generic so Tag Stats can aggregate — tag the bet
              <span className="text-muted"> type</span> (&quot;win&quot;), not the
              team. Want both views? Add the type AND the combo, e.g.
              &quot;win, germany win&quot; (comma = two tags) → you then see
              #win across all games <em>and</em> #germany&nbsp;win on its own. For
              a parlay, tag each leg type. Reuse existing tags via the chips above.
            </p>
          </div>

          {/* Single: linked odds / market% */}
          {betType === "single" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1.5">
                    Decimal Odds
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={1}
                    value={oddsInput}
                    onChange={(e) => onSingleOddsChange(e.target.value)}
                    placeholder="e.g. 1.85"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1.5">
                    Market Probability (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    max={100}
                    value={marketProbInput}
                    onChange={(e) => onSingleProbChange(e.target.value)}
                    placeholder="e.g. 54"
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted/60 -mt-2">
                Enter either — the other is calculated automatically.
              </p>
            </>
          )}

          {/* Combo: legs */}
          {betType === "combo" && (
            <div className="space-y-3">
              <label className="block text-xs text-muted">Legs</label>
              {legs.map((leg, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <input
                    type="text"
                    value={leg.selection}
                    onChange={(e) => updateLeg(idx, { selection: e.target.value })}
                    placeholder={`Leg ${idx + 1} selection`}
                    className={`col-span-6 ${inputClass.replace(" tabular-nums", "")}`}
                  />
                  <input
                    type="number"
                    step="any"
                    min={1}
                    value={leg.odds}
                    onChange={(e) => onLegOddsChange(idx, e.target.value)}
                    placeholder="Odds"
                    className={`col-span-3 ${inputClass}`}
                  />
                  <input
                    type="number"
                    step="any"
                    min={0}
                    max={100}
                    value={leg.marketProb}
                    onChange={(e) => onLegProbChange(idx, e.target.value)}
                    placeholder="%"
                    className={`col-span-2 ${inputClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeLeg(idx)}
                    disabled={legs.length <= 1}
                    className="col-span-1 flex items-center justify-center p-2 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-all disabled:opacity-30"
                    aria-label="Remove leg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLeg}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-accent hover:border-accent/30 transition-all"
              >
                <Plus size={12} />
                Add leg
              </button>
              {comboOdds != null && (
                <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-accent/5 border border-accent/15 text-xs">
                  <span className="text-muted">
                    Combined odds:{" "}
                    <span className="font-bold text-accent tabular-nums">
                      {roundOdds(comboOdds)}
                    </span>
                  </span>
                  {comboImplied != null && (
                    <span className="text-muted">
                      Implied:{" "}
                      <span className="font-bold text-foreground tabular-nums">
                        {comboImplied.toFixed(1)}%
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stake in units */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-muted">Stake (units)</label>
              <span className="text-[11px] text-muted/70">
                1 unit = {fmtMoney(unitValue, currency)}
              </span>
            </div>
            <input
              type="number"
              step="any"
              min={0}
              value={stakeUnits}
              onChange={(e) => setStakeUnits(e.target.value)}
              placeholder="e.g. 2"
              className={inputClass}
            />
            <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted/70">
              {stakeMoney != null && (
                <span>≈ {fmtMoney(stakeMoney, currency)} staked</span>
              )}
              {potentialReturnUnits != null && (
                <span>
                  Potential return:{" "}
                  <span className="text-win font-medium tabular-nums">
                    {potentialReturnUnits.toFixed(2)}u
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Your probability (optional, for calibration) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">
                Your Probability{" "}
                <span className="text-muted/50">(optional — for calibration)</span>
              </label>
              <div className="flex items-center gap-2">
                {effectiveMarketProb != null && (
                  <button
                    type="button"
                    onClick={syncYourProbToMarket}
                    className="text-[10px] px-2 py-0.5 rounded-md border border-border text-muted hover:text-accent hover:border-accent/30 transition-all"
                  >
                    = Market
                  </button>
                )}
                <span className="text-sm font-bold text-accent tabular-nums">
                  {clampProb(yourProb)}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={yourProb}
              onChange={(e) => setYourProb(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
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
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Bet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
