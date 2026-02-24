"use client";

import { useMemo } from "react";
import { useTrades } from "@/hooks/use-trades";
import { GroupedTradesTable } from "@/components/dashboard/grouped-trades-table";
import { groupTradesByTag } from "@/lib/trade-grouping";
import { DemoBanner } from "@/components/demo-banner";
import { Header } from "@/components/header";
import { Tags } from "lucide-react";

export default function TagGroupedPage() {
  const { trades, loading, usingDemo } = useTrades();
  const groups = useMemo(() => groupTradesByTag(trades), [trades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Tags size={24} className="text-accent" />
          Trades by Tag
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo
            ? "Sample data"
            : `${groups.length} tags — trades with multiple tags appear in each group`}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="tag grouping" />}
      <GroupedTradesTable groups={groups} />
    </div>
  );
}
