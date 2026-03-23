"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogOut, HelpCircle, Shield, MessageSquareText, ArrowUpDown, Lock, MoreHorizontal } from "lucide-react";
import { TraverseLogo } from "../traverse-logo";
import { LevelBadge } from "./level-badge";
import { RAIL_CATEGORIES, getCategoryForPath } from "./sidebar-data";
import { useI18n } from "@/lib/i18n";
import { useHelpCenter } from "@/lib/help-center-context";
import { useLevel } from "@/lib/xp/context";

interface SidebarRailProps {
  activeCategory: string | null;
  onCategoryClick: (key: string) => void;
  onDirectNav: (href: string) => void;
  onCloseDrawer: () => void;
  onLogout: () => void;
  isOwner: boolean;
  viewMode?: "beginner" | "advanced" | "expert";
  setViewModeTo?: (mode: "beginner" | "advanced" | "expert") => void;
}

export function SidebarRail({ activeCategory, onCategoryClick, onDirectNav, onCloseDrawer, onLogout, isOwner, viewMode = "advanced", setViewModeTo }: SidebarRailProps) {
  const pathname = usePathname();
  const currentCategory = getCategoryForPath(pathname);
  const { t } = useI18n();
  const { state: helpState, openHelpCenter } = useHelpCenter();
  const { level } = useLevel();
  const [lockedToast, setLockedToast] = useState<{ label: string; requiredLevel: number } | null>(null);

  // Check if level gating should be bypassed (expert mode, mode override, or experienced user bypass)
  const hasOverride = typeof window !== "undefined" && (
    localStorage.getItem("stargate-mode-override") === "true" ||
    localStorage.getItem("stargate-level-bypass") === "true"
  );
  const bypassLevelGating = viewMode === "expert" || hasOverride;

  // Auto-dismiss locked toast
  useEffect(() => {
    if (lockedToast) {
      const t = setTimeout(() => setLockedToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [lockedToast]);

  return (
    <div
      className="hidden md:flex flex-col w-[68px] shrink-0 h-full glass border-r border-border/50 z-20"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Logo */}
      <div className="p-3 flex items-center justify-center border-b border-border">
        <Link href="/dashboard">
          <TraverseLogo size={28} collapsed />
        </Link>
      </div>

      {/* Level badge */}
      <div className="py-2 flex justify-center border-b border-border/30">
        <LevelBadge />
      </div>

      {/* Category icons */}
      <div className="flex-1 flex flex-col items-center gap-1 py-3">
        {RAIL_CATEGORIES.filter(cat => {
          if (bypassLevelGating) return true;
          // Beginners: only show explicitly allowed categories (no lock icons)
          if (viewMode === "beginner") return cat.showInBeginner === true;
          if (viewMode === "advanced") return cat.showInAdvanced !== false;
          return true;
        }).map(cat => {
          const isLocked = !bypassLevelGating && cat.requiredLevel != null && level < cat.requiredLevel;
          // In advanced/expert mode, journal category also claims calendar paths
          const matchesCategory = currentCategory === cat.key ||
            (cat.key === "journal" && currentCategory === "calendar" && viewMode !== "beginner");
          const isHighlighted = !isLocked && (activeCategory === cat.key || (!activeCategory && matchesCategory));

          return (
            <button
              key={cat.key}
              onClick={() => {
                if (isLocked) {
                  setLockedToast({ label: cat.label, requiredLevel: cat.requiredLevel! });
                  return;
                }
                if (cat.directNav) {
                  onCloseDrawer();
                  onDirectNav(cat.items[0]?.href ?? "/dashboard");
                } else {
                  onCategoryClick(cat.key);
                }
              }}
              title={isLocked ? `${cat.label} — Unlocks at Level ${cat.requiredLevel}` : cat.label}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isLocked
                  ? "text-muted/30 cursor-not-allowed"
                  : isHighlighted
                    ? "text-accent bg-accent/10 shadow-[0_0_12px_rgba(0,180,216,0.15)]"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <cat.icon size={20} />
              {isLocked && (
                <Lock size={10} className="absolute bottom-1 right-1 text-muted/40" />
              )}
            </button>
          );
        })}

        {/* Locked feature toast */}
        {lockedToast && (
          <div className="absolute left-[72px] top-1/2 -translate-y-1/2 z-50 bg-surface border border-border rounded-xl p-3 shadow-lg w-52 animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} className="text-accent shrink-0" />
              <span className="text-xs font-semibold text-foreground">{lockedToast.label}</span>
            </div>
            <p className="text-[11px] text-muted">
              Unlocks at Level {lockedToast.requiredLevel}. You&apos;re Level {level} — keep journaling!
            </p>
          </div>
        )}

        {/* "More features" indicator for beginners */}
        {viewMode === "beginner" && setViewModeTo && (
          <button
            onClick={() => setViewModeTo("advanced")}
            title="Switch to Advanced mode for more features"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-muted/40 hover:text-accent hover:bg-surface-hover transition-all duration-200"
          >
            <MoreHorizontal size={20} />
          </button>
        )}
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
