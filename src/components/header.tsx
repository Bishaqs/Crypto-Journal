"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme, THEMES, isProTheme, isCompletionistTheme } from "@/lib/theme-context";
import { useCosmetics } from "@/lib/cosmetics";
import { useSubscriptionContext } from "@/lib/subscription-context";
import { useDateRange, DATE_RANGES } from "@/lib/date-range-context";
import {
  Palette,
  User,
  Calendar,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { AppsDropdown } from "@/components/apps-dropdown";
import { QuickActionMenu } from "@/components/quick-action-fab";

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { tier, isOwner } = useSubscriptionContext();
  const { isOwned: isCosmeticOwned } = useCosmetics();
  const hasCompletionistTheme = isCosmeticOwned("title_completionist");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const { dateRange, setDateRange } = useDateRange();
  const [showRanges, setShowRanges] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [helpSearch, setHelpSearch] = useState("");

  useEffect(() => {
    if (!syncMessage) return;
    const t = setTimeout(() => setSyncMessage(null), 3000);
    return () => clearTimeout(t);
  }, [syncMessage]);

  const currentLabel = DATE_RANGES.find((r) => r.value === dateRange)?.label ?? "All";
  const currentTheme = THEMES.find((t) => t.value === theme);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3 text-sm text-muted">
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span>{formatToday()}</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (helpSearch.trim()) {
              router.push("/dashboard/help?q=" + encodeURIComponent(helpSearch.trim()));
              setHelpSearch("");
            }
          }}
          className="relative hidden sm:block"
        >
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={helpSearch}
            onChange={(e) => setHelpSearch(e.target.value)}
            placeholder="Search help..."
            className="w-[180px] bg-surface border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all"
            style={{ boxShadow: "var(--shadow-card)" }}
          />
        </form>
        <QuickActionMenu />
      </div>

      <div className="flex items-center gap-2">
        {/* Range selector */}
        <div className="relative">
          <button
            onClick={() => setShowRanges(!showRanges)}
            className="px-3 py-1.5 rounded-xl bg-surface border border-border text-sm text-foreground hover:border-accent/30 transition-all flex items-center gap-2"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span className="text-muted text-xs">Range</span>
            {currentLabel}
          </button>
          {showRanges && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRanges(false)} />
              <div
                className="absolute right-0 top-full mt-2 bg-surface border border-border rounded-xl z-50 py-1 min-w-[140px]"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => {
                      setDateRange(r.value);
                      setShowRanges(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      dateRange === r.value
                        ? "text-accent bg-accent/10"
                        : "text-muted hover:text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Account filter */}
        <div
          className="px-3 py-1.5 rounded-xl bg-surface border border-border text-sm text-muted flex items-center gap-1.5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <span className="text-xs">Acct</span>
          <span className="text-foreground text-xs font-medium">All</span>
        </div>

        {/* Sync button */}
        <div className="relative">
          <button
            onClick={() => {
              const config = localStorage.getItem("stargate-exchange-config");
              if (!config || !JSON.parse(config).apiKey) {
                setSyncMessage("Connect an exchange in Settings first.");
                return;
              }
              setSyncing(true);
              setTimeout(() => setSyncing(false), 2000);
            }}
            className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
            style={{ boxShadow: "var(--shadow-card)" }}
            title="Sync trades"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin text-accent" : ""} />
          </button>
          {syncMessage && (
            <div
              className="absolute right-0 top-full mt-2 px-3 py-2 rounded-xl bg-surface border border-accent/30 text-xs text-foreground whitespace-nowrap z-50"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {syncMessage}
            </div>
          )}
        </div>

        {/* Apps launcher */}
        <AppsDropdown />

        {/* Theme picker */}
        <div className="relative">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all flex items-center gap-1.5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <Palette size={14} />
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: currentTheme?.dot,
                border: ((theme as string) === "solara" || (theme as string) === "obsidian")
                  ? "1.5px solid #888"
                  : "1px solid rgba(255,255,255,0.15)",
              }}
            />
          </button>
          {showThemes && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowThemes(false)} />
              <div
                className="absolute right-0 top-full mt-2 glass border border-border/50 rounded-xl z-50 py-1 min-w-[180px]"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {THEMES.map((t) => {
                  const isLocked = isCompletionistTheme(t.value) && !hasCompletionistTheme && !isOwner;
                  const isProLocked = isProTheme(t.value) && tier === "free" && !isOwner;
                  return (
                    <button
                      key={t.value}
                      onClick={() => {
                        if (isProLocked || isLocked) return;
                        setTheme(t.value);
                        setShowThemes(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                        theme === t.value
                          ? "text-accent bg-accent/10"
                          : isLocked
                            ? "text-muted/40 cursor-not-allowed"
                            : "text-muted hover:text-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          background: isLocked ? "#444" : t.dot,
                          border: ((t.value as string) === "solara" || (t.value as string) === "obsidian")
                            ? "1.5px solid #888"
                            : "1px solid rgba(255,255,255,0.15)",
                          boxShadow: theme === t.value ? `0 0 8px ${t.dot}60` : "none",
                        }}
                      />
                      {t.label}
                      {isLocked && <span className="text-[10px] text-amber-400/60 ml-auto">🔒 100%</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <User size={14} />
        </Link>
      </div>
    </div>
  );
}
