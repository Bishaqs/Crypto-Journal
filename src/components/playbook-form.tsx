"use client";

import { useState } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { TagInput } from "@/components/tag-input";
import type { Playbook } from "@/lib/schemas/playbook";

const ASSET_CLASSES = ["all", "crypto", "stocks", "commodities", "forex"] as const;
const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"] as const;

type PlaybookFormProps = {
  editPlaybook?: Playbook | null;
  onClose: () => void;
  onSaved: () => void;
};

export function PlaybookForm({ editPlaybook, onClose, onSaved }: PlaybookFormProps) {
  const isEdit = !!editPlaybook;

  const [name, setName] = useState(editPlaybook?.name ?? "");
  const [description, setDescription] = useState(editPlaybook?.description ?? "");
  const [assetClass, setAssetClass] = useState<(typeof ASSET_CLASSES)[number]>(
    editPlaybook?.asset_class ?? "all"
  );
  const [entryRules, setEntryRules] = useState<string[]>(
    editPlaybook?.entry_rules?.length ? editPlaybook.entry_rules : [""]
  );
  const [exitRules, setExitRules] = useState<string[]>(
    editPlaybook?.exit_rules?.length ? editPlaybook.exit_rules : [""]
  );
  const [stopLossStrategy, setStopLossStrategy] = useState(editPlaybook?.stop_loss_strategy ?? "");
  const [riskPerTrade, setRiskPerTrade] = useState(editPlaybook?.risk_per_trade ?? "");
  const [timeframes, setTimeframes] = useState<string[]>(editPlaybook?.timeframes ?? []);
  const [tags, setTags] = useState<string[]>(editPlaybook?.tags ?? []);
  const [isActive, setIsActive] = useState(editPlaybook?.is_active ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRule(list: string[], setList: (v: string[]) => void) {
    if (list.length >= 20) return;
    setList([...list, ""]);
  }

  function updateRule(list: string[], setList: (v: string[]) => void, index: number, value: string) {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  }

  function removeRule(list: string[], setList: (v: string[]) => void, index: number) {
    if (list.length <= 1) {
      setList([""]);
      return;
    }
    setList(list.filter((_, i) => i !== index));
  }

  function toggleTimeframe(tf: string) {
    setTimeframes((prev) =>
      prev.includes(tf) ? prev.filter((t) => t !== tf) : [...prev, tf]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const filteredEntryRules = entryRules.filter((r) => r.trim());
      const filteredExitRules = exitRules.filter((r) => r.trim());

      if (!name.trim()) {
        setError("Name is required");
        return;
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        asset_class: assetClass,
        entry_rules: filteredEntryRules,
        exit_rules: filteredExitRules,
        stop_loss_strategy: stopLossStrategy.trim() || null,
        risk_per_trade: riskPerTrade.trim() || null,
        timeframes,
        tags,
        is_active: isActive,
      };

      const url = isEdit ? `/api/playbook/${editPlaybook.id}` : "/api/playbook";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save playbook");
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
            {isEdit ? "Edit Setup" : "New Setup"}
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
          {/* Name */}
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Setup Name <span className="text-loss">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 4H Range Breakout"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When to use this setup, what market conditions it works best in..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 resize-none"
            />
          </div>

          {/* Asset Class */}
          <div>
            <label className="block text-xs text-muted mb-2">Asset Class</label>
            <div className="flex flex-wrap gap-2">
              {ASSET_CLASSES.map((ac) => (
                <button
                  key={ac}
                  type="button"
                  onClick={() => setAssetClass(ac)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 capitalize ${
                    assetClass === ac
                      ? "bg-accent/10 border-accent/30 text-accent shadow-sm"
                      : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
                  }`}
                >
                  {ac === "all" ? "All Assets" : ac}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">Entry Rules</label>
              <button
                type="button"
                onClick={() => addRule(entryRules, setEntryRules)}
                className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover transition-colors"
              >
                <Plus size={12} />
                Add Rule
              </button>
            </div>
            <div className="space-y-2">
              {entryRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical size={14} className="text-muted/30 shrink-0" />
                  <span className="text-xs text-accent shrink-0 w-5">{i + 1}.</span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(entryRules, setEntryRules, i, e.target.value)}
                    placeholder="e.g. Wait for 4H candle close above resistance"
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(entryRules, setEntryRules, i)}
                    className="p-1 rounded hover:bg-loss/10 transition-colors"
                  >
                    <Trash2 size={14} className="text-muted hover:text-loss" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Exit Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">Exit Rules</label>
              <button
                type="button"
                onClick={() => addRule(exitRules, setExitRules)}
                className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover transition-colors"
              >
                <Plus size={12} />
                Add Rule
              </button>
            </div>
            <div className="space-y-2">
              {exitRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical size={14} className="text-muted/30 shrink-0" />
                  <span className="text-xs text-accent shrink-0 w-5">{i + 1}.</span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(exitRules, setExitRules, i, e.target.value)}
                    placeholder="e.g. TP1 at 1:1 R:R (take 50% off)"
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(exitRules, setExitRules, i)}
                    className="p-1 rounded hover:bg-loss/10 transition-colors"
                  >
                    <Trash2 size={14} className="text-muted hover:text-loss" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stop Loss & Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">Stop Loss Strategy</label>
              <input
                type="text"
                value={stopLossStrategy}
                onChange={(e) => setStopLossStrategy(e.target.value)}
                placeholder="e.g. Below range low with 1% buffer"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Risk Per Trade</label>
              <input
                type="text"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(e.target.value)}
                placeholder="e.g. 1-2% of account"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
              />
            </div>
          </div>

          {/* Timeframes */}
          <div>
            <label className="block text-xs text-muted mb-2">Timeframes</label>
            <div className="flex flex-wrap gap-2">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => toggleTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    timeframes.includes(tf)
                      ? "bg-accent/10 border-accent/30 text-accent shadow-sm"
                      : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Tags</label>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="Add tags (e.g. breakout, trend-follow)..."
              suggestions={["breakout", "reversal", "trend-follow", "scalp", "swing", "mean-reversion", "momentum", "squeeze", "range", "pullback"]}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-foreground font-medium">Active</p>
              <p className="text-xs text-muted">Inactive setups won't appear in trade forms</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isActive ? "bg-accent" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isActive ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
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
              disabled={saving || !name.trim()}
              className="px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Setup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
