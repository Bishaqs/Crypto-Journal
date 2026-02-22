"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DailyPnl } from "@/lib/types";

export function CalendarHeatmap({ dailyPnl }: { dailyPnl: DailyPnl[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  const pnlMap = new Map(dailyPnl.map((d) => [d.date, d]));

  const maxPnl = Math.max(...dailyPnl.map((d) => Math.abs(d.pnl)), 1);

  function getDayClasses(date: string): string {
    const data = pnlMap.get(date);
    if (!data) return "bg-background/50 text-muted/30 border-border/30";
    if (data.pnl > 0) {
      const intensity = Math.min(Math.abs(data.pnl) / maxPnl, 1);
      const glow = intensity > 0.4 ? "shadow-[0_0_8px_rgba(167,139,250,0.25)]" : "";
      return `bg-win/20 text-win border-win/30 ${glow}`;
    }
    if (data.pnl < 0) {
      const intensity = Math.min(Math.abs(data.pnl) / maxPnl, 1);
      const glow = intensity > 0.4 ? "shadow-[0_0_8px_rgba(239,68,68,0.25)]" : "";
      return `bg-loss/20 text-loss border-loss/30 ${glow}`;
    }
    return "bg-surface text-muted border-border/50";
  }

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const days = [];
  for (let i = 0; i < startPadding; i++) {
    days.push(<div key={`pad-${i}`} />);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const data = pnlMap.get(dateStr);
    const isToday = dateStr === new Date().toISOString().split("T")[0];

    days.push(
      <div
        key={dateStr}
        className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs border transition-all duration-200 cursor-default ${getDayClasses(dateStr)} ${
          isToday ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""
        } hover:scale-105`}
        title={
          data
            ? `${dateStr}: ${data.pnl >= 0 ? "+" : ""}$${data.pnl.toFixed(2)} (${data.tradeCount} trade${data.tradeCount > 1 ? "s" : ""})`
            : dateStr
        }
      >
        <span className="font-semibold text-[11px]">{d}</span>
        {data && (
          <span className="text-[8px] font-bold mt-0.5">
            {data.pnl >= 0 ? "+" : ""}{data.pnl.toFixed(0)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-border/50 p-4 self-start" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{monthName}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[9px] text-muted/50 font-semibold py-0.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{days}</div>
    </div>
  );
}
