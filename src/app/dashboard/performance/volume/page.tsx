"use client";

import { BarChart2 } from "lucide-react";

export default function RelativeVolumePage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart2 size={24} className="text-accent" />
          Relative Volume
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Current volume vs average volume — identifies unusual activity on your traded assets
        </p>
      </div>

      <div
        className="glass rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-4 rounded-2xl bg-accent/8 mb-6">
          <BarChart2 size={48} className="text-accent/60" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted max-w-md mb-4">
          RVOL above 2.0 signals high conviction moves. Filter your trades by volume conditions to see which setups work best during high or low liquidity.
        </p>
        <div className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold">
          Histogram
        </div>
      </div>
    </div>
  );
}
