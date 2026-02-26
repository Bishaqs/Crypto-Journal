"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  ToggleLeft,
  ToggleRight,
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
  Percent,
  Shield,
  PieChart,
  Activity,
  Tag,
  Layers,
  Hash,
  BarChart,
  DollarSign,
  TreePine,
} from "lucide-react";
import { StargateLogo } from "./stargate-logo";
import { useTheme } from "@/lib/theme-context";
import { hasStockAccess } from "@/lib/addons";
import { createClient } from "@/lib/supabase/client";
import { clearSubscriptionCache } from "@/lib/use-subscription";
import { useSubscriptionContext } from "@/lib/subscription-context";

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
  { href: "/dashboard/funding-rates", label: "Funding Rates", icon: Percent },
  { href: "/dashboard/prop-firm", label: "Prop Firm", icon: Flame },
  { href: "/dashboard/heatmaps", label: "Heat Maps", icon: Grid3X3 },
  { href: "/dashboard/risk-analysis", label: "Risk Analysis", icon: TrendingDown },
  { href: "/dashboard/execution", label: "Execution", icon: Crosshair },
  { href: "/dashboard/rules", label: "Rule Tracker", icon: ShieldAlert },
  { href: "/dashboard/simulations", label: "Simulations", icon: Dices },
  { href: "/dashboard/taxes", label: "Tax Reports", icon: Receipt },
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

const summaryItems: NavItem[] = [
  { href: "/dashboard/summaries/accounts", label: "Accounts Statistics", icon: BarChart3 },
  { href: "/dashboard/summaries/tags", label: "Tag Groups Statistics", icon: BarChart3 },
  { href: "/dashboard/summaries/open-trades", label: "Open Trades Summary", icon: BarChart3 },
];

const bottomItems: NavItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assetContext, setAssetContext] = useState<"crypto" | "stocks">("crypto");
  const [showStockUpgrade, setShowStockUpgrade] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [summariesOpen, setSummariesOpen] = useState(true);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [treemapOpen, setTreemapOpen] = useState(true);
  const { isOwner } = useSubscriptionContext();
  const { viewMode, toggleViewMode } = useTheme();

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
    const savedSummaries = localStorage.getItem("stargate-summaries-open");
    if (savedSummaries === "false") setSummariesOpen(false);
    const savedAnalysis = localStorage.getItem("stargate-trades-analysis-open");
    if (savedAnalysis === "false") setAnalysisOpen(false);
    const savedTreemap = localStorage.getItem("stargate-treemap-open");
    if (savedTreemap === "false") setTreemapOpen(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("stargate-sidebar", collapsed ? "collapsed" : "open");
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  function NavLink({ item, isMobile }: { item: NavItem; isMobile: boolean }) {
    const tourId = item.tourId ?? `tour-${item.href.replace("/dashboard/", "").replace("/dashboard", "home") || "home"}`;
    return (
      <Link
        id={!isMobile ? tourId : undefined}
        href={item.href}
        title={!isMobile && collapsed ? item.label : undefined}
        className={`flex items-center gap-3 ${
          !isMobile && collapsed ? "justify-center px-2" : "px-3"
        } py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive(item.href)
            ? "text-accent bg-accent/10 shadow-[0_0_12px_rgba(0,180,216,0.15)]"
            : "text-muted hover:text-foreground hover:bg-surface-hover"
        }`}
      >
        <item.icon size={18} />
        {(isMobile || !collapsed) && (
          <span className="truncate">{item.label}</span>
        )}
      </Link>
    );
  }

  // Compute nav items based on asset context
  const resolvedMainItems: NavItem[] = assetContext === "stocks"
    ? mainItems.map((item, i) => {
        if (i === 0) return { ...item, href: "/dashboard/stocks", label: "Dashboard" };
        if (i === 1) return { ...item, href: "/dashboard/stocks/trades", label: "Positions" };
        if (i === 4) return { ...item, href: "/dashboard/stocks/analytics", label: "Analytics" };
        if (i === 5) return { ...item, href: "/dashboard/stocks/plans", label: "Watchlist" };
        return item;
      })
    : mainItems;

  // In stocks mode: reroute Market Overview, hide crypto-only tools
  const resolvedToolItems = assetContext === "stocks"
    ? toolItems
        .filter(item => !["/dashboard/dca"].includes(item.href))
        .map(item => item.href === "/dashboard/market" ? { ...item, href: "/dashboard/stocks/market" } : item)
    : toolItems;

  const resolvedAdvancedItems = assetContext === "stocks"
    ? advancedToolItems.filter(item => !["/dashboard/prop-firm", "/dashboard/simulations", "/dashboard/screener", "/dashboard/funding-rates"].includes(item.href))
    : advancedToolItems;

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
              <a
                href="/dashboard/settings"
                className="text-[10px] font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                Upgrade now &rarr;
              </a>
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[52px] z-10 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent/30 transition-colors shadow-sm"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {resolvedMainItems.map((item) => (
            <NavLink key={item.href} item={item} isMobile={isMobile} />
          ))}
        </div>

        {/* Separator */}
        <div className="h-px bg-border/50 mx-2 my-3" />

        {/* Intelligence section */}
        {(isMobile || !collapsed) && (
          <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
            Intelligence
          </p>
        )}
        <div className="space-y-0.5">
          {intelligenceItems.map((item) => (
            <NavLink key={item.href} item={item} isMobile={isMobile} />
          ))}
        </div>

        {/* Separator */}
        <div className="h-px bg-border/50 mx-2 my-3" />

        {/* Tools section */}
        {(isMobile || !collapsed) && (
          <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
            Tools
          </p>
        )}
        <div className="space-y-0.5">
          {resolvedToolItems.map((item) => (
            <NavLink key={item.href} item={item} isMobile={isMobile} />
          ))}
        </div>

        {/* Summaries section — collapsible */}
        <div className="h-px bg-border/50 mx-2 my-3" />
        {(isMobile || !collapsed) ? (
          <button
            onClick={() => {
              const next = !summariesOpen;
              setSummariesOpen(next);
              localStorage.setItem("stargate-summaries-open", String(next));
            }}
            className="w-full flex items-center justify-between px-3 mb-1 group"
          >
            <div className="flex items-center gap-1.5">
              <PieChart size={12} className="text-muted/60" />
              <span className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold group-hover:text-muted transition-colors">
                Summaries
              </span>
            </div>
            <ChevronDown
              size={12}
              className={`text-muted/60 transition-transform duration-200 ${summariesOpen ? "" : "-rotate-90"}`}
            />
          </button>
        ) : (
          <div className="flex justify-center py-1">
            <PieChart size={16} className="text-muted/60" />
          </div>
        )}
        {summariesOpen && (
          <div className="space-y-0.5">
            {summaryItems.map((item) => (
              <NavLink key={item.href} item={item} isMobile={isMobile} />
            ))}
          </div>
        )}

        {/* Trades Analysis section — collapsible */}
        <div className="h-px bg-border/50 mx-2 my-3" />
        {(isMobile || !collapsed) ? (
          <button
            onClick={() => {
              const next = !analysisOpen;
              setAnalysisOpen(next);
              localStorage.setItem("stargate-trades-analysis-open", String(next));
            }}
            className="w-full flex items-center justify-between px-3 mb-1 group"
          >
            <div className="flex items-center gap-1.5">
              <BarChart3 size={12} className="text-muted/60" />
              <span className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold group-hover:text-muted transition-colors">
                Trades Analysis
              </span>
            </div>
            <ChevronDown
              size={12}
              className={`text-muted/60 transition-transform duration-200 ${analysisOpen ? "" : "-rotate-90"}`}
            />
          </button>
        ) : (
          <div className="flex justify-center py-1">
            <BarChart3 size={16} className="text-muted/60" />
          </div>
        )}
        {analysisOpen && (
          <div className="space-y-0.5">
            {analysisItems.map((item) => (
              <NavLink key={item.href} item={item} isMobile={isMobile} />
            ))}

            {/* Treemap Charts — nested collapsible */}
            {(isMobile || !collapsed) ? (
              <button
                onClick={() => {
                  const next = !treemapOpen;
                  setTreemapOpen(next);
                  localStorage.setItem("stargate-treemap-open", String(next));
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 group"
              >
                <div className="flex items-center gap-1.5">
                  <TreePine size={11} className="text-muted/50" />
                  <span className="text-[10px] uppercase tracking-wider text-muted/50 font-semibold group-hover:text-muted transition-colors">
                    Treemap Charts
                  </span>
                </div>
                <ChevronDown
                  size={10}
                  className={`text-muted/50 transition-transform duration-200 ${treemapOpen ? "" : "-rotate-90"}`}
                />
              </button>
            ) : null}
            {treemapOpen && (
              <div className="space-y-0.5 pl-2">
                {treemapItems.map((item) => (
                  <NavLink key={item.href} item={item} isMobile={isMobile} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Advanced Tools — only in advanced mode */}
        {viewMode === "advanced" && (
          <>
            <div className="h-px bg-border/50 mx-2 my-3" />
            {(isMobile || !collapsed) && (
              <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-accent/50 font-semibold">
                Advanced
              </p>
            )}
            <div className="space-y-0.5">
              {resolvedAdvancedItems.map((item) => (
                <NavLink key={item.href} item={item} isMobile={isMobile} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Bottom items */}
      <div className="border-t border-border py-2 px-2">
        {/* View mode toggle — prominent */}
        <button
          id={!isMobile ? "tour-view-toggle" : undefined}
          onClick={toggleViewMode}
          className={`w-full flex items-center gap-3 ${
            !isMobile && collapsed ? "justify-center px-2" : "px-3"
          } py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 mb-1 ${
            viewMode === "advanced"
              ? "bg-accent/10 text-accent border border-accent/20 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
              : "text-muted hover:text-foreground hover:bg-surface-hover border border-transparent"
          }`}
          title={!isMobile && collapsed ? (viewMode === "simple" ? "Simple Mode" : "Advanced Mode") : undefined}
        >
          {viewMode === "simple" ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
          {(isMobile || !collapsed) && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">{viewMode === "simple" ? "Simple" : "Advanced"}</span>
              {viewMode === "advanced" && (
                <span className="text-[10px] font-normal text-accent/60 ml-1">{resolvedToolItems.length + resolvedAdvancedItems.length + intelligenceItems.length} tools</span>
              )}
            </div>
          )}
        </button>
        {isOwner && (
          <NavLink item={{ href: "/dashboard/admin", label: "Admin", icon: Shield }} isMobile={isMobile} />
        )}
        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} isMobile={isMobile} />
        ))}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full flex items-center gap-3 ${
            !isMobile && collapsed ? "justify-center px-2" : "px-3"
          } py-2 rounded-xl text-sm font-medium text-muted hover:text-loss hover:bg-loss/10 transition-all duration-200`}
          title={!isMobile && collapsed ? "Log Out" : undefined}
        >
          <LogOut size={18} />
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
      <aside
        className={`hidden md:flex ${
          collapsed ? "w-[68px]" : "w-60"
        } h-full overflow-hidden glass border-r border-border/50 flex-col shrink-0 transition-all duration-300 relative z-10`}
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {sidebarContent(false)}
      </aside>

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
