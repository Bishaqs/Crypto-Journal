"use client";

import { TrendingUp } from "lucide-react";

export default function TrendAnalysisPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <TrendingUp size={24} className="text-accent" />
          Trend Analysis
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Performance breakdown by market condition — bull, bear, and sideways markets
        </p>
      </div>

      <div
        className="glass rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-4 rounded-2xl bg-accent/8 mb-6">
          <TrendingUp size={48} className="text-accent/60" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted max-w-md mb-4">
          Your strategy may thrive in bull trends but fail in ranging markets. Segment your win rate and profit factor by market condition to know when to trade and when to sit out.
        </p>
        <div className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold">
          Grouped Bar Chart
        </div>
      </div>
    </div>
  );
}
