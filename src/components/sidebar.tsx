"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { StargateLogo } from "./stargate-logo";
import { useTheme } from "@/lib/theme-context";
import type { UserAddons } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const mainItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/trades", label: "Trade Log", icon: Table2 },
  { href: "/dashboard/journal", label: "Journal", icon: BookOpen },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/plans", label: "Trade Plans", icon: ClipboardList },
];

const intelligenceItems: NavItem[] = [
  { href: "/dashboard/insights", label: "Insights", icon: Brain },
  { href: "/dashboard/ai", label: "AI Coach", icon: Sparkles },
  { href: "/dashboard/reports", label: "Weekly Reports", icon: FileBarChart },
];

const toolItems: NavItem[] = [
  { href: "/dashboard/playbook", label: "Playbook", icon: BookMarked },
  { href: "/dashboard/risk", label: "Risk Calculator", icon: Calculator },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
];

const advancedToolItems: NavItem[] = [
  { href: "/dashboard/prop-firm", label: "Prop Firm", icon: Flame },
  { href: "/dashboard/heatmaps", label: "Heat Maps", icon: Grid3X3 },
  { href: "/dashboard/risk-analysis", label: "Risk Analysis", icon: TrendingDown },
  { href: "/dashboard/execution", label: "Execution", icon: Crosshair },
  { href: "/dashboard/rules", label: "Rule Tracker", icon: ShieldAlert },
  { href: "/dashboard/simulations", label: "Simulations", icon: Dices },
  { href: "/dashboard/taxes", label: "Tax Reports", icon: Receipt },
];

const bottomItems: NavItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assetContext, setAssetContext] = useState<"crypto" | "stocks">("crypto");
  const [showStockUpgrade, setShowStockUpgrade] = useState(false);
  const { viewMode, toggleViewMode } = useTheme();

  // Check if user has stocks addon or Max tier
  function hasStocksAccess(): boolean {
    // Demo mode: always grant access
    if (typeof document !== "undefined" && document.cookie.includes("stargate-demo=true")) return true;
    try {
      const addonsRaw = localStorage.getItem("stargate-addons");
      if (addonsRaw) {
        const addons: UserAddons = JSON.parse(addonsRaw);
        if (addons.stocks) return true;
      }
      // Also check if user has Max tier (which includes stocks)
      const tier = localStorage.getItem("stargate-tier");
      return tier === "max";
    } catch {
      return false;
    }
  }

  function handleAssetToggle(context: "crypto" | "stocks") {
    if (context === "stocks" && !hasStocksAccess()) {
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
      // Only restore stocks if user still has access
      if (savedContext === "stocks") {
        const isDemo = typeof document !== "undefined" && document.cookie.includes("stargate-demo=true");
        if (isDemo) {
          setAssetContext("stocks");
        } else {
          try {
            const addonsRaw = localStorage.getItem("stargate-addons");
            const addons: UserAddons = addonsRaw ? JSON.parse(addonsRaw) : { stocks: false };
            const tier = localStorage.getItem("stargate-tier");
            if (addons.stocks || tier === "max") setAssetContext("stocks");
          } catch { /* fallback to crypto */ }
        }
      } else {
        setAssetContext(savedContext);
      }
    }
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
    return (
      <Link
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
        if (i === 1) return { ...item, href: "/dashboard/stocks/trades", label: "Trade Log" };
        if (i === 4) return { ...item, href: "/dashboard/stocks/analytics", label: "Analytics" };
        return item;
      })
    : mainItems;

  // Hide crypto-specific advanced tools in stocks mode
  const resolvedAdvancedItems = assetContext === "stocks"
    ? advancedToolItems.filter(item => !["/dashboard/prop-firm", "/dashboard/simulations"].includes(item.href))
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
              {hasStocksAccess() ? <BarChart3 size={12} /> : <Lock size={10} />}
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
          {toolItems.map((item) => (
            <NavLink key={item.href} item={item} isMobile={isMobile} />
          ))}
        </div>

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
                <span className="text-[10px] font-normal text-accent/60 ml-1">12 tools</span>
              )}
            </div>
          )}
        </button>
        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} isMobile={isMobile} />
        ))}
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
        } glass border-r border-border/50 flex-col shrink-0 transition-all duration-300 relative z-10`}
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}
