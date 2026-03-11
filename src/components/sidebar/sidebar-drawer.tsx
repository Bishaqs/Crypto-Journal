"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Bitcoin, LineChart, Gem, ArrowLeftRight, Lock, X, MoreHorizontal } from "lucide-react";
import {
  type NavItem,
  type NavSection,
  type RailCategory,
  RAIL_CATEGORIES,
  LABEL_KEY,
  SECTION_KEY,
  isActivePath,
  resolveItems,
  saveSectionState,
} from "./sidebar-data";
import { useI18n } from "@/lib/i18n";
import type { AssetContext } from "@/lib/addons";
import type { ViewMode } from "@/lib/theme-context";

interface SidebarDrawerProps {
  categoryKey: string;
  onClose: () => void;
  assetContext: AssetContext;
  onAssetToggle: (ctx: AssetContext) => void;
  showStockUpgrade: boolean;
  sectionState: Record<string, boolean>;
  onToggleSection: (key: string) => void;
  viewMode: ViewMode;
  setViewModeTo: (mode: ViewMode) => void;
}

export function SidebarDrawer({
  categoryKey,
  onClose,
  assetContext,
  onAssetToggle,
  showStockUpgrade,
  sectionState,
  onToggleSection,
  viewMode,
  setViewModeTo,
}: SidebarDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const { t } = useI18n();

  const foundCategory = RAIL_CATEGORIES.find(c => c.key === categoryKey);
  if (!foundCategory) return null;

  // Non-nullable reference for use in nested functions
  const category: RailCategory = foundCategory;

  const isSimple = viewMode === "simple";
  const isSectionOpen = (key: string) => sectionState[key] ?? true;

  const hasSections = category.sections && category.sections.length > 0;

  /* ── Resolve items for current asset context ──── */
  function getResolvedItems(items: NavItem[]): NavItem[] {
    return resolveItems(items, assetContext);
  }

  function getResolvedCategoryItems(): NavItem[] {
    const catItems = category.items;
    const prefix = assetContext === "crypto" ? "" : `/dashboard/${assetContext}`;

    if (categoryKey === "journal") {
      if (assetContext !== "crypto") {
        return catItems.map(item => {
          if (item.href === "/dashboard/trades") return { ...item, href: `${prefix}/trades`, label: "Positions" };
          if (item.href === "/dashboard/plans") return { ...item, href: `${prefix}/plans`, label: "Watchlist" };
          return item;
        });
      }
      return catItems;
    }
    if (categoryKey === "analytics") {
      if (assetContext !== "crypto") {
        return catItems.map(item => {
          if (item.href === "/dashboard/analytics") return { ...item, href: `${prefix}/analytics` };
          return item;
        });
      }
      return catItems;
    }
    return getResolvedItems(catItems);
  }

  /* ── NavLink ─────────────────────────────────── */
  function NavLink({ item, indent }: { item: NavItem; indent?: boolean }) {
    const active = isActivePath(pathname, item.href, search);
    const label = LABEL_KEY[item.label] ? t(LABEL_KEY[item.label]) : item.label;
    return (
      <Link
        id={item.tourId}
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
  function DrawerSectionHeader({ section, count }: { section: NavSection; count: number }) {
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

  /* ── Render a section ────────────────────────── */
  function renderSection(section: NavSection) {
    if (isSimple && !section.visibleInSimple) return null;

    const items = isSimple && section.simpleItems
      ? getResolvedItems(section.simpleItems)
      : getResolvedItems(section.items);

    if (items.length === 0 && !section.subSections?.length) return null;

    const totalCount = items.length + (section.subSections?.reduce((s, sub) => s + getResolvedItems(sub.items).length, 0) ?? 0);
    const open = isSectionOpen(section.key);

    return (
      <div key={section.key}>
        <div className="h-px bg-border/50 mx-2 my-2" />
        <DrawerSectionHeader section={section} count={totalCount} />
        {open && (
          <div className="space-y-0.5">
            {items.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
            {!isSimple && section.subSections?.map(sub => {
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
    if (!isSimple || !category.sections) return null;

    const otherItems: NavItem[] = [];
    for (const section of category.sections) {
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
        <div className="h-px bg-border/50 mx-2 my-2" />
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

  /* ── Drawer content ──────────────────────────── */
  const resolvedItems = getResolvedCategoryItems();
  const categoryLabel = SECTION_KEY[category.label] ? t(SECTION_KEY[category.label]) : category.label;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="hidden md:block fixed inset-0 z-30 bg-black/30"
        style={{ left: 68 }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <motion.aside
        id="tour-drawer-panel"
        initial={{ x: -280 }}
        animate={{ x: 0, transition: { type: "spring", damping: 35, stiffness: 400 } }}
        exit={{ x: -280, transition: { type: "tween", duration: 0.15, ease: "easeIn" } }}
        className="hidden md:flex fixed top-0 bottom-0 z-40 w-[280px] glass border-r border-border/50 flex-col"
        style={{ left: 68, boxShadow: "var(--shadow-card)" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">{categoryLabel}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Asset toggle — 2x2 grid */}
        <div className="px-3 pt-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-background border border-border/50 p-1 w-full">
            {([
              { ctx: "crypto" as const, label: t("sidebar.cryptoLabel"), icon: Bitcoin },
              { ctx: "stocks" as const, label: t("sidebar.stocksLabel"), icon: LineChart },
              { ctx: "commodities" as const, label: t("sidebar.commoditiesLabel"), icon: Gem },
              { ctx: "forex" as const, label: t("sidebar.forexLabel"), icon: ArrowLeftRight },
            ]).map(({ ctx, label, icon: Icon }) => (
              <button
                key={ctx}
                onClick={() => onAssetToggle(ctx)}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  assetContext === ctx
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-muted hover:text-foreground border border-transparent"
                }`}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>
          {showStockUpgrade && (
            <div className="mt-2 p-2.5 rounded-lg bg-accent/5 border border-accent/20 text-center">
              <p className="text-[10px] text-muted mb-1.5">{t("sidebar.stockUpgradeMsg")}</p>
              <a href="/dashboard/settings" className="text-[10px] font-semibold text-accent hover:text-accent-hover transition-colors">
                {t("sidebar.upgradeNow")} &rarr;
              </a>
            </div>
          )}
        </div>

        {/* Mode toggle (for categories with sections) */}
        {hasSections && (
          <div className="px-3 pt-2">
            <div id="tour-view-toggle" className="inline-flex items-center rounded-xl bg-background border border-border/50 p-0.5 w-full">
              {(["simple", "full"] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewModeTo(mode)}
                  className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    viewMode === mode
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-muted hover:text-foreground border border-transparent"
                  }`}
                >
                  {mode === "simple" ? t("sidebar.simple") : t("sidebar.full")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {resolvedItems.length > 0 && (
            <div className="space-y-0.5">
              {resolvedItems.map(item => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          )}
          {category.sections?.map(section => renderSection(section))}
          {renderOtherSection()}
        </nav>
      </motion.aside>
    </>
  );
}
