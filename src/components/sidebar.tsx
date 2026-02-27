"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Settings,
  ClipboardList,
  Table2,
  CalendarDays,
  BarChart3,
  Sparkles,
  FileBarChart,
  BookMarked,
  Calculator,
  Target,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Dices,
  Receipt,
  Flame,
  Grid3X3,
  TrendingDown,
  Crosshair,
  ShieldAlert,
  TrendingUp,
  Lock,
  LogOut,
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
  MoreHorizontal,
} from "lucide-react";
import { StargateLogo } from "./stargate-logo";
import { useTheme, type ViewMode } from "@/lib/theme-context";
import { hasStockAccess } from "@/lib/addons";
import { createClient } from "@/lib/supabase/client";
import { clearSubscriptionCache } from "@/lib/use-subscription";
import { useSubscriptionContext } from "@/lib/subscription-context";
import { SidebarFlyout } from "./sidebar-flyout";

/* ────────────────────────────────────────────────────────────────── */
/*  Nav item definitions                                              */
/* ────────────────────────────────────────────────────────────────── */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  tourId?: string;
}

const mainItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tourId: "tour-home" },
  { href: "/dashboard/trades", label: "Trade Log", icon: Table2, tourId: "tour-trades" },
  { href: "/dashboard/journal", label: "Journal", icon: BookOpen },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, tourId: "tour-analytics" },
  { href: "/dashboard/plans", label: "Trade Plans", icon: ClipboardList, tourId: "tour-plans" },
];

const intelligenceItems: NavItem[] = [
  { href: "/dashboard/insights", label: "Insights", icon: Brain },
  { href: "/dashboard/ai", label: "AI Coach", icon: Sparkles },
  { href: "/dashboard/reports", label: "Weekly Reports", icon: FileBarChart },
];

const toolItems: NavItem[] = [
  { href: "/dashboard/market", label: "Market Overview", icon: Globe },
  { href: "/dashboard/dca", label: "DCA Calculator", icon: Coins },
  { href: "/dashboard/playbook", label: "Playbook", icon: BookMarked },
  { href: "/dashboard/risk", label: "Risk Calculator", icon: Calculator },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
];

const advancedToolItems: NavItem[] = [
  { href: "/dashboard/screener", label: "Token Screener", icon: Search },
  { href: "/dashboard/funding-rates", label: "Derivatives", icon: BarChart3 },
  { href: "/dashboard/prop-firm", label: "Prop Firm", icon: Flame },
  { href: "/dashboard/heatmaps", label: "Heat Maps", icon: Grid3X3 },
  { href: "/dashboard/risk-analysis", label: "Risk Analysis", icon: TrendingDown },
  { href: "/dashboard/execution", label: "Execution", icon: Crosshair },
  { href: "/dashboard/rules", label: "Rule Tracker", icon: ShieldAlert },
  { href: "/dashboard/simulations", label: "Simulations", icon: Dices },
  { href: "/dashboard/taxes", label: "Tax Reports", icon: Receipt },
];

const dateChartItems: NavItem[] = [
  { href: "/dashboard/trades/day-grouped", label: "Day Grouped", icon: CalendarDays },
  { href: "/dashboard/performance/calendar", label: "Calendar Grouped", icon: CalendarCheck },
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
];

const summaryItems: NavItem[] = [
  { href: "/dashboard/summaries/accounts", label: "Accounts Statistics", icon: BarChart3 },
  { href: "/dashboard/summaries/tags", label: "Tag Groups Statistics", icon: BarChart3 },
  { href: "/dashboard/summaries/open-trades", label: "Open Trades Summary", icon: BarChart3 },
];

const analysisItems: NavItem[] = [
  { href: "/dashboard/analysis/running-pnl", label: "Running PnL Analysis", icon: Activity },
  { href: "/dashboard/analysis/tag-groups", label: "Tag Groups", icon: Tag },
  { href: "/dashboard/analysis/sectors", label: "Sectors", icon: Layers },
  { href: "/dashboard/analysis/trade-count", label: "Trade Count", icon: Hash },
  { href: "/dashboard/analysis/volume", label: "Volume", icon: BarChart },
  { href: "/dashboard/analysis/fees", label: "Commissions/Fees", icon: DollarSign },
];

const treemapItems: NavItem[] = [
  { href: "/dashboard/analysis/treemap/symbol", label: "Symbol", icon: TreePine },
  { href: "/dashboard/analysis/treemap/sector", label: "Sector", icon: TreePine },
  { href: "/dashboard/analysis/treemap/tags", label: "Tags", icon: TreePine },
];

const bestExitItems: NavItem[] = [
  { href: "/dashboard/exit-analysis?tab=best-exit-pnl", label: "Exit PnL", icon: TrendingUp },
  { href: "/dashboard/exit-analysis?tab=best-exit-efficiency", label: "Exit Efficiency", icon: Gauge },
  { href: "/dashboard/exit-analysis?tab=best-exit-time", label: "Exit Time", icon: Clock },
];

const eodExitItems: NavItem[] = [
  { href: "/dashboard/exit-analysis?tab=eod-pnl", label: "EOD Exit PnL", icon: TrendingDown },
  { href: "/dashboard/exit-analysis?tab=eod-efficiency", label: "EOD Efficiency", icon: Gauge },
];

const multiTimeframeItem: NavItem = {
  href: "/dashboard/exit-analysis?tab=multi-tf",
  label: "Multi-Timeframe",
  icon: Layers,
};

const exitAnalysisItemsFlat: NavItem[] = [...bestExitItems, ...eodExitItems, multiTimeframeItem];

const bottomItems: NavItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/* ────────────────────────────────────────────────────────────────── */
/*  Flyout section metadata                                           */
/* ────────────────────────────────────────────────────────────────── */

interface FlyoutSectionMeta {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const FLYOUT_SECTIONS: FlyoutSectionMeta[] = [
  { key: "dateCharts", label: "Date Charts", icon: CalendarDays },
  { key: "performance", label: "Performance", icon: Activity },
  { key: "summaries", label: "Summaries", icon: PieChart },
  { key: "analysis", label: "Trades Analysis", icon: BarChart3 },
  { key: "exitAnalysis", label: "Exit Analysis", icon: Crosshair },
];

function getFlatItems(key: string): NavItem[] {
  switch (key) {
    case "dateCharts": return dateChartItems;
    case "performance": return performanceItems;
    case "summaries": return summaryItems;
    case "analysis": return [...analysisItems, ...treemapItems];
    case "exitAnalysis": return exitAnalysisItemsFlat;
    default: return [];
  }
}

/* ────────────────────────────────────────────────────────────────── */
/*  Sidebar component                                                 */
/* ────────────────────────────────────────────────────────────────── */

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assetContext, setAssetContext] = useState<"crypto" | "stocks">("crypto");
  const [showStockUpgrade, setShowStockUpgrade] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const { isOwner: isOwnerFromContext } = useSubscriptionContext();
  const [isOwner, setIsOwner] = useState(isOwnerFromContext);
  const { viewMode, setViewModeTo } = useTheme();

  // Flyout trigger refs (desktop only)
  const flyoutRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!isOwnerFromContext && document.cookie.includes("stargate-owner=1")) {
      setIsOwner(true);
    }
  }, [isOwnerFromContext]);

  // Tour integration
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;
  const tourSavedCollapsed = useRef<boolean | null>(null);

  useEffect(() => {
    function handleTourSidebar(e: Event) {
      const { expand } = (e as CustomEvent).detail;
      if (expand) {
        if (tourSavedCollapsed.current === null) {
          tourSavedCollapsed.current = collapsedRef.current;
        }
        setCollapsed(false);
      } else if (tourSavedCollapsed.current !== null) {
        setCollapsed(tourSavedCollapsed.current);
        tourSavedCollapsed.current = null;
      }
    }
    window.addEventListener("tour-sidebar", handleTourSidebar as EventListener);
    return () => window.removeEventListener("tour-sidebar", handleTourSidebar as EventListener);
  }, []);

  function handleAssetToggle(context: "crypto" | "stocks") {
    if (context === "stocks" && !hasStockAccess()) {
      setShowStockUpgrade(true);
      return;
    }
    setShowStockUpgrade(false);
    setAssetContext(context);
    localStorage.setItem("stargate-asset-context", context);
  }

  useEffect(() => {
    const saved = localStorage.getItem("stargate-sidebar");
    if (saved === "collapsed") setCollapsed(true);
    const savedContext = localStorage.getItem("stargate-asset-context");
    if (savedContext === "crypto" || savedContext === "stocks") {
      if (savedContext === "stocks" && hasStockAccess()) {
        setAssetContext("stocks");
      } else if (savedContext === "crypto") {
        setAssetContext("crypto");
      }
    }
    const savedMore = localStorage.getItem("stargate-more-open");
    if (savedMore === "true") setMoreOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("stargate-sidebar", collapsed ? "collapsed" : "open");
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close flyout on route change
  useEffect(() => {
    setActiveFlyout(null);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href.split("?")[0]);

  const toggleFlyout = useCallback((key: string) => {
    setActiveFlyout(prev => prev === key ? null : key);
  }, []);

  /* ── NavLink ─────────────────────────────────────── */
  function NavLink({ item, isMobile, compact }: { item: NavItem; isMobile: boolean; compact?: boolean }) {
    const tourId = item.tourId ?? `tour-${item.href.replace("/dashboard/", "").replace("/dashboard", "home") || "home"}`;
    return (
      <Link
        id={!isMobile ? tourId : undefined}
        href={item.href}
        title={!isMobile && collapsed ? item.label : undefined}
        onClick={() => setActiveFlyout(null)}
        className={`flex items-center gap-3 ${
          !isMobile && collapsed ? "justify-center px-2" : "px-3"
        } ${compact ? "py-1.5" : "py-2"} rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive(item.href)
            ? "text-accent bg-accent/10 shadow-[0_0_12px_rgba(0,180,216,0.15)]"
            : "text-muted hover:text-foreground hover:bg-surface-hover"
        }`}
      >
        <item.icon size={compact ? 16 : 18} />
        {(isMobile || !collapsed) && (
          <span className="truncate">{item.label}</span>
        )}
      </Link>
    );
  }

  /* ── FlyoutNavLink (used inside flyout panels) ─── */
  function FlyoutNavLink({ item }: { item: NavItem }) {
    return (
      <Link
        href={item.href}
        onClick={() => setActiveFlyout(null)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive(item.href)
            ? "text-accent bg-accent/10"
            : "text-muted hover:text-foreground hover:bg-surface-hover"
        }`}
      >
        <item.icon size={16} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  /* ── Resolved items based on asset context ──────── */
  const resolvedMainItems: NavItem[] = assetContext === "stocks"
    ? mainItems.map((item, i) => {
        if (i === 0) return { ...item, href: "/dashboard/stocks", label: "Dashboard" };
        if (i === 1) return { ...item, href: "/dashboard/stocks/trades", label: "Positions" };
        if (i === 4) return { ...item, href: "/dashboard/stocks/analytics", label: "Analytics" };
        if (i === 5) return { ...item, href: "/dashboard/stocks/plans", label: "Watchlist" };
        return item;
      })
    : mainItems;

  const resolvedToolItems = assetContext === "stocks"
    ? toolItems
        .filter(item => !["/dashboard/dca"].includes(item.href))
        .map(item => item.href === "/dashboard/market" ? { ...item, href: "/dashboard/stocks/market" } : item)
    : toolItems;

  const resolvedAdvancedItems = assetContext === "stocks"
    ? advancedToolItems.filter(item => !["/dashboard/prop-firm", "/dashboard/simulations", "/dashboard/screener", "/dashboard/funding-rates"].includes(item.href))
    : advancedToolItems;

  // All items for the "More" section in Simple mode
  const moreItems: NavItem[] = [
    ...FLYOUT_SECTIONS.flatMap(s => getFlatItems(s.key)),
    ...resolvedAdvancedItems,
  ];

  const isCompact = viewMode === "expert";

  /* ── Flyout content renderers ───────────────────── */
  function renderFlyoutContent(key: string) {
    if (key === "analysis") {
      return (
        <>
          {analysisItems.map(item => <FlyoutNavLink key={item.href} item={item} />)}
          <p className="px-3 mt-2.5 mb-1 text-[10px] uppercase tracking-wider text-muted/50 font-semibold">
            Treemap Charts
          </p>
          {treemapItems.map(item => <FlyoutNavLink key={item.href} item={item} />)}
        </>
      );
    }
    if (key === "exitAnalysis") {
      return (
        <>
          <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-muted/50 font-semibold">
            Best Exit
          </p>
          {bestExitItems.map(item => <FlyoutNavLink key={item.href} item={item} />)}
          <p className="px-3 mt-2.5 mb-1 text-[10px] uppercase tracking-wider text-muted/50 font-semibold">
            EOD Exit
          </p>
          {eodExitItems.map(item => <FlyoutNavLink key={item.href} item={item} />)}
          <div className="h-px bg-border/50 mx-2 my-2" />
          <FlyoutNavLink item={multiTimeframeItem} />
        </>
      );
    }
    return getFlatItems(key).map(item => <FlyoutNavLink key={item.href} item={item} />);
  }

  /* ── Inline section (Expert mode + Mobile) ──────── */
  function renderInlineSection(key: string, isMobile: boolean) {
    if (key === "analysis") {
      return (
        <div className="space-y-0.5">
          {analysisItems.map(item => <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />)}
          {(isMobile || !collapsed) && (
            <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted/50 font-semibold">
              Treemap Charts
            </p>
          )}
          <div className="space-y-0.5 pl-1">
            {treemapItems.map(item => <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />)}
          </div>
        </div>
      );
    }
    if (key === "exitAnalysis") {
      return (
        <div className="space-y-0.5">
          {(isMobile || !collapsed) && (
            <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted/50 font-semibold">
              Best Exit
            </p>
          )}
          {bestExitItems.map(item => <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />)}
          {(isMobile || !collapsed) && (
            <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted/50 font-semibold">
              EOD Exit
            </p>
          )}
          {eodExitItems.map(item => <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />)}
          <NavLink item={multiTimeframeItem} isMobile={isMobile} compact={isCompact} />
        </div>
      );
    }
    return (
      <div className="space-y-0.5">
        {getFlatItems(key).map(item => <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />)}
      </div>
    );
  }

  /* ── Mode pill ──────────────────────────────────── */
  function ModePill({ isMobile }: { isMobile: boolean }) {
    const modes: { value: ViewMode; label: string }[] = [
      { value: "simple", label: "Simple" },
      { value: "advanced", label: "Advanced" },
      { value: "expert", label: "Expert" },
    ];

    if (!isMobile && collapsed) {
      // Collapsed: cycle button
      const modeIcons: Record<ViewMode, string> = { simple: "S", advanced: "A", expert: "E" };
      return (
        <button
          onClick={() => {
            const order: ViewMode[] = ["simple", "advanced", "expert"];
            const idx = order.indexOf(viewMode);
            setViewModeTo(order[(idx + 1) % order.length]);
          }}
          className="w-full flex items-center justify-center px-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 mb-1 bg-accent/10 text-accent border border-accent/20"
          title={`Mode: ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}`}
        >
          {modeIcons[viewMode]}
        </button>
      );
    }

    return (
      <div
        id={!isMobile ? "tour-view-toggle" : undefined}
        className="inline-flex items-center rounded-xl bg-background border border-border/50 p-0.5 w-full mb-1"
      >
        {modes.map(mode => (
          <button
            key={mode.value}
            onClick={() => setViewModeTo(mode.value)}
            className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              viewMode === mode.value
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    );
  }

  /* ────────────────────────────────────────────────── */
  /*  Sidebar content                                   */
  /* ────────────────────────────────────────────────── */

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-visible">
          <StargateLogo size={!isMobile && collapsed ? 28 : 32} collapsed={!isMobile && collapsed} />
          {(isMobile || !collapsed) && (
            <h1 className="text-lg font-bold tracking-tight whitespace-nowrap bg-gradient-to-r from-accent via-[#48CAE4] to-accent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite] bg-clip-text text-transparent">
              Stargate
            </h1>
          )}
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Asset context switcher */}
      {(isMobile || !collapsed) && (
        <div className="px-3 pt-3">
          <div className="inline-flex items-center rounded-xl bg-background border border-border/50 p-0.5 w-full">
            <button
              onClick={() => handleAssetToggle("crypto")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                assetContext === "crypto"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground border border-transparent"
              }`}
            >
              <TrendingUp size={12} />
              Crypto
            </button>
            <button
              onClick={() => handleAssetToggle("stocks")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                assetContext === "stocks"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground border border-transparent"
              }`}
            >
              {hasStockAccess() ? <BarChart3 size={12} /> : <Lock size={10} />}
              Stocks
            </button>
          </div>
          {showStockUpgrade && (
            <div className="mt-2 p-2.5 rounded-lg bg-accent/5 border border-accent/20 text-center">
              <p className="text-[10px] text-muted mb-1.5">Stock tracking requires the Stocks add-on or Max plan.</p>
              <a href="/dashboard/settings" className="text-[10px] font-semibold text-accent hover:text-accent-hover transition-colors">
                Upgrade now &rarr;
              </a>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">

        {/* ── Core items (always visible) ─────────── */}
        <div className="space-y-0.5">
          {resolvedMainItems.map(item => (
            <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />
          ))}
        </div>

        {/* ── Sections: Advanced mode → flyout triggers, Expert → inline, Simple → hidden ── */}
        {(viewMode !== "simple" || isMobile) && (
          <>
            {FLYOUT_SECTIONS.map(section => (
              <div key={section.key}>
                <div className={`h-px bg-border/50 mx-2 ${isCompact ? "my-2" : "my-3"}`} />

                {/* Advanced mode (desktop): flyout trigger */}
                {viewMode === "advanced" && !isMobile ? (
                  (collapsed ? (
                    <button
                      ref={el => { flyoutRefs.current[section.key] = el; }}
                      onClick={() => toggleFlyout(section.key)}
                      className={`w-full flex justify-center py-1.5 group transition-colors ${activeFlyout === section.key ? "text-accent" : "text-muted/60 hover:text-muted"}`}
                    >
                      <section.icon size={16} />
                    </button>
                  ) : (
                    <button
                      ref={el => { flyoutRefs.current[section.key] = el; }}
                      onClick={() => toggleFlyout(section.key)}
                      className="w-full flex items-center justify-between px-3 py-1 group"
                    >
                      <div className={`flex items-center gap-1.5 ${activeFlyout === section.key ? "text-accent" : "text-muted/60"}`}>
                        <section.icon size={12} />
                        <span className={`text-[10px] uppercase tracking-wider font-semibold transition-colors ${
                          activeFlyout === section.key ? "text-accent" : "text-muted/60 group-hover:text-muted"
                        }`}>
                          {section.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-muted/40">{getFlatItems(section.key).length}</span>
                        <ChevronRight
                          size={12}
                          className={`transition-all duration-200 ${
                            activeFlyout === section.key ? "text-accent translate-x-0.5" : "text-muted/40"
                          }`}
                        />
                      </div>
                    </button>
                  ))
                ) : (
                  /* Expert mode or Mobile: inline expanded */
                  <>
                    {(isMobile || !collapsed) ? (
                      <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-muted/60 font-semibold flex items-center gap-1.5">
                        <section.icon size={12} />
                        {section.label}
                        {isCompact && (
                          <span className="text-[9px] text-muted/40 font-normal ml-auto">{getFlatItems(section.key).length}</span>
                        )}
                      </p>
                    ) : (
                      <div className="flex justify-center py-1 text-muted/60">
                        <section.icon size={16} />
                      </div>
                    )}
                    {renderInlineSection(section.key, isMobile)}
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── Separator ──────────────────────────── */}
        <div className={`h-px bg-border/50 mx-2 ${isCompact ? "my-2" : "my-3"}`} />

        {/* ── Intelligence (always visible) ──────── */}
        {(isMobile || !collapsed) && (
          <p className={`px-3 mb-1 text-[10px] uppercase tracking-wider text-muted/60 font-semibold`}>
            Intelligence
          </p>
        )}
        <div className="space-y-0.5">
          {intelligenceItems.map(item => (
            <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />
          ))}
        </div>

        {/* ── Separator ──────────────────────────── */}
        <div className={`h-px bg-border/50 mx-2 ${isCompact ? "my-2" : "my-3"}`} />

        {/* ── Tools (always visible) ─────────────── */}
        {(isMobile || !collapsed) && (
          <p className={`px-3 mb-1 text-[10px] uppercase tracking-wider text-muted/60 font-semibold`}>
            Tools
          </p>
        )}
        <div className="space-y-0.5">
          {resolvedToolItems.map(item => (
            <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />
          ))}
        </div>

        {/* ── Advanced Tools (Advanced + Expert) ─── */}
        {viewMode !== "simple" && (
          <>
            <div className={`h-px bg-border/50 mx-2 ${isCompact ? "my-2" : "my-3"}`} />
            {(isMobile || !collapsed) && (
              <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-accent/50 font-semibold">
                Advanced
              </p>
            )}
            <div className="space-y-0.5">
              {resolvedAdvancedItems.map(item => (
                <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />
              ))}
            </div>
          </>
        )}

        {/* ── Simple mode: "More" collapsible ────── */}
        {viewMode === "simple" && !isMobile && (
          <>
            <div className={`h-px bg-border/50 mx-2 my-3`} />
            {collapsed ? (
              <button
                onClick={() => {
                  const next = !moreOpen;
                  setMoreOpen(next);
                  localStorage.setItem("stargate-more-open", String(next));
                }}
                className="w-full flex justify-center py-1 group"
              >
                <MoreHorizontal size={16} className={`transition-colors ${moreOpen ? "text-accent" : "text-muted/60 group-hover:text-muted"}`} />
              </button>
            ) : (
              <button
                onClick={() => {
                  const next = !moreOpen;
                  setMoreOpen(next);
                  localStorage.setItem("stargate-more-open", String(next));
                }}
                className="w-full flex items-center justify-between px-3 py-1 group"
              >
                <div className="flex items-center gap-1.5">
                  <MoreHorizontal size={12} className="text-muted/60" />
                  <span className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold group-hover:text-muted transition-colors">
                    Other Tabs
                  </span>
                </div>
                <ChevronDown
                  size={12}
                  className={`text-muted/60 transition-transform duration-200 ${moreOpen ? "" : "-rotate-90"}`}
                />
              </button>
            )}
            {moreOpen && (
              <div className="space-y-0.5">
                {moreItems.map(item => (
                  <NavLink key={item.href} item={item} isMobile={false} />
                ))}
              </div>
            )}
          </>
        )}
      </nav>

      {/* ── Bottom: Mode pill + Settings + Logout ── */}
      <div className="border-t border-border py-2 px-2">
        <ModePill isMobile={isMobile} />

        {isOwner && (
          <NavLink item={{ href: "/dashboard/admin", label: "Admin", icon: Shield }} isMobile={isMobile} compact={isCompact} />
        )}
        {bottomItems.map(item => (
          <NavLink key={item.href} item={item} isMobile={isMobile} compact={isCompact} />
        ))}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full flex items-center gap-3 ${
            !isMobile && collapsed ? "justify-center px-2" : "px-3"
          } ${isCompact ? "py-1.5" : "py-2"} rounded-xl text-sm font-medium text-muted hover:text-loss hover:bg-loss/10 transition-all duration-200`}
          title={!isMobile && collapsed ? "Log Out" : undefined}
        >
          <LogOut size={isCompact ? 16 : 18} />
          {(isMobile || !collapsed) && <span>Log Out</span>}
        </button>
        {(isMobile || !collapsed) && (
          <p className="text-[10px] text-muted/40 text-center mt-2 pb-1">
            Stargate v0.1
          </p>
        )}
      </div>
    </>
  );

  /* ────────────────────────────────────────────────── */
  /*  Render                                            */
  /* ────────────────────────────────────────────────── */

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground transition-all"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-[70] w-72 glass border-r border-border/50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <div className={`hidden md:flex ${collapsed ? "w-[68px]" : "w-60"} shrink-0 relative transition-all duration-300`}>
        <aside
          className="w-full h-full overflow-y-hidden glass border-r border-border/50 flex flex-col z-10"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {sidebarContent(false)}
        </aside>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[52px] z-20 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent/30 transition-colors shadow-sm"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Flyout panels (Advanced mode, desktop only) */}
      {activeFlyout && flyoutRefs.current[activeFlyout] && (
        <SidebarFlyout
          triggerRef={{ current: flyoutRefs.current[activeFlyout] }}
          sidebarWidth={collapsed ? 68 : 240}
          onClose={() => setActiveFlyout(null)}
        >
          {renderFlyoutContent(activeFlyout)}
        </SidebarFlyout>
      )}

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="glass border border-border/50 rounded-2xl w-full max-w-sm p-6 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="w-12 h-12 rounded-full bg-loss/10 flex items-center justify-center mx-auto mb-4">
                <LogOut size={22} className="text-loss" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Log Out?</h3>
              <p className="text-sm text-muted mb-6">Are you sure you want to log out?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted bg-surface border border-border hover:text-foreground hover:bg-surface-hover transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    clearSubscriptionCache();
                    await supabase.auth.signOut();
                    router.push("/login");
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-loss hover:bg-loss/80 transition-all"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
