import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Settings,
  Table2,
  CalendarDays,
  BarChart3,
  Sparkles,
  FileBarChart,
  BookMarked,
  Calculator,
  Target,
  ClipboardList,
  Dices,
  Receipt,
  Flame,
  Grid3X3,
  TrendingDown,
  Crosshair,
  ShieldAlert,
  TrendingUp,
  Globe,
  Coins,
  Search,
  Shield,
  PieChart,
  Activity,
  Tag,
  Layers,
  Hash,
  BarChart,
  DollarSign,
  TreePine,
  LineChart,
  Ruler,
  Gauge,
  Scale,
  ArrowUpDown,
  BarChart2,
  CalendarCheck,
  Clock,
  Trophy,
  HelpCircle,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────── */
/*  Types                                                             */
/* ────────────────────────────────────────────────────────────────── */

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  tourId?: string;
}

export interface SubSection {
  key: string;
  label: string;
  items: NavItem[];
}

export interface NavSection {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  items: NavItem[];
  subSections?: SubSection[];
  visibleInSimple: boolean;
  simpleItems?: NavItem[];
}

export interface RailCategory {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  directNav?: boolean;
  items: NavItem[];
  sections?: NavSection[];
}

/* ────────────────────────────────────────────────────────────────── */
/*  Nav item arrays                                                   */
/* ────────────────────────────────────────────────────────────────── */

export const coreItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tourId: "tour-home" },
  { href: "/dashboard/trades", label: "Trade Log", icon: Table2, tourId: "tour-trades" },
  { href: "/dashboard/journal", label: "Journal", icon: BookOpen, tourId: "tour-journal" },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays, tourId: "tour-calendar" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, tourId: "tour-analytics" },
  { href: "/dashboard/plans", label: "Trade Plans", icon: ClipboardList, tourId: "tour-plans" },
  { href: "/dashboard/achievements", label: "Achievements", icon: Trophy, tourId: "tour-achievements" },
];

const analysisTopItems: NavItem[] = [
  { href: "/dashboard/analysis/running-pnl", label: "Running PnL Analysis", icon: Activity },
  { href: "/dashboard/analysis/trade-count", label: "Trade Count", icon: Hash },
  { href: "/dashboard/analysis/volume", label: "Volume", icon: BarChart },
  { href: "/dashboard/analysis/fees", label: "Commissions/Fees", icon: DollarSign },
];

const performanceItems: NavItem[] = [
  { href: "/dashboard/performance/expectancy", label: "Trade Expectancy", icon: LineChart },
  { href: "/dashboard/performance/r-value", label: "R-Value", icon: Ruler },
  { href: "/dashboard/performance/hit-ratio", label: "Hit Ratio", icon: Gauge },
  { href: "/dashboard/performance/profit-factor", label: "Profit Factor", icon: Scale },
  { href: "/dashboard/performance/mfe-mae", label: "MFE / MAE", icon: ArrowUpDown },
  { href: "/dashboard/performance/volume", label: "Relative Volume", icon: BarChart2 },
  { href: "/dashboard/performance/returns", label: "Returns Distribution", icon: BarChart },
  { href: "/dashboard/performance/trends", label: "Trend Analysis", icon: TrendingUp },
  { href: "/dashboard/analysis/technical-analysis", label: "Technical Analysis", icon: Crosshair },
  { href: "/dashboard/performance/metrics", label: "Metrics", icon: Activity },
];

const exitAnalysisItems: NavItem[] = [
  { href: "/dashboard/exit-analysis?tab=best-exit-pnl", label: "Exit PnL", icon: TrendingUp },
  { href: "/dashboard/exit-analysis?tab=best-exit-efficiency", label: "Exit Efficiency", icon: Gauge },
  { href: "/dashboard/exit-analysis?tab=best-exit-time", label: "Exit Time", icon: Clock },
  { href: "/dashboard/exit-analysis?tab=eod-pnl", label: "EOD Exit PnL", icon: TrendingDown },
  { href: "/dashboard/exit-analysis?tab=eod-efficiency", label: "EOD Efficiency", icon: Gauge },
  { href: "/dashboard/exit-analysis?tab=multi-tf", label: "Multi-Timeframe", icon: Layers },
];

const breakdownItems: NavItem[] = [
  { href: "/dashboard/analysis/tag-groups", label: "Tag Groups", icon: Tag },
  { href: "/dashboard/analysis/sectors", label: "Sectors", icon: Layers },
  { href: "/dashboard/analysis/treemap/symbol", label: "Treemap: Symbol", icon: TreePine },
  { href: "/dashboard/analysis/treemap/sector", label: "Treemap: Sector", icon: TreePine },
  { href: "/dashboard/analysis/treemap/tags", label: "Treemap: Tags", icon: TreePine },
];

const summaryItems: NavItem[] = [
  { href: "/dashboard/summaries/accounts", label: "Accounts Statistics", icon: BarChart3 },
  { href: "/dashboard/summaries/tags", label: "Tag Groups Statistics", icon: BarChart3 },
  { href: "/dashboard/summaries/open-trades", label: "Open Trades Summary", icon: BarChart3 },
];

const dateViewItems: NavItem[] = [
  { href: "/dashboard/trades/day-grouped", label: "Day Grouped", icon: CalendarDays },
  { href: "/dashboard/performance/calendar", label: "Calendar Grouped", icon: CalendarCheck },
];

const intelligenceItems: NavItem[] = [
  { href: "/dashboard/insights", label: "Insights", icon: Brain, tourId: "tour-insights" },
  { href: "/dashboard/ai", label: "AI Coach", icon: Sparkles, tourId: "tour-ai" },
  { href: "/dashboard/reports", label: "Weekly Reports", icon: FileBarChart },
];

const marketToolsItemsFull: NavItem[] = [
  { href: "/dashboard/market", label: "Market Overview", icon: Globe },
  { href: "/dashboard/screener", label: "Token Screener", icon: Search },
  { href: "/dashboard/heatmaps", label: "Heat Maps", icon: Grid3X3 },
  { href: "/dashboard/funding-rates", label: "Derivatives", icon: BarChart3 },
  { href: "/dashboard/dca", label: "DCA Calculator", icon: Coins },
  { href: "/dashboard/risk", label: "Risk Calculator", icon: Calculator },
  { href: "/dashboard/playbook", label: "Playbook", icon: BookMarked },
  { href: "/dashboard/stocks/options-analysis", label: "Options Analysis", icon: BarChart3 },
];

const marketToolsItemsSimple: NavItem[] = [
  { href: "/dashboard/market", label: "Market Overview", icon: Globe },
  { href: "/dashboard/dca", label: "DCA Calculator", icon: Coins },
  { href: "/dashboard/playbook", label: "Playbook", icon: BookMarked },
  { href: "/dashboard/risk", label: "Risk Calculator", icon: Calculator },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
];

const disciplineItems: NavItem[] = [
  { href: "/dashboard/rules", label: "Rule Tracker", icon: ShieldAlert },
  { href: "/dashboard/execution", label: "Execution", icon: Crosshair },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
  { href: "/dashboard/risk-analysis", label: "Risk Analysis", icon: TrendingDown },
  { href: "/dashboard/prop-firm", label: "Prop Firm", icon: Flame },
];

const reportItems: NavItem[] = [
  { href: "/dashboard/taxes", label: "Tax Reports", icon: Receipt },
  { href: "/dashboard/simulations", label: "Simulations", icon: Dices },
];

export const bottomItems: NavItem[] = [
  { href: "/dashboard/help", label: "Help Center", icon: HelpCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/* ────────────────────────────────────────────────────────────────── */
/*  Section configuration                                             */
/* ────────────────────────────────────────────────────────────────── */

export const NAV_SECTIONS: NavSection[] = [
  {
    key: "analysis",
    label: "Performance & Analysis",
    icon: PieChart,
    items: analysisTopItems,
    subSections: [
      { key: "performance", label: "Performance", items: performanceItems },
      { key: "exitAnalysis", label: "Exit Analysis", items: exitAnalysisItems },
      { key: "breakdowns", label: "Breakdown Views", items: breakdownItems },
      { key: "summaries", label: "Summaries", items: summaryItems },
      { key: "dateViews", label: "Date Views", items: dateViewItems },
    ],
    visibleInSimple: false,
  },
  {
    key: "intelligence",
    label: "Intelligence",
    icon: Brain,
    items: intelligenceItems,
    visibleInSimple: true,
  },
  {
    key: "market",
    label: "Market & Tools",
    icon: Globe,
    items: marketToolsItemsFull,
    visibleInSimple: true,
    simpleItems: marketToolsItemsSimple,
  },
  {
    key: "discipline",
    label: "Discipline",
    icon: ShieldAlert,
    items: disciplineItems,
    visibleInSimple: false,
  },
  {
    key: "reports",
    label: "Reports",
    icon: FileBarChart,
    items: reportItems,
    visibleInSimple: false,
  },
];

/* ────────────────────────────────────────────────────────────────── */
/*  Rail categories                                                   */
/* ────────────────────────────────────────────────────────────────── */

export const RAIL_CATEGORIES: RailCategory[] = [
  {
    key: "home",
    label: "Home",
    icon: LayoutDashboard,
    directNav: true,
    items: [coreItems[0]],
  },
  {
    key: "journal",
    label: "Journal",
    icon: BookOpen,
    items: [coreItems[1], coreItems[2], coreItems[3], coreItems[5], coreItems[6]],
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: [coreItems[4]],
    sections: [NAV_SECTIONS[0], NAV_SECTIONS[1]],
  },
  {
    key: "tools",
    label: "Tools",
    icon: Globe,
    items: [],
    sections: [NAV_SECTIONS[2], NAV_SECTIONS[3], NAV_SECTIONS[4]],
  },
];

/* ────────────────────────────────────────────────────────────────── */
/*  i18n label maps                                                   */
/* ────────────────────────────────────────────────────────────────── */

export const LABEL_KEY: Record<string, string> = {
  Dashboard: "sidebar.dashboard", "Trade Log": "sidebar.tradeLog", Journal: "sidebar.journal",
  Calendar: "sidebar.calendar", Analytics: "sidebar.analytics", "Trade Plans": "sidebar.tradePlans",
  Positions: "sidebar.positions", Watchlist: "sidebar.watchlist", Settings: "sidebar.settings",
  Admin: "sidebar.admin", Achievements: "sidebar.achievements",
  "Running PnL Analysis": "sidebar.runningPnl", "Trade Count": "sidebar.tradeCount",
  Volume: "sidebar.volume", "Commissions/Fees": "sidebar.commissionsFees",
  "Trade Expectancy": "sidebar.tradeExpectancy", "R-Value": "sidebar.rValue",
  "Hit Ratio": "sidebar.hitRatio", "Profit Factor": "sidebar.profitFactor",
  "MFE / MAE": "sidebar.mfeMae", "Relative Volume": "sidebar.relativeVolume",
  "Returns Distribution": "sidebar.returnsDistribution", "Trend Analysis": "sidebar.trendAnalysis",
  "Technical Analysis": "sidebar.technicalAnalysis", Metrics: "sidebar.metrics",
  "Exit PnL": "sidebar.exitPnl", "Exit Efficiency": "sidebar.exitEfficiency",
  "Exit Time": "sidebar.exitTime", "EOD Exit PnL": "sidebar.eodExitPnl",
  "EOD Efficiency": "sidebar.eodEfficiency", "Multi-Timeframe": "sidebar.multiTimeframe",
  "Tag Groups": "sidebar.tagGroups", Sectors: "sidebar.sectors",
  "Treemap: Symbol": "sidebar.treemapSymbol", "Treemap: Sector": "sidebar.treemapSector",
  "Treemap: Tags": "sidebar.treemapTags",
  "Accounts Statistics": "sidebar.accountsStatistics",
  "Tag Groups Statistics": "sidebar.tagGroupsStatistics",
  "Open Trades Summary": "sidebar.openTradesSummary",
  "Day Grouped": "sidebar.dayGrouped", "Calendar Grouped": "sidebar.calendarGrouped",
  Insights: "sidebar.insights", "AI Coach": "sidebar.aiCoach",
  "Weekly Reports": "sidebar.weeklyReports", "Market Overview": "sidebar.marketOverview",
  "Token Screener": "sidebar.tokenScreener", "Heat Maps": "sidebar.heatMaps",
  Derivatives: "sidebar.derivatives", "DCA Calculator": "sidebar.dcaCalculator",
  "Risk Calculator": "sidebar.riskCalculator", Playbook: "sidebar.playbook",
  "Options Analysis": "sidebar.optionsAnalysis", Goals: "sidebar.goals",
  "Rule Tracker": "sidebar.ruleTracker", Execution: "sidebar.execution",
  "Risk Analysis": "sidebar.riskAnalysis", "Prop Firm": "sidebar.propFirm",
  "Tax Reports": "sidebar.taxReports", Simulations: "sidebar.simulations",
  "Help Center": "sidebar.helpCenter",
};

export const SECTION_KEY: Record<string, string> = {
  "Performance & Analysis": "sidebar.performanceAnalysis", Intelligence: "sidebar.intelligence",
  "Market & Tools": "sidebar.marketTools", Tools: "sidebar.tools",
  Discipline: "sidebar.discipline", Reports: "sidebar.reports",
  Performance: "sidebar.performance", "Exit Analysis": "sidebar.exitAnalysis",
  "Breakdown Views": "sidebar.breakdownViews", Summaries: "sidebar.summaries",
  "Date Views": "sidebar.dateViews",
};

/* ────────────────────────────────────────────────────────────────── */
/*  localStorage helpers                                              */
/* ────────────────────────────────────────────────────────────────── */

const SECTION_STATE_KEY = "stargate-sidebar-sections";

export function loadSectionState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(SECTION_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function saveSectionState(state: Record<string, boolean>) {
  localStorage.setItem(SECTION_STATE_KEY, JSON.stringify(state));
}

/* ────────────────────────────────────────────────────────────────── */
/*  Asset context resolution                                          */
/* ────────────────────────────────────────────────────────────────── */

export function resolveItems(items: NavItem[], assetContext: "crypto" | "stocks"): NavItem[] {
  if (assetContext === "stocks") {
    return items
      .filter(item => !["/dashboard/dca", "/dashboard/screener", "/dashboard/funding-rates", "/dashboard/prop-firm", "/dashboard/simulations"].includes(item.href))
      .map(item => item.href === "/dashboard/market" ? { ...item, href: "/dashboard/stocks/market" } : item);
  }
  return items.filter(item => !item.href.startsWith("/dashboard/stocks/"));
}

export function getResolvedCoreItems(assetContext: "crypto" | "stocks"): NavItem[] {
  if (assetContext === "stocks") {
    return coreItems.map((item, i) => {
      if (i === 0) return { ...item, href: "/dashboard/stocks", label: "Dashboard" };
      if (i === 1) return { ...item, href: "/dashboard/stocks/trades", label: "Positions" };
      if (i === 4) return { ...item, href: "/dashboard/stocks/analytics", label: "Analytics" };
      if (i === 5) return { ...item, href: "/dashboard/stocks/plans", label: "Watchlist" };
      return item;
    });
  }
  return coreItems;
}

/* ────────────────────────────────────────────────────────────────── */
/*  Path → category mapping                                           */
/* ────────────────────────────────────────────────────────────────── */

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/stocks") return pathname === "/dashboard/stocks";
  return pathname.startsWith(href.split("?")[0]);
}

export function getCategoryForPath(pathname: string): string | null {
  if (pathname === "/dashboard" || pathname === "/dashboard/stocks") return "home";

  const journalPrefixes = ["/dashboard/trades", "/dashboard/journal", "/dashboard/calendar", "/dashboard/plans", "/dashboard/achievements", "/dashboard/stocks/trades", "/dashboard/stocks/plans"];
  if (journalPrefixes.some(p => pathname.startsWith(p))) return "journal";

  const analyticsPrefixes = ["/dashboard/analytics", "/dashboard/stocks/analytics", "/dashboard/analysis", "/dashboard/performance", "/dashboard/exit-analysis", "/dashboard/summaries", "/dashboard/insights", "/dashboard/ai", "/dashboard/reports"];
  if (analyticsPrefixes.some(p => pathname.startsWith(p))) return "analytics";

  const toolsPrefixes = ["/dashboard/market", "/dashboard/stocks/market", "/dashboard/screener", "/dashboard/heatmaps", "/dashboard/funding-rates", "/dashboard/dca", "/dashboard/risk-analysis", "/dashboard/risk", "/dashboard/playbook", "/dashboard/stocks/options-analysis", "/dashboard/rules", "/dashboard/execution", "/dashboard/goals", "/dashboard/prop-firm", "/dashboard/taxes", "/dashboard/simulations"];
  if (toolsPrefixes.some(p => pathname.startsWith(p))) return "tools";

  return null;
}
