"use client";

import { Scale } from "lucide-react";

export default function ProfitFactorPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Scale size={24} className="text-accent" />
          Profit Factor
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Gross Profit / Gross Loss ratio. Above 1.0 means winners outweigh losers.
        </p>
      </div>

      <div
        className="glass rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-4 rounded-2xl bg-accent/8 mb-6">
          <Scale size={48} className="text-accent/60" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted max-w-md mb-4">
          A profit factor of 2.0 means you make $2 for every $1 you lose. Track this over time to see if your edge is growing or shrinking. 1.5+ is acceptable, 2.0+ is strong.
        </p>
        <div className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold">
          Gauge · Metric Display
        </div>
      </div>
    </div>
  );
}
