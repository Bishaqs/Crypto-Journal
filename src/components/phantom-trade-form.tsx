"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { phantomTradeSchema, type PhantomTradeFormData } from "@/lib/validators";
import { PhantomTrade } from "@/lib/types";
import { X } from "lucide-react";
import { EmotionPicker, ConfidenceSlider, SetupTypePicker } from "./psychology-inputs";
import { TagInput } from "./tag-input";
import { getCustomTagPresets, addCustomTagPreset, isUserTag } from "@/lib/tag-manager";
import { getCustomSetupPresets, addCustomSetupPreset, removeCustomSetupPreset } from "@/lib/setup-type-manager";

export function PhantomTradeForm({
  onClose,
  onSaved,
  editPhantom,
}: {
  onClose: () => void;
  onSaved: () => void;
  editPhantom?: PhantomTrade | null;
}) {
  const supabase = createClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Psychology state
  const [emotion, setEmotion] = useState<string | null>(editPhantom?.emotion ?? null);
  const [confidence, setConfidence] = useState<number | null>(editPhantom?.confidence ?? null);
  const [setupType, setSetupType] = useState<string | null>(editPhantom?.setup_type ?? null);

  // Setup presets
  const [setupPresets, setSetupPresets] = useState<string[]>([]);

  // Tags
  const [tags, setTags] = useState<string[]>(editPhantom?.tags ?? []);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setSetupPresets(getCustomSetupPresets());
  }, []);

  useEffect(() => {
    async function fetchTags() {
      const { data } = await fetchAllTrades(supabase, "tags");
      const allTags = new Set<string>();
      if (data) {
        data.forEach((row) => {
          (row.tags as string[] | null)?.forEach((t) => {
            if (isUserTag(t)) allTags.add(t);
          });
        });
      }
      const presets = getCustomTagPresets();
      presets.forEach((p) => allTags.add(p));
      setTagSuggestions(Array.from(allTags).sort());
    }
    fetchTags();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const raw = {
        symbol: formData.get("symbol") as string,
        position: formData.get("position") as string,
        entry_price: formData.get("entry_price") as string,
        stop_loss: formData.get("stop_loss") as string || undefined,
        profit_target: formData.get("profit_target") as string || undefined,
        thesis: formData.get("thesis") as string || undefined,
        setup_type: setupType || undefined,
        confidence: confidence || undefined,
        emotion: emotion || undefined,
        tags,
        observed_at: formData.get("observed_at") as string,
      };

      const result = phantomTradeSchema.safeParse(raw);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      const data: PhantomTradeFormData = result.data;
      const payload = {
        ...data,
        asset_type: "crypto" as const,
        status: "active" as const,
      };

      if (editPhantom) {
        const { error } = await supabase
          .from("phantom_trades")
          .update(payload)
          .eq("id", editPhantom.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("phantom_trades")
          .insert(payload);
        if (error) throw error;
      }

      onSaved();
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Failed to save setup" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface border border-border p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold mb-4">
          {editPhantom ? "Edit Setup" : "Log What-If Setup"}
        </h2>

        {errors.form && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Symbol</label>
            <input
              name="symbol"
              defaultValue={editPhantom?.symbol ?? ""}
              placeholder="BTC"
              className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
            />
            {errors.symbol && <p className="text-xs text-red-400 mt-1">{errors.symbol}</p>}
          </div>

          {/* Direction */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Direction</label>
            <div className="flex gap-2">
              {(["long", "short"] as const).map((dir) => (
                <label key={dir} className="flex-1">
                  <input
                    type="radio"
                    name="position"
                    value={dir}
                    defaultChecked={editPhantom?.position === dir || (!editPhantom && dir === "long")}
                    className="sr-only peer"
                  />
                  <div className={`cursor-pointer rounded-lg border border-border px-3 py-2 text-center text-sm font-medium peer-checked:border-accent peer-checked:bg-accent/10 transition-colors ${dir === "long" ? "peer-checked:text-green-400" : "peer-checked:text-red-400"}`}>
                    {dir === "long" ? "Long" : "Short"}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Entry Price */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Entry Price (at time of observation)</label>
            <input
              name="entry_price"
              type="number"
              step="any"
              defaultValue={editPhantom?.entry_price ?? ""}
              placeholder="0.00"
              className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
            />
            {errors.entry_price && <p className="text-xs text-red-400 mt-1">{errors.entry_price}</p>}
          </div>

          {/* Stop Loss & Profit Target */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Stop Loss</label>
              <input
                name="stop_loss"
                type="number"
                step="any"
                defaultValue={editPhantom?.stop_loss ?? ""}
                placeholder="0.00"
                className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Profit Target</label>
              <input
                name="profit_target"
                type="number"
                step="any"
                defaultValue={editPhantom?.profit_target ?? ""}
                placeholder="0.00"
                className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Observed At */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">When did you spot this?</label>
            <input
              name="observed_at"
              type="datetime-local"
              defaultValue={editPhantom?.observed_at ? new Date(editPhantom.observed_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
              className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
            />
            {errors.observed_at && <p className="text-xs text-red-400 mt-1">{errors.observed_at}</p>}
          </div>

          {/* Thesis */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Thesis — why did you consider this?</label>
            <textarea
              name="thesis"
              rows={3}
              defaultValue={editPhantom?.thesis ?? ""}
              placeholder="What setup did you see? Why did you pass?"
              className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {/* Setup Type */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Setup Type</label>
            <SetupTypePicker
              value={setupType}
              onChange={setSetupType}
              savedPresets={setupPresets}
              onSavePreset={(name) => setSetupPresets(addCustomSetupPreset(name))}
              onRemovePreset={(name) => setSetupPresets(removeCustomSetupPreset(name))}
            />
          </div>

          {/* Emotion */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">How were you feeling?</label>
            <EmotionPicker value={emotion} onChange={setEmotion} />
          </div>

          {/* Confidence */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Confidence</label>
            <ConfidenceSlider value={confidence} onChange={setConfidence} />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tags</label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={tagSuggestions}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent/20 border border-accent/30 text-accent px-4 py-2.5 text-sm font-semibold hover:bg-accent/30 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : editPhantom ? "Update Setup" : "Log Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
