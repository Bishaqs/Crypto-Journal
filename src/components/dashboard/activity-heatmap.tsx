"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type DayData = {
  date: string;
  count: number;
  details: {
    trades: number;
    journal: number;
    checkin: boolean;
    challenges: number;
    behavioral: number;
  };
};

const INTENSITY_COLORS = [
  "bg-border/20",         // 0 activity
  "bg-accent/20",         // 1 activity
  "bg-accent/40",         // 2-3 activities
  "bg-accent/60",         // 4-5 activities
  "bg-accent/80",         // 6+ activities
];

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function getWeeksInRange(startDate: Date, endDate: Date): Date[][] {
  const weeks: Date[][] = [];
  const current = new Date(startDate);

  // Align to Sunday
  current.setDate(current.getDate() - current.getDay());

  while (current <= endDate) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function ActivityHeatmap() {
  const [data, setData] = useState<Map<string, DayData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const supabase = createClient();

  // Calculate date range: last 365 days
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 364);
    return { startDate: start, endDate: end };
  }, []);

  useEffect(() => {
    async function fetchActivityData() {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);

      const [tradesRes, journalRes, checkinsRes, challengesRes, behavioralRes] =
        await Promise.all([
          supabase
            .from("trades")
            .select("created_at")
            .gte("created_at", `${startStr}T00:00:00`)
            .lte("created_at", `${endStr}T23:59:59`),
          supabase
            .from("journal_notes")
            .select("created_at")
            .gte("created_at", `${startStr}T00:00:00`)
            .lte("created_at", `${endStr}T23:59:59`),
          supabase
            .from("daily_checkins")
            .select("date")
            .eq("user_id", userId)
            .gte("date", startStr)
            .lte("date", endStr),
          supabase
            .from("user_daily_challenges")
            .select("date, completed")
            .gte("date", startStr)
            .lte("date", endStr)
            .eq("completed", true),
          supabase
            .from("behavioral_logs")
            .select("created_at")
            .eq("user_id", userId)
            .gte("created_at", `${startStr}T00:00:00`)
            .lte("created_at", `${endStr}T23:59:59`),
        ]);

      // Build per-day counts
      const dayMap = new Map<string, DayData>();

      function ensureDay(date: string): DayData {
        if (!dayMap.has(date)) {
          dayMap.set(date, {
            date,
            count: 0,
            details: { trades: 0, journal: 0, checkin: false, challenges: 0, behavioral: 0 },
          });
        }
        return dayMap.get(date)!;
      }

      // Count trades per day
      for (const t of tradesRes.data ?? []) {
        const date = t.created_at?.split("T")[0];
        if (date) {
          const day = ensureDay(date);
          day.details.trades++;
          day.count++;
        }
      }

      // Count journal entries per day
      for (const j of journalRes.data ?? []) {
        const date = j.created_at?.split("T")[0];
        if (date) {
          const day = ensureDay(date);
          day.details.journal++;
          day.count++;
        }
      }

      // Count check-ins
      for (const c of checkinsRes.data ?? []) {
        const date = c.date;
        if (date) {
          const day = ensureDay(date);
          if (!day.details.checkin) {
            day.details.checkin = true;
            day.count++;
          }
        }
      }

      // Count completed challenges
      for (const ch of challengesRes.data ?? []) {
        const date = ch.date;
        if (date) {
          const day = ensureDay(date);
          day.details.challenges++;
          day.count++;
        }
      }

      // Count behavioral logs
      for (const b of behavioralRes.data ?? []) {
        const date = b.created_at?.split("T")[0];
        if (date) {
          const day = ensureDay(date);
          day.details.behavioral++;
          day.count++;
        }
      }

      setData(dayMap);
      setLoading(false);
    }

    fetchActivityData();
  }, [supabase, startDate, endDate]);

  const weeks = useMemo(() => getWeeksInRange(startDate, endDate), [startDate, endDate]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week.find(
        (d) => d >= startDate && d <= endDate
      );
      if (firstDay) {
        const month = firstDay.getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: firstDay.toLocaleDateString("en-US", { month: "short" }),
            weekIndex: i,
          });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks, startDate, endDate]);

  // Stats
  const stats = useMemo(() => {
    let totalActiveDays = 0;
    let totalActivities = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = formatDate(new Date());

    // Walk backwards from today for streak calculation
    const d = new Date(endDate);
    while (d >= startDate) {
      const dateStr = formatDate(d);
      const dayData = data.get(dateStr);
      if (dayData && dayData.count > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        if (dateStr === today || tempStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        if (currentStreak === 0) currentStreak = 0;
        tempStreak = 0;
      }
      d.setDate(d.getDate() - 1);
    }

    data.forEach((day) => {
      if (day.count > 0) {
        totalActiveDays++;
        totalActivities += day.count;
      }
    });

    return { totalActiveDays, totalActivities, longestStreak };
  }, [data, startDate, endDate]);

  if (loading) {
    return (
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="h-32 flex items-center justify-center text-muted text-sm">
          Loading activity...
        </div>
      </div>
    );
  }

  const today = formatDate(new Date());

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5 relative"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {stats.totalActivities} activities in the last year
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          <span>{stats.totalActiveDays} active days</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {monthLabels.map((m, i) => (
          <div
            key={i}
            className="text-[10px] text-muted"
            style={{
              position: "relative",
              left: `${m.weekIndex * 14}px`,
              marginRight: i < monthLabels.length - 1
                ? `${((monthLabels[i + 1]?.weekIndex ?? 0) - m.weekIndex) * 14 - 30}px`
                : 0,
            }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex gap-0.5 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 shrink-0">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
            <div key={i} className="h-[12px] text-[9px] text-muted leading-[12px]">
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => {
              const dateStr = formatDate(day);
              const isInRange = day >= startDate && day <= endDate;
              const dayData = data.get(dateStr);
              const count = dayData?.count ?? 0;
              const intensity = getIntensity(count);
              const isToday = dateStr === today;

              if (!isInRange) {
                return <div key={di} className="w-[12px] h-[12px]" />;
              }

              return (
                <div
                  key={di}
                  className={`w-[12px] h-[12px] rounded-sm transition-all duration-150 cursor-default ${INTENSITY_COLORS[intensity]} ${
                    isToday ? "ring-1 ring-accent" : ""
                  } hover:ring-1 hover:ring-foreground/30`}
                  onMouseEnter={(e) => {
                    if (dayData) {
                      setHoveredDay(dayData);
                    } else {
                      setHoveredDay({ date: dateStr, count: 0, details: { trades: 0, journal: 0, checkin: false, challenges: 0, behavioral: 0 } });
                    }
                    const rect = e.currentTarget.getBoundingClientRect();
                    const parent = e.currentTarget.closest(".glass")?.getBoundingClientRect();
                    if (parent) {
                      setTooltipPos({
                        x: rect.left - parent.left + 6,
                        y: rect.top - parent.top - 60,
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-muted">Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div key={i} className={`w-[12px] h-[12px] rounded-sm ${color}`} />
        ))}
        <span className="text-[10px] text-muted">More</span>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="absolute z-50 glass rounded-lg border border-border/60 px-3 py-2 text-xs pointer-events-none shadow-lg"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <p className="font-bold text-foreground mb-1">
            {new Date(hoveredDay.date + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {hoveredDay.count === 0 ? (
            <p className="text-muted">No activity</p>
          ) : (
            <div className="space-y-0.5 text-muted">
              {hoveredDay.details.trades > 0 && (
                <p>{hoveredDay.details.trades} trade{hoveredDay.details.trades > 1 ? "s" : ""}</p>
              )}
              {hoveredDay.details.journal > 0 && (
                <p>{hoveredDay.details.journal} journal entr{hoveredDay.details.journal > 1 ? "ies" : "y"}</p>
              )}
              {hoveredDay.details.checkin && <p>Daily check-in</p>}
              {hoveredDay.details.challenges > 0 && (
                <p>{hoveredDay.details.challenges} challenge{hoveredDay.details.challenges > 1 ? "s" : ""}</p>
              )}
              {hoveredDay.details.behavioral > 0 && (
                <p>{hoveredDay.details.behavioral} behavioral log{hoveredDay.details.behavioral > 1 ? "s" : ""}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
