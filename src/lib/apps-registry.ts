import {
  Dices,
  Layers,
  GitBranch,
  CalendarDays,
  Activity,
  FileSearch,
  FlaskConical,
  ArrowLeftRight,
  History,
  LineChart,
  Search,
  Target,
  Share2,
  BookOpen,
  ArrowUpDown,
  BarChart3,
  HelpCircle,
  CandlestickChart,
  Grid2X2,
  type LucideIcon,
} from "lucide-react";

export type AppCategory = "apps" | "links";

export interface AppEntry {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  category: AppCategory;
  isExternal?: boolean;
  exists: boolean;
}

export const APPS_REGISTRY: AppEntry[] = [
  // === Apps ===
  { id: "paper-trading", label: "Paper Trading", href: "/simulator", icon: CandlestickChart, category: "apps", exists: true },
  { id: "multi-chart-trading", label: "Multi-Chart Trading", href: "/simulator/multi", icon: Grid2X2, category: "apps", exists: true },
  { id: "multi-simulator", label: "Multi Simulator", href: "/dashboard/apps/multi-simulator", icon: Layers, category: "apps", exists: true },
  { id: "options-simulator", label: "Options Simulator", href: "/dashboard/apps/options-simulator", icon: GitBranch, category: "apps", exists: true },
  { id: "seasonality-charts", label: "Seasonality Charts", href: "/dashboard/apps/seasonality", icon: CalendarDays, category: "apps", exists: true },
  { id: "options-flow", label: "Options Flow", href: "/dashboard/apps/options-flow", icon: Activity, category: "apps", exists: true },
  { id: "fundamental-data", label: "Fundamental Data", href: "/dashboard/apps/sec-13f", icon: FileSearch, category: "apps", exists: true },
  { id: "strategy-backtester", label: "Strategy Backtester", href: "/dashboard/apps/backtester", icon: FlaskConical, category: "apps", exists: true },
  { id: "compare-trades", label: "Compare Trades", href: "/dashboard/apps/compare-trades", icon: ArrowLeftRight, category: "apps", exists: true },
  { id: "options-backtest", label: "Options Backtest", href: "/dashboard/apps/options-backtest", icon: History, category: "apps", exists: true },
  { id: "options-payoff", label: "Options Payoff", href: "/dashboard/apps/options-payoff", icon: LineChart, category: "apps", exists: true },
  { id: "daily-screener", label: "Daily Screener", href: "/dashboard/screener", icon: Search, category: "apps", exists: true },
  { id: "target-simulator", label: "Target Simulator", href: "/dashboard/apps/target-simulator", icon: Target, category: "apps", exists: true },

  // === Links ===
  { id: "shared-trades", label: "Shared Trades", href: "/dashboard/apps/shared-trades", icon: Share2, category: "links", exists: true },
  { id: "blog-guides", label: "Blog & Guides", href: "https://blog.stargate-journal.com", icon: BookOpen, category: "links", isExternal: true, exists: true },
  { id: "import-export", label: "Import & Export", href: "/dashboard/settings", icon: ArrowUpDown, category: "links", exists: true },
  { id: "stock-screener", label: "Stock Screener", href: "/dashboard/apps/stock-screener", icon: BarChart3, category: "links", exists: true },
  { id: "help-center", label: "Help Center", href: "/dashboard/help", icon: HelpCircle, category: "links", exists: true },
];
