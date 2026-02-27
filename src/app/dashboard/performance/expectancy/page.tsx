"use client";

import { LineChart } from "lucide-react";

export default function TradeExpectancyPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <LineChart size={24} className="text-accent" />
          Trade Expectancy
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Expected value per trade — (Win Rate x Avg Win) - ((1 - Win Rate) x Avg Loss)
        </p>
      </div>

      <div
        className="glass rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-4 rounded-2xl bg-accent/8 mb-6">
          <LineChart size={48} className="text-accent/60" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted max-w-md mb-4">
          Track your edge over rolling time periods. Positive expectancy means your system is profitable long-term. Negative means it needs adjustment.
        </p>
        <div className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold">
          Line Chart · Rolling Periods
        </div>
      </div>
    </div>
  );
}
