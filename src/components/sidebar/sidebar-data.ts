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
  Globe,
  Shield,
  PieChart,
  Activity,
  Tag,
  LineChart,
  ArrowUpDown,
  CalendarCheck,
  Trophy,
  Users,
  HelpCircle,
  UserCircle,
  MessageSquareText,
  Newspaper,
  Fingerprint,
  Ghost,
  GraduationCap,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────── */
/*  Types                                                             */
/* ────────────────────────────────────────────────────────────────── */

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  tourId?: string;
  unreleasedFeature?: string;
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
  visibleInBeginner?: boolean;
  beginnerItems?: NavItem[];
  unreleasedFeature?: string;
}

export interface RailCategory {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  directNav?: boolean;
  items: NavItem[];
  beginnerItems?: NavItem[];
  sections?: NavSection[];
  showInBeginner?: boolean;
  showInAdvanced?: boolean;
  showAssetToggle?: boolean;
  requiredLevel?: number;
  unreleasedFeature?: string;
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
  { href: "/dashboard/import-export", label: "Import / Export", icon: ArrowUpDown },
  { href: "/dashboard/challenges", label: "Quests", icon: Target },
  { href: "/dashboard/achievements", label: "Achievements", icon: Trophy, tourId: "tour-achievements" },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Users },
  { href: "/dashboard/trades/phantoms", label: "What If", icon: Ghost },
];

const analyticsConsolidatedItems: NavItem[] = [
  { href: "/dashboard/performance", label: "Performance", icon: LineChart },
  { href: "/dashboard/analysis", label: "Analysis", icon: Activity },
  { href: "/dashboard/edge-profile", label: "Edge Profile", icon: Fingerprint },
  { href: "/dashboard/exit-analysis", label: "Exit Analysis", icon: TrendingDown },
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
  { href: "/dashboard/ai", label: "Nova", icon: Sparkles, tourId: "tour-ai" },
  { href: "/dashboard/reports", label: "Weekly Reports", icon: FileBarChart },
  { href: "/dashboard/recaps", label: "Monthly Recap", icon: CalendarCheck },
];

const intelligenceBeginnerItems: NavItem[] = [
  { href: "/dashboard/insights", label: "Insights", icon: Brain, tourId: "tour-insights" },
  { href: "/dashboard/ai", label: "Nova", icon: Sparkles, tourId: "tour-ai" },
];

const marketToolsItemsFull: NavItem[] = [
  { href: "/dashboard/market", label: "Market Overview", icon: Globe },
  { href: "/dashboard/news", label: "Market News", icon: Newspaper },
  { href: "/dashboard/economic-calendar", label: "Economic Calendar", icon: CalendarDays },
  { href: "/dashboard/heatmaps", label: "Heat Maps", icon: Grid3X3 },
  { href: "/dashboard/funding-rates", label: "Derivatives", icon: BarChart3 },
  { href: "/dashboard/risk", label: "Risk Calculator", icon: Calculator },
  { href: "/dashboard/playbook", label: "Playbook", icon: BookMarked },
  { href: "/dashboard/stocks/options-analysis", label: "Options Analysis", icon: BarChart3 },
];

const marketToolsItemsSimple: NavItem[] = [
  { href: "/dashboard/market", label: "Market Overview", icon: Globe },
  { href: "/dashboard/news", label: "Market News", icon: Newspaper },
  { href: "/dashboard/economic-calendar", label: "Economic Calendar", icon: CalendarDays },
  { href: "/dashboard/playbook", label: "Playbook", icon: BookMarked },
  { href: "/dashboard/risk", label: "Risk Calculator", icon: Calculator },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
];

const disciplineItems: NavItem[] = [
  { href: "/dashboard/rules", label: "Rule Tracker", icon: ShieldAlert },
  { href: "/dashboard/execution", label: "Execution", icon: Crosshair },
  { href: "/dashboard/risk-analysis", label: "Risk Analysis", icon: TrendingDown },
  { href: "/dashboard/prop-firm", label: "Prop Firm", icon: Flame },
];

const reportItems: NavItem[] = [
  { href: "/dashboard/simulations", label: "Simulations", icon: Dices },
];

export const bottomItems: NavItem[] = [
  { href: "/dashboard/import-export", label: "Import / Export", icon: ArrowUpDown },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquareText },
  { href: "/dashboard/help", label: "Help Center", icon: HelpCircle },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
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
    items: analyticsConsolidatedItems,
    subSections: [
      { key: "summaries", label: "Summaries", items: summaryItems },
      { key: "dateViews", label: "Date Views", items: dateViewItems },
    ],
    visibleInSimple: false,
    visibleInBeginner: false,
  },
  {
    key: "intelligence",
    label: "Intelligence",
    icon: Brain,
    items: intelligenceItems,
    visibleInSimple: true,
    visibleInBeginner: true,
    beginnerItems: intelligenceBeginnerItems,
  },
  {
    key: "market",
    label: "Market & Tools",
    icon: Globe,
    items: marketToolsItemsFull,
    visibleInSimple: true,
    simpleItems: marketToolsItemsSimple,
    visibleInBeginner: false,
  },
  {
    key: "discipline",
    label: "Discipline",
    icon: ShieldAlert,
    items: disciplineItems,
    visibleInSimple: false,
    visibleInBeginner: false,
  },
  {
    key: "reports",
    label: "Reports",
    icon: FileBarChart,
    items: reportItems,
    visibleInSimple: false,
    visibleInBeginner: false,
  },
];

/* ────────────────────────────────────────────────────────────────── */
/*  Rail categories                                                   */
/* ────────────────────────────────────────────────────────────────── */

export const RAIL_CATEGORIES: RailCategory[] = [
  // === Core directNav tabs ===
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    directNav: true,
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tourId: "tour-home" }],
    showInBeginner: true,
  },
  {
    key: "trades",
    label: "Trades",
    icon: Table2,
    directNav: true,
    items: [{ href: "/dashboard/trades", label: "Trade Log", icon: Table2, tourId: "tour-trades" }],
    showInBeginner: true,
    showInAdvanced: false, // Advanced/expert use the drawer instead
  },
  {
    key: "journal",
    label: "Journal",
    icon: BookOpen,
    directNav: true,
    items: [{ href: "/dashboard/journal", label: "Journal", icon: BookOpen }],
    showInBeginner: true,
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    directNav: true,
    items: [{ href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays, tourId: "tour-calendar" }],
    showInBeginner: true,
    showInAdvanced: false, // Advanced/expert access via journal drawer
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    directNav: true,
    items: [coreItems[4]], // Analytics
    showInBeginner: false,
    requiredLevel: 5,
  },
  // === Drawer tabs — level-gated for beginners ===
  {
    key: "intelligence",
    label: "Intelligence",
    icon: Brain,
    items: intelligenceItems,
    beginnerItems: intelligenceBeginnerItems,
    showInBeginner: false,
    showInAdvanced: true,
    requiredLevel: 10,
  },
  {
    key: "market",
    label: "Market",
    icon: Globe,
    items: [],
    sections: [NAV_SECTIONS[2], NAV_SECTIONS[3], NAV_SECTIONS[4]],
    showInBeginner: true,
    showInAdvanced: true,
    beginnerItems: [
      { href: "/dashboard/market", label: "Market Overview", icon: Globe },
      { href: "/dashboard/news", label: "Market News", icon: Newspaper },
      { href: "/dashboard/heatmaps", label: "Heat Maps", icon: Grid3X3 },
    ],
    requiredLevel: 5,
  },
  {
    key: "leaderboard",
    label: "Leaderboard",
    icon: Users,
    directNav: true,
    items: [{ href: "/dashboard/leaderboard", label: "Leaderboard", icon: Users }],
    showInBeginner: true,
    showInAdvanced: true,
  },
  {
    key: "compete",
    label: "Compete",
    icon: Trophy,
    items: [coreItems[7], coreItems[8]],
    showInBeginner: false,
    showInAdvanced: true,
    requiredLevel: 15,
  },
  {
    key: "learn",
    label: "Learn",
    icon: GraduationCap,
    directNav: true,
    items: [{ href: "/dashboard/learn", label: "Learn", icon: GraduationCap }],
    showInBeginner: true,
    showInAdvanced: true,
    unreleasedFeature: "education-platform",
  },
];

/* ────────────────────────────────────────────────────────────────── */
/*  i18n label maps                                                   */
/* ────────────────────────────────────────────────────────────────── */

export const LABEL_KEY: Record<string, string> = {
  Dashboard: "sidebar.dashboard", "Trade Log": "sidebar.tradeLog", Journal: "sidebar.journal",
  Calendar: "sidebar.calendar", Analytics: "sidebar.analytics", "Trade Plans": "sidebar.tradePlans",
  Positions: "sidebar.positions", Watchlist: "sidebar.watchlist", Settings: "sidebar.settings",
  Admin: "sidebar.admin", Quests: "sidebar.quests", Achievements: "sidebar.achievements", Leaderboard: "sidebar.leaderboard",
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
  Overview: "sidebar.overview", Insights: "sidebar.insights", Psychology: "sidebar.psychology", Nova: "sidebar.aiCoach",
  "Weekly Reports": "sidebar.weeklyReports", "Monthly Recap": "sidebar.monthlyRecap", "Market Overview": "sidebar.marketOverview",
  "Market News": "sidebar.marketNews",
  "Heat Maps": "sidebar.heatMaps",
  Derivatives: "sidebar.derivatives",
  "Risk Calculator": "sidebar.riskCalculator", Playbook: "sidebar.playbook",
  "Options Analysis": "sidebar.optionsAnalysis", Goals: "sidebar.goals",
  "Rule Tracker": "sidebar.ruleTracker", Execution: "sidebar.execution",
  "Risk Analysis": "sidebar.riskAnalysis", "Prop Firm": "sidebar.propFirm",
  Simulations: "sidebar.simulations",
  Feedback: "sidebar.feedback",
  "Help Center": "sidebar.helpCenter",
  "Import / Export": "sidebar.importExport",
  "What If": "sidebar.whatIf",
};

export const SECTION_KEY: Record<string, string> = {
  "Performance & Analysis": "sidebar.performanceAnalysis", Intelligence: "sidebar.intelligence",
  "Market & Tools": "sidebar.marketTools", Tools: "sidebar.tools", Compete: "sidebar.compete",
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

export function resolveItems(items: NavItem[], assetContext: "crypto" | "stocks" | "commodities" | "forex"): NavItem[] {
  if (assetContext === "stocks") {
    return items
      .filter(item => !["/dashboard/dca", "/dashboard/screener", "/dashboard/funding-rates", "/dashboard/prop-firm", "/dashboard/simulations"].includes(item.href))
      .map(item => {
        if (item.href === "/dashboard/market") return { ...item, href: "/dashboard/stocks/market" };
        if (item.href === "/dashboard/news") return { ...item, href: "/dashboard/stocks/news" };
        return item;
      });
  }
  if (assetContext === "commodities") {
    return items
      .filter(item => !["/dashboard/screener", "/dashboard/funding-rates", "/dashboard/prop-firm", "/dashboard/simulations", "/dashboard/stocks/options-analysis"].includes(item.href))
      .map(item => {
        if (item.href === "/dashboard/market") return { ...item, href: "/dashboard/commodities/market" };
        if (item.href === "/dashboard/news") return { ...item, href: "/dashboard/commodities/news" };
        return item;
      });
  }
  if (assetContext === "forex") {
    return items
      .filter(item => !["/dashboard/screener", "/dashboard/funding-rates", "/dashboard/prop-firm", "/dashboard/simulations", "/dashboard/stocks/options-analysis", "/dashboard/heatmaps"].includes(item.href))
      .map(item => {
        if (item.href === "/dashboard/market") return { ...item, href: "/dashboard/forex/market" };
        if (item.href === "/dashboard/news") return { ...item, href: "/dashboard/forex/news" };
        return item;
      });
  }
  return items.filter(item => !item.href.startsWith("/dashboard/stocks/"));
}

export function getResolvedCoreItems(assetContext: "crypto" | "stocks" | "commodities" | "forex"): NavItem[] {
  if (assetContext === "stocks") {
    return coreItems.map((item, i) => {
      if (i === 0) return { ...item, href: "/dashboard/stocks", label: "Dashboard" };
      if (i === 1) return { ...item, href: "/dashboard/stocks/trades", label: "Positions" };
      if (i === 2) return { ...item, href: "/dashboard/journal?asset=stocks" };
      if (i === 4) return { ...item, href: "/dashboard/stocks/analytics", label: "Analytics" };
      if (i === 5) return { ...item, href: "/dashboard/stocks/plans", label: "Watchlist" };
      return item;
    });
  }
  if (assetContext === "commodities") {
    return coreItems.map((item, i) => {
      if (i === 0) return { ...item, href: "/dashboard/commodities", label: "Dashboard" };
      if (i === 1) return { ...item, href: "/dashboard/commodities/trades", label: "Positions" };
      if (i === 2) return { ...item, href: "/dashboard/journal?asset=commodities" };
      if (i === 4) return { ...item, href: "/dashboard/commodities/analytics", label: "Analytics" };
      if (i === 5) return { ...item, href: "/dashboard/commodities/plans", label: "Watchlist" };
      return item;
    });
  }
  if (assetContext === "forex") {
    return coreItems.map((item, i) => {
      if (i === 0) return { ...item, href: "/dashboard/forex", label: "Dashboard" };
      if (i === 1) return { ...item, href: "/dashboard/forex/trades", label: "Positions" };
      if (i === 2) return { ...item, href: "/dashboard/journal?asset=forex" };
      if (i === 4) return { ...item, href: "/dashboard/forex/analytics", label: "Analytics" };
      if (i === 5) return { ...item, href: "/dashboard/forex/plans", label: "Watchlist" };
      return item;
    });
  }
  return coreItems;
}

/* ────────────────────────────────────────────────────────────────── */
/*  Path → category mapping                                           */
/* ────────────────────────────────────────────────────────────────── */

export function isActivePath(pathname: string, href: string, search?: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/stocks") return pathname === "/dashboard/stocks";
  if (href === "/dashboard/commodities") return pathname === "/dashboard/commodities";
  if (href === "/dashboard/forex") return pathname === "/dashboard/forex";
  const [hrefPath, hrefQuery] = href.split("?");
  if (!pathname.startsWith(hrefPath)) return false;
  // If href has query params, require them to match
  if (hrefQuery) return search === `?${hrefQuery}`;
  return true;
}

export function getCategoryForPath(pathname: string): string | null {
  // Dashboard
  if (pathname === "/dashboard") return "dashboard";

  // Calendar — returns own key so beginner rail highlights correctly;
  // advanced/expert journal drawer also claims calendar via aliasCategories
  if (pathname.startsWith("/dashboard/calendar")) return "calendar";

  // Journal
  if (pathname.startsWith("/dashboard/journal")) return "journal";

  // Analytics (direct nav page + sub-pages)
  if (pathname.startsWith("/dashboard/analytics")) return "analytics";

  // Trades
  const tradesPrefixes = ["/dashboard/trades", "/dashboard/import-export", "/dashboard/plans", "/dashboard/stocks/trades", "/dashboard/stocks/plans", "/dashboard/commodities/trades", "/dashboard/commodities/plans", "/dashboard/forex/trades", "/dashboard/forex/plans"];
  if (tradesPrefixes.some(p => pathname.startsWith(p))) return "trades";

  // Intelligence
  const intelligencePrefixes = ["/dashboard/psychology", "/dashboard/ai", "/dashboard/insights", "/dashboard/reports", "/dashboard/recaps", "/dashboard/edge-profile"];
  if (intelligencePrefixes.some(p => pathname.startsWith(p))) return "intelligence";

  // Analytics (includes Overview = old dashboards)
  const analyticsPrefixes = ["/dashboard/analytics", "/dashboard/stocks/analytics", "/dashboard/commodities/analytics", "/dashboard/forex/analytics", "/dashboard/analysis", "/dashboard/performance", "/dashboard/exit-analysis", "/dashboard/summaries", "/dashboard/stocks", "/dashboard/commodities", "/dashboard/forex"];
  if (analyticsPrefixes.some(p => pathname.startsWith(p))) return "analytics";

  // Market & Tools
  const marketPrefixes = ["/dashboard/market", "/dashboard/news", "/dashboard/stocks/news", "/dashboard/commodities/news", "/dashboard/forex/news", "/dashboard/economic-calendar", "/dashboard/stocks/market", "/dashboard/commodities/market", "/dashboard/forex/market", "/dashboard/heatmaps", "/dashboard/funding-rates", "/dashboard/risk-analysis", "/dashboard/risk", "/dashboard/playbook", "/dashboard/stocks/options-analysis", "/dashboard/rules", "/dashboard/execution", "/dashboard/goals", "/dashboard/prop-firm", "/dashboard/taxes", "/dashboard/simulations"];
  if (marketPrefixes.some(p => pathname.startsWith(p))) return "market";

  // Leaderboard (own category now)
  if (pathname.startsWith("/dashboard/leaderboard")) return "leaderboard";

  // Compete
  const competePrefixes = ["/dashboard/challenges", "/dashboard/achievements"];
  if (competePrefixes.some(p => pathname.startsWith(p))) return "compete";

  // Learn
  if (pathname.startsWith("/dashboard/learn")) return "learn";

  return null;
}
