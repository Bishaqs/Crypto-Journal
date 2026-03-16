"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EmotionPicker } from "@/components/psychology-inputs";
import { Plus, X } from "lucide-react";

interface FollowUpEmotionFormProps {
  tradeId: string;
  tradeTable: "trades" | "stock_trades" | "commodity_trades" | "forex_trades";
  phase?: "follow_up" | "post";
  onSaved?: () => void;
}

export function FollowUpEmotionForm({
  tradeId,
  tradeTable,
  phase = "follow_up",
  onSaved,
}: FollowUpEmotionFormProps) {
  const [open, setOpen] = useState(false);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!emotion) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase.from("trade_emotion_logs").insert({
        trade_id: tradeId,
        trade_table: tradeTable,
        emotion,
        note: note.trim() || null,
        phase,
      });
      if (dbError) throw dbError;
      // Reset and close
      setEmotion(null);
      setNote("");
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
      >
        <Plus size={14} />
        Add emotion check-in
      </button>
    );
  }

  return (
    <div className="space-y-3 p-3 rounded-xl border border-border/50 bg-background/50">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
          {phase === "post" ? "Post-Trade Emotion" : "Emotion Check-In"}
        </span>
        <button onClick={() => { setOpen(false); setEmotion(null); setNote(""); }} className="text-muted hover:text-foreground">
          <X size={14} />
        </button>
      </div>

      <EmotionPicker
        value={emotion}
        onChange={setEmotion}
        label="How are you feeling about this trade?"
      />

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (e.g., price dropped below support)..."
        className="w-full py-2 px-3 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
      />

      {error && (
        <p className="text-xs text-loss">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => { setOpen(false); setEmotion(null); setNote(""); }}
          className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!emotion || saving}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-background hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
