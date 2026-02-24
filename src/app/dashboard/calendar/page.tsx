"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade, DailyPnl } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { calculateDailyPnl, calculateTradePnl } from "@/lib/calculations";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DemoBanner } from "@/components/demo-banner";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";

export default function CalendarPage() {
  usePageTour("calendar-page");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    if (dbTrades.length === 0) {
      setTrades(DEMO_TRADES);
      setUsingDemo(true);
    } else {
      setTrades(dbTrades);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const dailyPnl = useMemo(() => calculateDailyPnl(trades), [trades]);
  const pnlMap = useMemo(() => new Map(dailyPnl.map((d) => [d.date, d])), [dailyPnl]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  const maxPnl = Math.max(...dailyPnl.map((d) => Math.abs(d.pnl)), 1);

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Trades for selected day
  const selectedDayTrades = useMemo(() => {
    if (!selectedDate) return [];
    return trades.filter((t) => {
      const closeDate = t.close_timestamp?.split("T")[0];
      const openDate = t.open_timestamp?.split("T")[0];
      return closeDate === selectedDate || openDate === selectedDate;
    });
  }, [selectedDate, trades]);

  const selectedDayPnl = selectedDate ? pnlMap.get(selectedDate) : null;

  function getIntensity(pnl: number): number {
    return Math.min(Math.abs(pnl) / maxPnl, 1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  const days = [];
  for (let i = 0; i < startPadding; i++) {
    days.push(
      <div key={`pad-${i}`} className="aspect-square" />
    );
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const data = pnlMap.get(dateStr);
    const isToday = dateStr === new Date().toISOString().split("T")[0];
    const isSelected = dateStr === selectedDate;
    const intensity = data ? getIntensity(data.pnl) : 0;

    let bg = "bg-background/50";
    let border = "border-border/30";
    let textColor = "text-muted/40";
    let glow = "";

    if (data) {
      if (data.pnl > 0) {
        bg = intensity > 0.6 ? "bg-win/30" : intensity > 0.3 ? "bg-win/20" : "bg-win/10";
        border = "border-win/30";
        textColor = "text-win";
        glow = intensity > 0.5 ? "shadow-[0_0_12px_rgba(167,139,250,0.2)]" : "";
      } else if (data.pnl < 0) {
        bg = intensity > 0.6 ? "bg-loss/30" : intensity > 0.3 ? "bg-loss/20" : "bg-loss/10";
        border = "border-loss/30";
        textColor = "text-loss";
        glow = intensity > 0.5 ? "shadow-[0_0_12px_rgba(239,68,68,0.2)]" : "";
      } else {
        bg = "bg-surface";
        textColor = "text-muted";
        border = "border-border/50";
      }
    }

    days.push(
      <button
        key={dateStr}
        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
        className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs border transition-all duration-200 cursor-pointer
          ${bg} ${border} ${glow}
          ${isToday ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""}
          ${isSelected ? "ring-2 ring-foreground/50 scale-105" : "hover:scale-105 hover:border-accent/30"}
        `}
      >
        <span className={`font-semibold text-sm ${data ? textColor : "text-muted/40"}`}>{d}</span>
        {data && (
          <span className={`text-[9px] font-bold mt-0.5 ${textColor}`}>
            {data.pnl >= 0 ? "+" : ""}{data.pnl.toFixed(0)}
          </span>
        )}
        {data && (
          <span className="text-[8px] text-muted mt-0.5">
            {data.tradeCount}t
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 id="tour-calendar-header" className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Calendar <InfoTooltip text="Green days = profit, red days = loss — spot patterns at a glance" />
            <PageInfoButton tourName="calendar-page" />
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Click a day to see trade details
          </p>
        </div>
      </div>
      {usingDemo && <DemoBanner feature="calendar" />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div
          id="tour-calendar-grid"
          className="lg:col-span-2 glass rounded-2xl border border-border/50 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">{monthName}</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] text-muted/60 font-semibold py-1 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">{days}</div>

          {/* Month summary */}
          {(() => {
            const monthDays = dailyPnl.filter((d) => {
              const [y, m] = d.date.split("-").map(Number);
              return y === year && m === month + 1;
            });
            const monthPnl = monthDays.reduce((s, d) => s + d.pnl, 0);
            const greenDays = monthDays.filter((d) => d.pnl > 0).length;
            const redDays = monthDays.filter((d) => d.pnl < 0).length;

            return monthDays.length > 0 ? (
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-6 text-xs">
                <span className="text-muted">
                  Month:{" "}
                  <span className={`font-bold ${monthPnl >= 0 ? "text-win" : "text-loss"}`}>
                    {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
                  </span>
                </span>
                <span className="text-muted">
                  <span className="text-win font-semibold">{greenDays}</span> green /{" "}
                  <span className="text-loss font-semibold">{redDays}</span> red
                </span>
                <span className="text-muted">
                  {monthDays.reduce((s, d) => s + d.tradeCount, 0)} trades
                </span>
              </div>
            ) : null;
          })()}
        </div>

        {/* Day detail panel */}
        <div
          className="glass rounded-2xl border border-border/50 p-5 self-start"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </h3>
                  {selectedDayPnl && (
                    <p
                      className={`text-2xl font-bold mt-1 ${
                        selectedDayPnl.pnl >= 0 ? "text-win" : "text-loss"
                      }`}
                    >
                      {selectedDayPnl.pnl >= 0 ? "+" : ""}$
                      {selectedDayPnl.pnl.toFixed(2)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {selectedDayTrades.length === 0 ? (
                <p className="text-sm text-muted">No trades on this day</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayTrades.map((t) => {
                    const pnl = t.pnl ?? calculateTradePnl(t);
                    const isOpen = t.close_timestamp === null;
                    return (
                      <div
                        key={t.id}
                        className="rounded-xl border border-border/50 p-3 hover:border-accent/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {t.symbol}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                t.position === "long"
                                  ? "bg-win/10 text-win"
                                  : "bg-loss/10 text-loss"
                              }`}
                            >
                              {t.position.toUpperCase()}
                            </span>
                          </div>
                          {isOpen ? (
                            <span className="text-[10px] text-accent font-medium">
                              OPEN
                            </span>
                          ) : pnl !== null ? (
                            <span
                              className={`text-sm font-bold ${
                                pnl >= 0 ? "text-win" : "text-loss"
                              }`}
                            >
                              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-muted">
                          <span>Entry: ${t.entry_price}</span>
                          {t.exit_price && <span>Exit: ${t.exit_price}</span>}
                          <span>Qty: {t.quantity}</span>
                        </div>

                        {(t.emotion || t.process_score !== null) && (
                          <div className="flex items-center gap-2 mt-2">
                            {t.emotion && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                                {t.emotion}
                              </span>
                            )}
                            {t.process_score !== null && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover text-muted font-medium">
                                Process: {t.process_score}/10
                              </span>
                            )}
                          </div>
                        )}

                        {t.notes && (
                          <p className="text-[11px] text-muted mt-2 leading-relaxed line-clamp-2">
                            {t.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <CalendarDays size={32} className="text-accent/30 mb-3" />
              <p className="text-sm font-medium text-muted">
                Select a day
              </p>
              <p className="text-[11px] text-muted/60 mt-1">
                Click a date to see trades and notes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
