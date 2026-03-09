"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { SidebarRail } from "./sidebar-rail";
import { SidebarDrawer } from "./sidebar-drawer";
import { SidebarMobile } from "./sidebar-mobile";
import {
  NAV_SECTIONS,
  loadSectionState,
  saveSectionState,
  getResolvedCoreItems,
} from "./sidebar-data";
import { useTheme } from "@/lib/theme-context";
import { hasStockAccess, hasCommodityAccess, hasForexAccess } from "@/lib/addons";
import type { AssetContext } from "@/lib/addons";
import { createClient } from "@/lib/supabase/client";
import { clearSubscriptionCache } from "@/lib/use-subscription";
import { useSubscriptionContext } from "@/lib/subscription-context";
import { useI18n } from "@/lib/i18n";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { viewMode, setViewModeTo } = useTheme();
  const { isOwner: isOwnerFromContext } = useSubscriptionContext();

  /* ── State ─────────────────────────────────────── */
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assetContext, setAssetContext] = useState<AssetContext>("crypto");
  const [showStockUpgrade, setShowStockUpgrade] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({});
  const [isOwner, setIsOwner] = useState(isOwnerFromContext);

  /* ── Owner detection: context → cookie → client-side auth ── */
  useEffect(() => {
    if (isOwnerFromContext) { setIsOwner(true); return; }
    // Cookie is httpOnly now — skip cookie check, go to client-side auth fallback
    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
    if (!ownerEmail) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { email?: string } | null } }) => {
      if (user?.email?.toLowerCase() === ownerEmail.toLowerCase()) {
        setIsOwner(true);
      }
    });
  }, [isOwnerFromContext]);

  /* ── Tour integration ──────────────────────────── */
  const tourSavedCategory = useRef<string | null>(null);
  const tourSavedSections = useRef<Record<string, boolean> | null>(null);

  useEffect(() => {
    function handleTourSidebar(e: Event) {
      const { expand, category, force } = (e as CustomEvent).detail;
      if (expand) {
        if (tourSavedCategory.current === null) {
          // Save original state — use "" sentinel for "no drawer open"
          // so null remains the "not yet saved" indicator
          tourSavedCategory.current = activeCategory ?? "";
        }
        // Open the relevant category drawer for the tour
        setActiveCategory(category || "journal");
      } else if (force) {
        // Force close — save state first if needed, then close regardless
        if (tourSavedCategory.current === null) {
          tourSavedCategory.current = activeCategory ?? "";
        }
        setActiveCategory(null);
      } else if (tourSavedCategory.current !== null) {
        setActiveCategory(tourSavedCategory.current === "" ? null : tourSavedCategory.current);
        tourSavedCategory.current = null;
      }
    }
    function handleSectionsExpand() {
      if (tourSavedSections.current === null) {
        tourSavedSections.current = { ...sectionState };
      }
      const allOpen: Record<string, boolean> = {};
      NAV_SECTIONS.forEach(s => {
        allOpen[s.key] = true;
        s.subSections?.forEach(sub => { allOpen[sub.key] = true; });
      });
      setSectionState(allOpen);
    }
    function handleSectionsRestore() {
      if (tourSavedSections.current !== null) {
        setSectionState(tourSavedSections.current);
        tourSavedSections.current = null;
      }
    }
    window.addEventListener("tour-sidebar", handleTourSidebar as EventListener);
    window.addEventListener("tour-sections-expand", handleSectionsExpand);
    window.addEventListener("tour-sections-restore", handleSectionsRestore);
    return () => {
      window.removeEventListener("tour-sidebar", handleTourSidebar as EventListener);
      window.removeEventListener("tour-sections-expand", handleSectionsExpand);
      window.removeEventListener("tour-sections-restore", handleSectionsRestore);
    };
  }, [sectionState, activeCategory]);

  /* ── Asset context ─────────────────────────────── */
  function handleAssetToggle(context: AssetContext) {
    if (context === "stocks" && !hasStockAccess()) {
      setShowStockUpgrade(true);
      return;
    }
    if (context === "commodities" && !hasCommodityAccess()) {
      setShowStockUpgrade(true);
      return;
    }
    if (context === "forex" && !hasForexAccess()) {
      setShowStockUpgrade(true);
      return;
    }
    setShowStockUpgrade(false);
    setAssetContext(context);
    localStorage.setItem("stargate-asset-context", context);

    // Navigate to the new asset's dashboard
    const dashboardMap: Record<AssetContext, string> = {
      crypto: "/dashboard",
      stocks: "/dashboard/stocks",
      commodities: "/dashboard/commodities",
      forex: "/dashboard/forex",
    };
    router.push(dashboardMap[context]);
  }

  /* ── Init from localStorage ────────────────────── */
  useEffect(() => {
    const savedContext = localStorage.getItem("stargate-asset-context") as AssetContext | null;
    if (savedContext === "stocks" && hasStockAccess()) {
      setAssetContext("stocks");
    } else if (savedContext === "commodities" && hasCommodityAccess()) {
      setAssetContext("commodities");
    } else if (savedContext === "forex" && hasForexAccess()) {
      setAssetContext("forex");
    } else {
      setAssetContext("crypto");
    }
    setSectionState(loadSectionState());
  }, []);

  /* ── Close mobile drawer on navigation (desktop drawer stays open) ── */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* ── Close drawer on Escape ────────────────────── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && activeCategory) {
        setActiveCategory(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCategory]);

  /* ── Section toggle ────────────────────────────── */
  const toggleSection = useCallback((key: string) => {
    setSectionState(prev => {
      const next = { ...prev, [key]: !(prev[key] ?? true) };
      saveSectionState(next);
      return next;
    });
  }, []);

  /* ── Rail click handlers ───────────────────────── */
  function handleCategoryClick(key: string) {
    setActiveCategory(prev => prev === key ? null : key);
  }

  function handleDirectNav(href: string) {
    // For Home: resolve based on asset context
    const resolvedItems = getResolvedCoreItems(assetContext);
    const homeItem = resolvedItems[0];
    router.push(homeItem?.href ?? href);
    setActiveCategory(null);
  }

  return (
    <>
      {/* Mobile */}
      <SidebarMobile
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        assetContext={assetContext}
        onAssetToggle={handleAssetToggle}
        showStockUpgrade={showStockUpgrade}
        sectionState={sectionState}
        onToggleSection={toggleSection}
        viewMode={viewMode}
        setViewModeTo={setViewModeTo}
        isOwner={isOwner}
        onLogout={() => setShowLogoutConfirm(true)}
      />

      {/* Desktop Rail */}
      <SidebarRail
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        onDirectNav={handleDirectNav}
        onCloseDrawer={() => setActiveCategory(null)}
        onLogout={() => setShowLogoutConfirm(true)}
        isOwner={isOwner}
        assetContext={assetContext}
        onAssetToggle={handleAssetToggle}
      />

      {/* Desktop Drawer */}
      <AnimatePresence mode="wait">
        {activeCategory && (
          <SidebarDrawer
            key={activeCategory}
            categoryKey={activeCategory}
            onClose={() => setActiveCategory(null)}
            assetContext={assetContext}
            onAssetToggle={handleAssetToggle}
            showStockUpgrade={showStockUpgrade}
            sectionState={sectionState}
            onToggleSection={toggleSection}
            viewMode={viewMode}
            setViewModeTo={setViewModeTo}
          />
        )}
      </AnimatePresence>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="glass border border-border/50 rounded-2xl w-full max-w-sm p-6 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="w-12 h-12 rounded-full bg-loss/10 flex items-center justify-center mx-auto mb-4">
                <LogOut size={22} className="text-loss" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("sidebar.logOutConfirmTitle")}</h3>
              <p className="text-sm text-muted mb-6">{t("sidebar.logOutConfirmMsg")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted bg-surface border border-border hover:text-foreground hover:bg-surface-hover transition-all"
                >
                  {t("common.cancel")}
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
                  {t("common.logOut")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
