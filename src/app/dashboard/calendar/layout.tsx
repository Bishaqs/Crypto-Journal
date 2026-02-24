"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, CalendarRange, Grid3X3 } from "lucide-react";

const CALENDAR_TABS = [
  { href: "/dashboard/calendar", label: "Month", icon: CalendarDays },
  { href: "/dashboard/calendar/day", label: "Day", icon: Clock },
  { href: "/dashboard/calendar/week", label: "Week", icon: CalendarRange },
  { href: "/dashboard/calendar/year", label: "Year", icon: Grid3X3 },
] as const;

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard/calendar" ? pathname === "/dashboard/calendar" : pathname.startsWith(href);

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <div
        className="flex gap-1 rounded-xl border border-border/50 p-1 overflow-x-auto glass"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {CALENDAR_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              isActive(tab.href)
                ? "bg-accent/10 text-accent shadow-sm"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
