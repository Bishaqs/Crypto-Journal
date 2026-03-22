"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Bitcoin,
  LineChart,
  Gem,
  ArrowLeftRight,
  Lock,
  LogOut,
  Shield,
  MoreHorizontal,
} from "lucide-react";
import { TraverseLogo } from "../traverse-logo";
import { QuickActionMenu } from "../quick-action-fab";
import {
  type NavItem,
  type NavSection,
  NAV_SECTIONS,
  LABEL_KEY,
  SECTION_KEY,
  bottomItems,
  isActivePath,
  resolveItems,
  getResolvedCoreItems,
} from "./sidebar-data";
import { useI18n } from "@/lib/i18n";
import type { AssetContext } from "@/lib/addons";
import type { ViewMode } from "@/lib/theme-context";

interface SidebarMobileProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  assetContext: AssetContext;
  onAssetToggle: (ctx: AssetContext) => void;
  showStockUpgrade: boolean;
  sectionState: Record<string, boolean>;
  onToggleSection: (key: string) => void;
  viewMode: ViewMode;
  setViewModeTo: (mode: ViewMode) => void;
  isOwner: boolean;
  onLogout: () => void;
}

export function SidebarMobile({
  mobileOpen,
  setMobileOpen,
  assetContext,
  onAssetToggle,
  showStockUpgrade,
  sectionState,
  onToggleSection,
  viewMode,
  setViewModeTo,
  isOwner,
  onLogout,
}: SidebarMobileProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const { t } = useI18n();
  const isBeginner = viewMode === "beginner";
  const isAdvanced = viewMode === "advanced";
  const isSectionOpen = (key: string) => sectionState[key] ?? true;
  const allCoreItems = getResolvedCoreItems(assetContext);
  // Mobile core items: Journal (home), Trade Log + key items based on mode
  const resolvedCoreItems = isBeginner
    ? [
        { href: "/dashboard", label: "Journal", icon: allCoreItems[2]?.icon ?? allCoreItems[0]?.icon },
        allCoreItems[1], // Trade Log
      ].filter(Boolean) as NavItem[]
    : [
        { href: "/dashboard", label: "Journal", icon: allCoreItems[2]?.icon ?? allCoreItems[0]?.icon },
        allCoreItems[1], // Trade Log
        allCoreItems[3], // Calendar
        allCoreItems[6], // Import/Export
      ].filter(Boolean) as NavItem[];

  function getResolvedItems(items: NavItem[]): NavItem[] {
    return resolveItems(items, assetContext);
  }

  /* ── NavLink ─────────────────────────────────── */
  function NavLink({ item, indent }: { item: NavItem; indent?: boolean }) {
    const active = isActivePath(pathname, item.href, search);
    const label = LABEL_KEY[item.label] ? t(LABEL_KEY[item.label]) : item.label;
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 ${indent ? "px-3 pl-7" : "px-3"} py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? "text-accent bg-accent/10 shadow-[0_0_12px_rgba(0,180,216,0.15)]"
            : "text-muted hover:text-foreground hover:bg-surface-hover"
        }`}
      >
        <item.icon size={18} />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  /* ── Section header ──────────────────────────── */
  function SectionHeader({ section, count }: { section: NavSection; count: number }) {
    const open = isSectionOpen(section.key);
    const displayLabel = SECTION_KEY[section.label] ? t(SECTION_KEY[section.label]) : section.label;
    return (
      <button
        onClick={() => onToggleSection(section.key)}
        className="w-full flex items-center justify-between px-3 py-1.5 group"
      >
        <div className="flex items-center gap-1.5 text-muted/60">
          <section.icon size={12} />
          <span className="text-[10px] uppercase tracking-wider font-semibold group-hover:text-muted transition-colors">
            {displayLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted/40">{count}</span>
          <ChevronDown
            size={12}
            className={`text-muted/40 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
          />
        </div>
      </button>
    );
  }

  /* ── Sub-section header ──────────────────────── */
  function SubSectionHeader({ sectionKey, label }: { sectionKey: string; label: string }) {
    const open = isSectionOpen(sectionKey);
    const displayLabel = SECTION_KEY[label] ? t(SECTION_KEY[label]) : label;
    return (
      <button
        onClick={() => onToggleSection(sectionKey)}
        className="w-full flex items-center justify-between px-3 pl-5 py-1 group"
      >
        <span className="text-[10px] uppercase tracking-wider text-muted/50 font-semibold group-hover:text-muted/70 transition-colors">
          {displayLabel}
        </span>
        <ChevronDown
          size={10}
          className={`text-muted/30 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>
    );
  }

  /* ── Render section ──────────────────────────── */
  function renderSection(section: NavSection) {
    if (isBeginner && !section.visibleInBeginner) return null;
    if (isAdvanced && !section.visibleInSimple) return null;

    const items = isBeginner && section.beginnerItems
      ? getResolvedItems(section.beginnerItems)
      : isAdvanced && section.simpleItems
      ? getResolvedItems(section.simpleItems)
      : getResolvedItems(section.items);

    if (items.length === 0 && !section.subSections?.length) return null;

    const totalCount = items.length + (section.subSections?.reduce((s, sub) => s + getResolvedItems(sub.items).length, 0) ?? 0);
    const open = isSectionOpen(section.key);

    return (
      <div key={section.key}>
        <div className="h-px bg-border/50 mx-2 my-3" />
        <SectionHeader section={section} count={totalCount} />
        {open && (
          <div className="space-y-0.5">
            {items.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
            {!isAdvanced && section.subSections?.map(sub => {
              const subItems = getResolvedItems(sub.items);
              if (subItems.length === 0) return null;
              const subOpen = isSectionOpen(sub.key);
              return (
                <div key={sub.key}>
                  <SubSectionHeader sectionKey={sub.key} label={sub.label} />
                  {subOpen && (
                    <div className="space-y-0.5">
                      {subItems.map(item => (
                        <NavLink key={item.href} item={item} indent />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── "Other" section for simple mode ───────────── */
  function renderOtherSection() {
    if (isBeginner) return null;
    if (!isAdvanced) return null;

    const otherItems: NavItem[] = [];
    for (const section of NAV_SECTIONS) {
      if (!section.visibleInSimple) {
        otherItems.push(...getResolvedItems(section.items));
        section.subSections?.forEach(sub => {
          otherItems.push(...getResolvedItems(sub.items));
        });
      } else if (section.simpleItems) {
        const simpleHrefs = new Set(section.simpleItems.map(i => i.href));
        const extras = section.items.filter(i => !simpleHrefs.has(i.href));
        otherItems.push(...getResolvedItems(extras));
      }
    }

    if (otherItems.length === 0) return null;

    const open = isSectionOpen("other");

    return (
      <div>
        <div className="h-px bg-border/50 mx-2 my-3" />
        <button
          onClick={() => onToggleSection("other")}
          className="w-full flex items-center justify-between px-3 py-1.5 group"
        >
          <div className="flex items-center gap-1.5 text-muted/60">
            <MoreHorizontal size={12} />
            <span className="text-[10px] uppercase tracking-wider font-semibold group-hover:text-muted transition-colors">
              Other
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted/40">{otherItems.length}</span>
            <ChevronDown
              size={12}
              className={`text-muted/40 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
            />
          </div>
        </button>
        {open && (
          <div className="space-y-0.5">
            {otherItems.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground transition-all"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-[70] w-72 glass border-r border-border/50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Logo + close */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-visible" onClick={() => setMobileOpen(false)}>
            <TraverseLogo size={32} collapsed={false} />
            <h1 className="text-lg font-bold tracking-tight whitespace-nowrap bg-gradient-to-r from-accent via-[#48CAE4] to-accent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite] bg-clip-text text-transparent">
              Traverse
            </h1>
          </Link>
          <div className="flex items-center gap-1.5">
            <QuickActionMenu />
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Asset toggle — 2x2 grid */}
        <div className="px-3 pt-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-background border border-border/50 p-1 w-full">
            {([
              { ctx: "crypto" as const, label: t("sidebar.cryptoLabel"), icon: Bitcoin },
              { ctx: "stocks" as const, label: t("sidebar.stocksLabel"), icon: LineChart },
              { ctx: "commodities" as const, label: t("sidebar.commoditiesLabel"), icon: Gem },
              { ctx: "forex" as const, label: t("sidebar.forexLabel"), icon: ArrowLeftRight },
            ]).map(({ ctx, label, icon: Icon }) => {
              const comingSoon = ctx !== "crypto";
              return (
                <button
                  key={ctx}
                  onClick={comingSoon ? undefined : () => onAssetToggle(ctx)}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    assetContext === ctx
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : comingSoon
                        ? "text-muted/50 border border-transparent cursor-not-allowed opacity-50"
                        : "text-muted hover:text-foreground border border-transparent"
                  }`}
                >
                  <Icon size={11} />
                  <span>{label}</span>
                  {comingSoon && <span className="text-[8px] text-muted/70 ml-0.5">Soon</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-0.5">
            {resolvedCoreItems.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
          {NAV_SECTIONS.map(section => renderSection(section))}
          {renderOtherSection()}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border py-2 px-2">
          {/* Mode toggle removed — accessible in Settings only */}

          {isOwner && (
            <NavLink item={{ href: "/dashboard/admin", label: "Admin", icon: Shield }} />
          )}
          {bottomItems.map(item => (
            <NavLink key={item.href} item={item} />
          ))}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-loss hover:bg-loss/10 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>{t("common.logOut")}</span>
          </button>
          <p className="text-[10px] text-muted/40 text-center mt-2 pb-1">
            {t("common.version")}
          </p>
        </div>
      </aside>
    </>
  );
}
