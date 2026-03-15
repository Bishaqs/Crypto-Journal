"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogOut, HelpCircle, Shield, BarChart3, Gem, DollarSign, MessageSquareText, Bitcoin, ArrowUpDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StargateLogo } from "../stargate-logo";
import { LevelBadge } from "./level-badge";
import { RAIL_CATEGORIES, getCategoryForPath } from "./sidebar-data";
import { useI18n } from "@/lib/i18n";
import { useHelpCenter } from "@/lib/help-center-context";
import type { AssetContext } from "@/lib/addons";

const HOME_ICONS: Record<AssetContext, LucideIcon> = {
  crypto: Bitcoin,
  stocks: BarChart3,
  commodities: Gem,
  forex: DollarSign,
};

interface SidebarRailProps {
  activeCategory: string | null;
  onCategoryClick: (key: string) => void;
  onDirectNav: (href: string) => void;
  onCloseDrawer: () => void;
  onLogout: () => void;
  isOwner: boolean;
  assetContext: AssetContext;
  onAssetToggle: (ctx: AssetContext) => void;
}

export function SidebarRail({ activeCategory, onCategoryClick, onDirectNav, onCloseDrawer, onLogout, isOwner, assetContext, onAssetToggle }: SidebarRailProps) {
  const pathname = usePathname();
  const currentCategory = getCategoryForPath(pathname);
  const { t } = useI18n();
  const { state: helpState, openHelpCenter } = useHelpCenter();
  const [homePopupOpen, setHomePopupOpen] = useState(false);
  const homePopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!homePopupOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (homePopupRef.current && !homePopupRef.current.contains(e.target as Node)) {
        setHomePopupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [homePopupOpen]);

  return (
    <div
      className="hidden md:flex flex-col w-[68px] shrink-0 h-full glass border-r border-border/50 z-20"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Logo */}
      <div className="p-3 flex items-center justify-center border-b border-border">
        <Link href="/dashboard">
          <StargateLogo size={28} collapsed />
        </Link>
      </div>

      {/* Level badge */}
      <div className="py-2 flex justify-center border-b border-border/30">
        <LevelBadge />
      </div>

      {/* Category icons */}
      <div className="flex-1 flex flex-col items-center gap-1 py-3">
        {RAIL_CATEGORIES.map(cat => {
          const isHighlighted = activeCategory === cat.key || (!activeCategory && currentCategory === cat.key);

          if (cat.key === "home") {
            const HomeIcon = HOME_ICONS[assetContext];
            return (
              <div key={cat.key} className="relative" ref={homePopupRef}>
                <button
                  onClick={() => { onCloseDrawer(); setHomePopupOpen(prev => !prev); }}
                  title={cat.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isHighlighted
                      ? "text-accent bg-accent/10 shadow-[0_0_12px_rgba(0,180,216,0.15)]"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  <HomeIcon size={20} />
                </button>
                {homePopupOpen && (
                  <div
                    className="absolute left-full top-0 ml-2 w-48 py-1.5 glass border border-border/50 rounded-xl z-50"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    {([
                      { ctx: "crypto" as const, label: "Crypto Dashboard", icon: Bitcoin, path: "/dashboard" },
                      { ctx: "stocks" as const, label: "Stocks Dashboard", icon: BarChart3, path: "/dashboard/stocks" },
                      { ctx: "commodities" as const, label: "Commodities Dashboard", icon: Gem, path: "/dashboard/commodities" },
                      { ctx: "forex" as const, label: "Forex Dashboard", icon: DollarSign, path: "/dashboard/forex" },
                    ]).map(({ ctx, label, icon: Icon, path }) => (
                      <button
                        key={ctx}
                        onClick={() => { onCloseDrawer(); onAssetToggle(ctx); setHomePopupOpen(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg mx-1.5 w-[calc(100%-12px)] ${
                          pathname === path
                            ? "text-accent bg-accent/10"
                            : "text-muted hover:text-foreground hover:bg-surface-hover"
                        }`}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={cat.key}
              onClick={() => {
                if (cat.directNav) {
                  onDirectNav(cat.items[0]?.href ?? "/dashboard");
                } else {
                  onCategoryClick(cat.key);
                }
              }}
              title={cat.label}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isHighlighted
                  ? "text-accent bg-accent/10 shadow-[0_0_12px_rgba(0,180,216,0.15)]"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <cat.icon size={20} />
            </button>
          );
        })}
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-1 py-3 border-t border-border">
        {isOwner && (
          <Link
            href="/dashboard/admin"
            title="Admin"
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
              pathname.startsWith("/dashboard/admin")
                ? "text-accent bg-accent/10"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <Shield size={20} />
          </Link>
        )}
        <Link
          href="/dashboard/import-export"
          title={t("sidebar.importExport") || "Import / Export"}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            pathname.startsWith("/dashboard/import-export")
              ? "text-accent bg-accent/10"
              : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          <ArrowUpDown size={20} />
        </Link>
        <Link
          href="/dashboard/feedback"
          title={t("sidebar.feedback") || "Feedback"}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            pathname.startsWith("/dashboard/feedback")
              ? "text-accent bg-accent/10"
              : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          <MessageSquareText size={20} />
        </Link>
        <button
          onClick={openHelpCenter}
          title={t("sidebar.helpCenter") || "Help Center"}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            helpState.isOpen
              ? "text-accent bg-accent/10"
              : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          <HelpCircle size={20} />
        </button>
        <Link
          href="/dashboard/settings"
          title={t("sidebar.settings") || "Settings"}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            pathname.startsWith("/dashboard/settings")
              ? "text-accent bg-accent/10"
              : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          <Settings size={20} />
        </Link>
        <button
          onClick={onLogout}
          title={t("common.logOut") || "Log Out"}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-muted hover:text-loss hover:bg-loss/10 transition-all duration-200"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
