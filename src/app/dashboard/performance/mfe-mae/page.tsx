"use client";

import { ArrowUpDown } from "lucide-react";

export default function MfeMaePage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <ArrowUpDown size={24} className="text-accent" />
          MFE / MAE
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Maximum Favorable & Adverse Excursion — how far trades move for and against you before closing
        </p>
      </div>

      <div
        className="glass rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-4 rounded-2xl bg-accent/8 mb-6">
          <ArrowUpDown size={48} className="text-accent/60" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted max-w-md mb-4">
          MFE shows the best profit you could have earned. MAE shows the worst drawdown before exit. Use this to fine-tune your stop-loss and take-profit levels.
        </p>
        <div className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold">
          Scatter Plot
        </div>
      </div>
    </div>
  );
}
