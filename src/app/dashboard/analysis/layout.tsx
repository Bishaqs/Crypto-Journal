"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { href: "/dashboard/analysis/running-pnl", label: "Running PnL" },
  { href: "/dashboard/analysis/trade-count", label: "Trade Count" },
  { href: "/dashboard/analysis/volume", label: "Volume" },
  { href: "/dashboard/analysis/fees", label: "Fees" },
  { href: "/dashboard/analysis/tag-groups", label: "Tag Groups" },
  { href: "/dashboard/analysis/sectors", label: "Sectors" },
  { href: "/dashboard/analysis/treemap/symbol", label: "Treemap" },
  { href: "/dashboard/analysis/technical-analysis", label: "Technical" },
];

export default function AnalysisLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              pathname.startsWith(tab.href)
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
