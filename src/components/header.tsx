"use client";

import { useState } from "react";
import { useTheme, THEMES } from "@/lib/theme-context";
import { useDateRange, DATE_RANGES } from "@/lib/date-range-context";
import {
  Palette,
  User,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const { dateRange, setDateRange } = useDateRange();
  const [showRanges, setShowRanges] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  const currentLabel = DATE_RANGES.find((r) => r.value === dateRange)?.label ?? "All";
  const currentTheme = THEMES.find((t) => t.value === theme);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Calendar size={14} />
        <span>{formatToday()}</span>
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
        <button
          onClick={() => {
            const config = localStorage.getItem("stargate-exchange-config");
            if (!config || !JSON.parse(config).apiKey) {
              alert("Connect an exchange in Settings first.");
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

        {/* Theme picker */}
        <div className="relative">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all flex items-center gap-1.5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <Palette size={14} />
            <div
              className="w-2.5 h-2.5 rounded-full border border-border/50"
              style={{ background: currentTheme?.dot }}
            />
          </button>
          {showThemes && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowThemes(false)} />
              <div
                className="absolute right-0 top-full mt-2 glass border border-border/50 rounded-xl z-50 py-1 min-w-[180px]"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setTheme(t.value);
                      setShowThemes(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                      theme === t.value
                        ? "text-accent bg-accent/10"
                        : "text-muted hover:text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full border border-border/50 shrink-0"
                      style={{ background: t.dot, boxShadow: theme === t.value ? `0 0 8px ${t.dot}60` : "none" }}
                    />
                    {t.label}
                  </button>
                ))}
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
