"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Table2,
  Layers,
  Tags,
  CalendarDays,
  List,
  ScatterChart,
  BarChart3,
  ClipboardList,
  Target,
} from "lucide-react";

const TRADE_TABS = [
  { href: "/dashboard/trades", label: "Trade Log", icon: Table2 },
  { href: "/dashboard/trades/symbol-grouped", label: "By Symbol", icon: Layers },
  { href: "/dashboard/trades/tag-grouped", label: "By Tag", icon: Tags },
  { href: "/dashboard/trades/day-grouped", label: "By Day", icon: CalendarDays },
  { href: "/dashboard/trades/executions", label: "Executions", icon: List },
  { href: "/dashboard/trades/chart", label: "Chart", icon: ScatterChart },
  { href: "/dashboard/trades/pivot", label: "Pivot", icon: BarChart3 },
  { href: "/dashboard/trades/plan-analytics", label: "Plans", icon: ClipboardList },
  { href: "/dashboard/trades/goals", label: "Goals", icon: Target },
] as const;

const SUB_PAGE_SLUGS = new Set([
  "symbol-grouped",
  "tag-grouped",
  "day-grouped",
  "executions",
  "chart",
  "pivot",
  "plan-analytics",
  "goals",
]);

export default function TradesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Detect trade detail page: /dashboard/trades/[id] where [id] is NOT a known sub-page
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments.length > 2 ? segments[2] : null;
  const isTradeDetail = lastSegment !== null && !SUB_PAGE_SLUGS.has(lastSegment);

  if (isTradeDetail) {
    return <>{children}</>;
  }

  const isActive = (href: string) =>
    href === "/dashboard/trades" ? pathname === "/dashboard/trades" : pathname.startsWith(href);

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <div
        className="flex gap-1 rounded-xl border border-border/50 p-1 overflow-x-auto glass"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {TRADE_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              isActive(tab.href)
                ? "bg-accent/10 text-accent shadow-sm"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
