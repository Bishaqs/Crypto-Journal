"use client";

import { useMemo } from "react";
import { useTrades } from "@/hooks/use-trades";
import { GroupedTradesTable } from "@/components/dashboard/grouped-trades-table";
import { groupTradesByDay } from "@/lib/trade-grouping";
import { DemoBanner } from "@/components/demo-banner";
import { Header } from "@/components/header";
import { CalendarDays } from "lucide-react";

export default function DayGroupedPage() {
  const { trades, loading, usingDemo } = useTrades();
  const groups = useMemo(() => groupTradesByDay(trades), [trades]);

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
          <CalendarDays size={24} className="text-accent" />
          Trades by Day
        </h2>
        <p className="text-sm text-muted mt-0.5">
          {usingDemo ? "Sample data" : `${groups.length} trading days`}
        </p>
      </div>
      {usingDemo && <DemoBanner feature="day grouping" />}
      <GroupedTradesTable groups={groups} />
    </div>
  );
}
