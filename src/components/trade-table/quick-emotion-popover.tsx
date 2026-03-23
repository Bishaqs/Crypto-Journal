"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";
import { EMOTIONS } from "@/lib/validators";
import { Check, X } from "lucide-react";

interface QuickEmotionPopoverProps {
  tradeId: string;
  tradeTable: "trades" | "stock_trades" | "commodity_trades" | "forex_trades";
  symbol: string;
  onClose: () => void;
  onSaved?: () => void;
}

async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  try {
    // Strip to base pair for Binance (e.g., BTCUSDT)
    const pair = symbol.endsWith("USDT") ? symbol : `${symbol.replace(/[^A-Z0-9]/gi, "")}USDT`;
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
    if (!res.ok) return null;
    const data = await res.json();
    return parseFloat(data.price) || null;
  } catch {
    return null;
  }
}

export function QuickEmotionPopover({
  tradeId,
  tradeTable,
  symbol,
  onClose,
  onSaved,
}: QuickEmotionPopoverProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  async function handleSelect(emotion: string) {
    setSelectedEmotion(emotion);
    setShowNote(true);
  }

  async function handleSave() {
    if (!selectedEmotion) return;
    setSaving(true);
    try {
      const [price] = await Promise.all([fetchCurrentPrice(symbol)]);
      const supabase = createClient();
      const { error } = await supabase.from("trade_emotion_logs").insert({
        trade_id: tradeId,
        trade_table: tradeTable,
        emotion: selectedEmotion,
        phase: "follow_up",
        note: note.trim() || null,
        price_at_log: price,
      });
      if (error) throw error;
      setSaved(true);
      onSaved?.();
      setTimeout(onClose, 600);
    } catch {
      setSaving(false);
    }
  }

  // Quick save without note
  async function handleQuickSave(emotion: string) {
    setSaving(true);
    setSelectedEmotion(emotion);
    try {
      const price = await fetchCurrentPrice(symbol);
      const supabase = createClient();
      const { error } = await supabase.from("trade_emotion_logs").insert({
        trade_id: tradeId,
        trade_table: tradeTable,
        emotion,
        phase: "follow_up",
        note: null,
        price_at_log: price,
      });
      if (error) throw error;
      setSaved(true);
      onSaved?.();
      setTimeout(onClose, 600);
    } catch {
      setSaving(false);
    }
  }

  if (saved) {
    const config = selectedEmotion ? EMOTION_CONFIG[selectedEmotion] : null;
    return (
      <div
        ref={popoverRef}
        className="absolute left-0 top-full mt-1 z-50 glass rounded-xl border border-border/50 p-4 shadow-xl min-w-[200px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-center gap-2 text-sm text-win">
          <Check size={16} />
          <span>{config?.emoji} {selectedEmotion} logged</span>
        </div>
      </div>
    );
  }

  if (showNote && selectedEmotion) {
    const config = EMOTION_CONFIG[selectedEmotion];
    return (
      <div
        ref={popoverRef}
        className="absolute left-0 top-full mt-1 z-50 glass rounded-xl border border-border/50 p-3 shadow-xl min-w-[260px]"
        style={{ boxShadow: "var(--shadow-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{config?.emoji}</span>
            <span className="text-sm font-medium text-foreground">{selectedEmotion}</span>
          </div>
          <button onClick={() => { setShowNote(false); setSelectedEmotion(null); }} className="text-muted hover:text-foreground">
            <X size={14} />
          </button>
        </div>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why? (optional)"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          className="w-full py-1.5 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 mb-2"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickSave(selectedEmotion)}
            disabled={saving}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-border/30 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-accent text-background hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? "..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-full mt-1 z-50 glass rounded-xl border border-border/50 p-3 shadow-xl"
      style={{ boxShadow: "var(--shadow-card)", minWidth: 280 }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
        How are you feeling?
      </p>
      <div className="grid grid-cols-5 gap-1">
        {EMOTIONS.map((emotion) => {
          const config = EMOTION_CONFIG[emotion];
          if (!config) return null;
          return (
            <button
              key={emotion}
              onClick={() => handleSelect(emotion)}
              disabled={saving}
              title={emotion}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border border-transparent hover:border-border/50 hover:bg-surface-hover/50 transition-colors ${saving ? "opacity-50" : ""}`}
            >
              <span className="text-lg">{config.emoji}</span>
              <span className="text-[8px] text-muted leading-tight truncate w-full text-center">{emotion}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
