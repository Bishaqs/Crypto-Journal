"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme, THEMES, isProTheme, isLevel500Theme, getLevelRequirement } from "@/lib/theme-context";
import { useLevel } from "@/lib/xp";
import { useSubscriptionContext } from "@/lib/subscription-context";
import { useDateRange, DATE_RANGES } from "@/lib/date-range-context";
import { useAccount } from "@/lib/account-context";
import {
  Palette,
  User,
  Calendar,
  RefreshCw,
  Search,
  ChevronDown,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { AppsDropdown } from "@/components/apps-dropdown";
import { QuickActionMenu } from "@/components/quick-action-fab";
import { useStreakCount } from "@/lib/use-streak-count";

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
  const { level, xpProgress } = useLevel();
  const hasLevel500Access = level >= 500;
  const { count: streakCount } = useStreakCount();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const { dateRange, setDateRange } = useDateRange();
  const { selectedAccount, setSelectedAccount, connections, connectionsLoading, refreshConnections } = useAccount();
  const [showRanges, setShowRanges] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [helpSearch, setHelpSearch] = useState("");

  useEffect(() => {
    if (!syncMessage) return;
    const t = setTimeout(() => setSyncMessage(null), 3000);
    return () => clearTimeout(t);
  }, [syncMessage]);

  const currentLabel = DATE_RANGES.find((r) => r.value === dateRange)?.label ?? "All";
  const currentTheme = THEMES.find((t) => t.value === theme);

  const accountLabel = selectedAccount === "all"
    ? "All"
    : selectedAccount === "manual"
      ? "Manual"
      : connections.find((c) => c.id === selectedAccount)?.account_label
        || connections.find((c) => c.id === selectedAccount)?.broker_name
        || "...";

  async function handleSync() {
    if (connectionsLoading) return;
    if (connections.length === 0) {
      setSyncMessage("Add a connection in Import / Export first.");
      return;
    }
    setSyncing(true);
    setSyncMessage(null);
    let totalImported = 0;
    let totalFetched = 0;
    const perConn: string[] = [];
    const errors: string[] = [];
    for (const conn of connections) {
      const label = conn.account_label || conn.broker_name;
      try {
        const res = await fetch(`/api/connections/${conn.id}/sync`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const imported = data.trades_imported ?? 0;
          const fetched = data.fetched ?? 0;
          totalImported += imported;
          totalFetched += fetched;
          if (imported > 0) {
            perConn.push(`${label}: +${imported}`);
          }
        } else {
          errors.push(label);
        }
      } catch {
        errors.push(label);
      }
    }
    await refreshConnections();
    if (errors.length > 0) {
      setSyncMessage(`Synced with errors: ${errors.join(", ")}`);
    } else if (totalImported > 0) {
      const detail = perConn.length > 1 ? ` (${perConn.join(", ")})` : "";
      setSyncMessage(`Imported ${totalImported} trade${totalImported !== 1 ? "s" : ""}${detail}.`);
    } else {
      setSyncMessage(`No new trades. ${totalFetched} positions checked.`);
    }
    setSyncing(false);
  }

  return (
    <div className="flex items-center justify-between pb-5 mb-5 border-b border-border/10">
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
            className="w-[160px] bg-surface/80 border border-border/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all"
          />
        </form>
        <QuickActionMenu />

        {/* Mini Level indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/10 border border-accent/20" title={`Level ${level}`}>
          <span className="text-[10px] font-bold text-accent">Lv.{level}</span>
          <div className="w-8 h-1 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>

        {/* Mini Streak indicator */}
        {streakCount > 0 && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20" title={`${streakCount} day streak`}>
            <Flame size={11} className={streakCount >= 30 ? "text-orange-400 animate-pulse" : "text-orange-400"} />
            <span className="text-[10px] font-bold text-orange-400">{streakCount}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Range selector */}
        <div className="relative">
          <button
            onClick={() => setShowRanges(!showRanges)}
            className="px-3 py-1.5 rounded-xl bg-surface/80 border border-border/50 text-sm text-foreground hover:border-accent/20 transition-all flex items-center gap-2"
          >
            <span className="text-muted text-xs">Range</span>
            {currentLabel}
          </button>
          {showRanges && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRanges(false)} />
              <div
                className="absolute right-0 top-full mt-2 glass border border-border/50 rounded-xl z-50 py-1 min-w-[140px] overflow-hidden"
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
        <div className="relative">
          <button
            onClick={() => setShowAccounts(!showAccounts)}
            className="px-3 py-1.5 rounded-xl bg-surface/80 border border-border/50 text-sm text-foreground hover:border-accent/20 transition-all flex items-center gap-2"
          >
            <span className="text-muted text-xs">Acct</span>
            <span className="text-xs font-medium">{accountLabel}</span>
            <ChevronDown size={10} className="text-muted" />
          </button>
          {showAccounts && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAccounts(false)} />
              <div
                className="absolute right-0 top-full mt-2 glass border border-border/50 rounded-xl z-50 py-1 min-w-[160px] overflow-hidden"
              >
                <button
                  onClick={() => { setSelectedAccount("all"); setShowAccounts(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedAccount === "all"
                      ? "text-accent bg-accent/10"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => { setSelectedAccount("manual"); setShowAccounts(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedAccount === "manual"
                      ? "text-accent bg-accent/10"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  Manual
                </button>
                {connections.length > 0 && (
                  <div className="border-t border-border/50 my-1" />
                )}
                {connections.map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => { setSelectedAccount(conn.id); setShowAccounts(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      selectedAccount === conn.id
                        ? "text-accent bg-accent/10"
                        : "text-muted hover:text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {conn.account_label || conn.broker_name}
                  </button>
                ))}
                {connectionsLoading && (
                  <div className="px-4 py-2 text-xs text-muted">Loading...</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sync button */}
        <div className="relative">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="p-2 rounded-xl bg-surface/80 border border-border/50 text-muted hover:text-foreground hover:border-accent/20 transition-all disabled:opacity-50"
            title="Sync trades"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin text-accent" : ""} />
          </button>
          {syncMessage && (
            <div
              className="absolute right-0 top-full mt-2 px-3 py-2 rounded-xl glass border border-accent/20 text-xs text-foreground whitespace-nowrap z-50"
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
            className="p-2 rounded-xl bg-surface/80 border border-border/50 text-muted hover:text-foreground hover:border-accent/20 transition-all flex items-center gap-1.5"
          >
            <Palette size={14} />
            <div
              className="w-3 h-3 rounded-full"
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
                  const levelReq = getLevelRequirement(t.value);
                  const isLevelGated = levelReq !== null && level < levelReq && !isOwner;
                  const isLocked = isLevel500Theme(t.value) && !hasLevel500Access && !isOwner;
                  const isProLocked = isProTheme(t.value) && tier === "free" && !isOwner;
                  const isAnyLocked = false; // All themes unlocked — re-enable before launch
                  return (
                    <button
                      key={t.value}
                      onClick={() => {
                        if (isAnyLocked) return;
                        setTheme(t.value);
                        setShowThemes(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                        theme === t.value
                          ? "text-accent bg-accent/10"
                          : isAnyLocked
                            ? "text-muted/40 cursor-not-allowed"
                            : "text-muted hover:text-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          background: isAnyLocked ? "#444" : t.dot,
                          border: ((t.value as string) === "solara" || (t.value as string) === "obsidian")
                            ? "1.5px solid #888"
                            : "1px solid rgba(255,255,255,0.15)",
                          boxShadow: theme === t.value ? `0 0 8px ${t.dot}60` : "none",
                        }}
                      />
                      {t.label}
                      {isLocked && <span className="text-[10px] text-amber-400/60 ml-auto">🔒 Lv.500</span>}
                      {isLevelGated && <span className="text-[10px] text-pink-400/60 ml-auto">🔒 Lv.{levelReq}</span>}
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
          className="p-2 rounded-xl bg-surface/80 border border-border/50 text-muted hover:text-foreground hover:border-accent/20 transition-all"
        >
          <User size={14} />
        </Link>
      </div>
    </div>
  );
}
