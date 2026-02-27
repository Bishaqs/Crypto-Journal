"use client";

import { BarChart } from "lucide-react";

export default function ReturnsDistributionPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart size={24} className="text-accent" />
          Returns Distribution
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Distribution of all your trade P&L values — visualize your return profile
        </p>
      </div>

      <div
        className="glass rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-4 rounded-2xl bg-accent/8 mb-6">
          <BarChart size={48} className="text-accent/60" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted max-w-md mb-4">
          See the shape of your returns. A normal bell curve means predictable performance. Fat tails reveal occasional outsized wins or catastrophic losses that dominate your account.
        </p>
        <div className="text-[10px] text-muted/40 uppercase tracking-widest font-semibold">
          Histogram · Bell Curve
        </div>
      </div>
    </div>
  );
}
