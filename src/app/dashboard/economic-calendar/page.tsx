"use client";

import { CalendarDays } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { EconomicCalendar } from "@/components/dashboard/economic-calendar";

export default function EconomicCalendarPage() {
  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <CalendarDays size={24} className="text-accent" />
          Economic Calendar
          <InfoTooltip text="Live economic events from Forex Factory — track high-impact releases across all major currencies" articleId="mt-economic-calendar" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Macro events, rate decisions & economic releases
        </p>
      </div>

      <EconomicCalendar maxVisible={50} />
    </div>
  );
}
