"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogOut, HelpCircle, Shield, MessageSquareText, ArrowUpDown } from "lucide-react";
import { StargateLogo } from "../stargate-logo";
import { LevelBadge } from "./level-badge";
import { RAIL_CATEGORIES, getCategoryForPath } from "./sidebar-data";
import { useI18n } from "@/lib/i18n";
import { useHelpCenter } from "@/lib/help-center-context";

interface SidebarRailProps {
  activeCategory: string | null;
  onCategoryClick: (key: string) => void;
  onDirectNav: (href: string) => void;
  onCloseDrawer: () => void;
  onLogout: () => void;
  isOwner: boolean;
  viewMode?: "beginner" | "simple" | "full";
}

export function SidebarRail({ activeCategory, onCategoryClick, onDirectNav, onCloseDrawer, onLogout, isOwner, viewMode = "simple" }: SidebarRailProps) {
  const pathname = usePathname();
  const currentCategory = getCategoryForPath(pathname);
  const { t } = useI18n();
  const { state: helpState, openHelpCenter } = useHelpCenter();

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
        {RAIL_CATEGORIES.filter(cat => viewMode !== "beginner" || cat.showInBeginner !== false).map(cat => {
          const isHighlighted = activeCategory === cat.key || (!activeCategory && currentCategory === cat.key);

          return (
            <button
              key={cat.key}
              onClick={() => {
                if (cat.directNav) {
                  onCloseDrawer();
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
        {viewMode !== "beginner" && (
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
        )}
        {viewMode !== "beginner" && (
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
        )}
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
