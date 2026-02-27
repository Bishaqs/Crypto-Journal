"use client";

import { Ruler } from "lucide-react";

export default function RValuePage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Ruler size={24} className="text-accent" />
          R-Value
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Risk-reward ratio per trade — (Exit - Entry) / Risk. Measures how many R you capture.
        </p>
      </div>

      <div
        className="glass rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-4 rounded-2xl bg-accent/8 mb-6">
          <Ruler size={48} className="text-accent/60" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted max-w-md mb-4">
          Standardize every trade by initial risk. A 2R trade means you made 2x your risk. Compare R-multiples across trades to find your real edge.
        </p>
        <div className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold">
          Bar Chart · Histogram
        </div>
      </div>
    </div>
  );
}
