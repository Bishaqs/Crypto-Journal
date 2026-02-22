"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type DateRange =
  | "today"
  | "yesterday"
  | "7d"
  | "this-month"
  | "last-month"
  | "6m"
  | "this-year"
  | "last-year"
  | "all";

export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7D" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "6m", label: "6M" },
  { value: "this-year", label: "YTD" },
  { value: "last-year", label: "Last Year" },
  { value: "all", label: "All" },
];

export function getDateRangeFilter(range: DateRange): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(today);
  to.setDate(to.getDate() + 1);

  switch (range) {
    case "today":
      return { from: today, to };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: today };
    }
    case "7d": {
      const week = new Date(today);
      week.setDate(week.getDate() - 7);
      return { from: week, to };
    }
    case "this-month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start, to: end };
    }
    case "6m": {
      const sixM = new Date(today);
      sixM.setMonth(sixM.getMonth() - 6);
      return { from: sixM, to };
    }
    case "this-year":
      return { from: new Date(now.getFullYear(), 0, 1), to };
    case "last-year":
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear(), 0, 1),
      };
    case "all":
    default:
      return { from: new Date(2020, 0, 1), to };
  }
}

type DateRangeContextType = {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  filterTrades: <T extends { open_timestamp: string }>(items: T[]) => T[];
};

const DateRangeContext = createContext<DateRangeContextType>({
  dateRange: "all",
  setDateRange: () => {},
  filterTrades: (items) => items,
});

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>("all");

  const filterTrades = useCallback(
    <T extends { open_timestamp: string }>(items: T[]): T[] => {
      if (dateRange === "all") return items;
      const { from, to } = getDateRangeFilter(dateRange);
      return items.filter((t) => {
        const d = new Date(t.open_timestamp);
        return d >= from && d < to;
      });
    },
    [dateRange]
  );

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, filterTrades }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  return useContext(DateRangeContext);
}
