"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EmotionPicker, ProcessScoreInput } from "@/components/psychology-inputs";
import { X, TrendingUp, TrendingDown } from "lucide-react";

interface PostTradePromptProps {
  tradeId: string;
  symbol: string;
  pnl: number;
  onClose: () => void;
}

export function PostTradePrompt({ tradeId, symbol, pnl, onClose }: PostTradePromptProps) {
  const [emotion, setEmotion] = useState<string | null>(null);
  const [processScore, setProcessScore] = useState<number | null>(null);
  const [improve, setImprove] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleSave() {
    if (!emotion && processScore === null && !improve.trim()) {
      onClose();
      return;
    }
    setSaving(true);

    const update: Record<string, unknown> = {};
    if (emotion) update.emotion = emotion;
    if (processScore !== null) update.process_score = processScore;
    if (improve.trim()) {
      update.review = { improve: improve.trim() };
    }

    await supabase.from("trades").update(update).eq("id", tradeId);
    setSaving(false);
    onClose();
  }

  const PnlIcon = pnl >= 0 ? TrendingUp : TrendingDown;
  const pnlColor = pnl >= 0 ? "text-win" : "text-loss";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-border/50 rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-border/30">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest font-semibold">Quick Reflection</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-foreground">{symbol}</span>
              <div className={`flex items-center gap-1 ${pnlColor}`}>
                <PnlIcon size={12} />
                <span className="text-xs font-semibold">
                  {pnl >= 0 ? "+" : ""}{pnl.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="p-4 space-y-4">
          {/* Emotion */}
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2 block">How did this trade feel?</label>
            <EmotionPicker value={emotion} onChange={setEmotion} />
          </div>

          {/* Process Score */}
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2 block">Process Score</label>
            <ProcessScoreInput value={processScore} onChange={setProcessScore} />
          </div>

          {/* Quick reflection */}
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2 block">What would you do differently?</label>
            <textarea
              value={improve}
              onChange={(e) => setImprove(e.target.value)}
              placeholder="One sentence..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-muted text-xs font-medium hover:text-foreground hover:border-accent/30 transition-all"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-accent text-background text-xs font-semibold hover:bg-accent-hover transition-all disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
