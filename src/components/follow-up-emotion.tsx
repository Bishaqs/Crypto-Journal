"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EmotionPicker } from "@/components/psychology-inputs";
import { useTimezone } from "@/lib/timezone-context";
import { toDateTimeLocal, fromDateTimeLocal } from "@/lib/date-utils";
import { Plus, X, Clock } from "lucide-react";

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
  const [showTimeRange, setShowTimeRange] = useState(false);
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);
  const { timezone } = useTimezone();

  useEffect(() => {
    if (showTimeRange && !startedAt) {
      setStartedAt(toDateTimeLocal(new Date(), timezone));
    }
  }, [showTimeRange, startedAt, timezone]);

  function resetForm() {
    setEmotion(null);
    setNote("");
    setShowTimeRange(false);
    setStartedAt("");
    setEndedAt("");
    setIsOngoing(false);
  }

  async function handleSave() {
    if (!emotion) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {
        trade_id: tradeId,
        trade_table: tradeTable,
        emotion,
        note: note.trim() || null,
        phase,
      };
      if (showTimeRange && startedAt) {
        payload.started_at = fromDateTimeLocal(startedAt, timezone);
        if (!isOngoing && endedAt) {
          payload.ended_at = fromDateTimeLocal(endedAt, timezone);
        }
      }
      const { error: dbError } = await supabase.from("trade_emotion_logs").insert(payload);
      if (dbError) throw dbError;
      resetForm();
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
        <button onClick={() => { setOpen(false); resetForm(); }} className="text-muted hover:text-foreground">
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

      {/* Time range toggle */}
      <button
        type="button"
        onClick={() => setShowTimeRange(!showTimeRange)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <Clock size={12} />
        {showTimeRange ? "Hide time range" : "Set time range"}
      </button>

      {showTimeRange && (
        <div className="space-y-2 p-2.5 rounded-lg border border-border/30 bg-background/30">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted block mb-1">Started at</label>
              <input
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="w-full py-1.5 px-2 rounded-md bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted block mb-1">Ended at</label>
              <input
                type="datetime-local"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
                disabled={isOngoing}
                className="w-full py-1.5 px-2 rounded-md bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all disabled:opacity-40"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={isOngoing}
              onChange={(e) => { setIsOngoing(e.target.checked); if (e.target.checked) setEndedAt(""); }}
              className="rounded border-border"
            />
            Still feeling this
          </label>
        </div>
      )}

      {error && (
        <p className="text-xs text-loss">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => { setOpen(false); resetForm(); }}
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
