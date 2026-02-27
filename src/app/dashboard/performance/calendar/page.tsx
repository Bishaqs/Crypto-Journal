"use client";

import { CalendarCheck } from "lucide-react";

export default function CalendarGroupedPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <CalendarCheck size={24} className="text-accent" />
          Calendar Grouped
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Daily P&L displayed as a calendar heatmap — green for profit days, red for loss days
        </p>
      </div>

      <div
        className="glass rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-4 rounded-2xl bg-accent/8 mb-6">
          <CalendarCheck size={48} className="text-accent/60" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted max-w-md mb-4">
          A calendar heatmap showing your daily P&L at a glance. Spot winning streaks, losing streaks, and days you skipped trading.
        </p>
        <div className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold">
          Calendar Heatmap
        </div>
      </div>
    </div>
  );
}
