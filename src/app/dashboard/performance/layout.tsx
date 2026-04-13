"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { href: "/dashboard/performance/metrics", label: "Metrics" },
  { href: "/dashboard/performance/expectancy", label: "Expectancy" },
  { href: "/dashboard/performance/r-value", label: "R-Value" },
  { href: "/dashboard/performance/hit-ratio", label: "Hit Ratio" },
  { href: "/dashboard/performance/profit-factor", label: "Profit Factor" },
  { href: "/dashboard/performance/mfe-mae", label: "MFE / MAE" },
  { href: "/dashboard/performance/volume", label: "Rel. Volume" },
  { href: "/dashboard/performance/returns", label: "Returns" },
  { href: "/dashboard/performance/trends", label: "Trends" },
  { href: "/dashboard/performance/calendar", label: "Calendar" },
];

export default function PerformanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              pathname === tab.href
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
