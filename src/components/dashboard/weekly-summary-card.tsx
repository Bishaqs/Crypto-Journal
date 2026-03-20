"use client";

import { useMemo, useState, useEffect } from "react";
import { Trade } from "@/lib/types";
import { generateWeeklyReport, getAvailableWeeks } from "@/lib/calculations";
import { Calendar, TrendingUp, TrendingDown, Target, ChevronRight, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAiEnhancedInsights, fetchAiInsight } from "@/lib/ai-insights";

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getSuggestion(report: ReturnType<typeof generateWeeklyReport>): string {
  if (report.tradeCount === 0) return "No trades closed this week.";

  const parts: string[] = [];

  if (report.winRate >= 60) {
    parts.push(`Strong ${report.winRate.toFixed(0)}% win rate`);
  } else if (report.winRate < 40 && report.tradeCount >= 3) {
    parts.push(`Win rate at ${report.winRate.toFixed(0)}% — review your setups`);
  }

  if (report.emotionBreakdown.length > 0) {
    const topEmotion = report.emotionBreakdown[0];
    if (topEmotion.emotion !== "Untagged") {
      parts.push(`most common emotion: ${topEmotion.emotion}`);
    }
  }

  if (report.avgProcessScore !== null) {
    if (report.avgProcessScore >= 7) {
      parts.push(`process discipline on point (${report.avgProcessScore.toFixed(1)}/10)`);
    } else if (report.avgProcessScore < 5) {
      parts.push(`process score needs work (${report.avgProcessScore.toFixed(1)}/10)`);
    }
  }

  if (parts.length === 0) {
    return `${report.tradeCount} trades closed across ${report.tradingDays} trading day${report.tradingDays !== 1 ? "s" : ""}.`;
  }

  return parts.join(" · ") + ".";
}

export function WeeklySummaryCard({ trades }: { trades: Trade[] }) {
  const [dismissed, setDismissed] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { isEnabled, apiKey, provider } = useAiEnhancedInsights();

  const report = useMemo(() => {
    const weeks = getAvailableWeeks(trades);
    if (weeks.length === 0) return null;

    // Find the most recent COMPLETED week (not current week)
    const now = new Date();
    const day = now.getDay();
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - ((day + 6) % 7));
    const currentMondayStr = currentMonday.toISOString().split("T")[0];

    // Filter out current in-progress week
    const completedWeeks = weeks.filter((w) => w < currentMondayStr);
    if (completedWeeks.length === 0) return null;

    return generateWeeklyReport(trades, completedWeeks[0]);
  }, [trades]);

  // AI enhancement
  useEffect(() => {
    if (!isEnabled || !apiKey || !report || report.tradeCount === 0) return;
    setAiLoading(true);
    const recentTrades = trades
      .filter((t) => t.close_timestamp !== null)
      .slice(0, 20)
      .map((t) => ({ symbol: t.symbol, position: t.position, pnl: t.pnl, emotion: t.emotion }));
    fetchAiInsight(
      recentTrades,
      `Weekly summary: ${report.tradeCount} trades, ${report.winRate.toFixed(0)}% win rate, $${report.totalPnl.toFixed(0)} P&L, ${report.greenDays} green days, ${report.redDays} red days`,
      apiKey,
      provider,
    ).then((result) => {
      setAiInsight(result);
      setAiLoading(false);
    });
  }, [isEnabled, apiKey, provider, report, trades]);

  if (!report || report.tradeCount === 0 || dismissed) return null;

  // Check session storage for dismiss
  const storageKey = `stargate-weekly-dismissed-${report.weekStart}`;
  if (typeof window !== "undefined" && localStorage.getItem(storageKey)) return null;

  const pnlColor = report.totalPnl >= 0 ? "text-emerald-400" : "text-red-400";
  const PnlIcon = report.totalPnl >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="glass rounded-2xl border border-border/50 p-4 relative overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="absolute top-0 left-0 w-1 h-full bg-accent rounded-l-2xl" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-accent shrink-0" />
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">Week in Review</span>
            <span className="text-[10px] text-muted">{formatDate(report.weekStart)} – {formatDate(report.weekEnd)}</span>
          </div>

          {/* Hero stat + mini stats */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* P&L */}
            <div className="flex items-center gap-2">
              <PnlIcon size={20} className={pnlColor} />
              <span className={`text-2xl font-bold tracking-tight ${pnlColor}`}>
                {report.totalPnl >= 0 ? "+" : ""}{report.totalPnl.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Mini stats */}
            <div className="flex items-center gap-4 text-xs text-muted">
              <span>{report.tradeCount} trade{report.tradeCount !== 1 ? "s" : ""}</span>
              <span className="w-px h-3 bg-border" />
              <span>
                <Target size={10} className="inline mr-1 text-accent" />
                {report.winRate.toFixed(0)}% WR
              </span>
              {report.avgProcessScore !== null && (
                <>
                  <span className="w-px h-3 bg-border" />
                  <span>{report.avgProcessScore.toFixed(1)}/10 process</span>
                </>
              )}
              <span className="w-px h-3 bg-border" />
              <span className="text-emerald-400">{report.greenDays}G</span>
              <span className="text-red-400">{report.redDays}R</span>
            </div>
          </div>

          {/* Takeaway */}
          <p className="text-xs text-muted mt-2 leading-relaxed">{getSuggestion(report)}</p>

          {/* AI-enhanced insight */}
          {aiLoading && (
            <div className="mt-2 h-4 rounded bg-accent/10 animate-pulse" />
          )}
          {aiInsight && (
            <div className="mt-2 flex items-start gap-1.5">
              <Sparkles size={10} className="text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground/70 leading-snug">{aiInsight}</p>
            </div>
          )}
        </div>

        {/* Right side: link + dismiss */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-accent hover:bg-accent/10 transition-colors"
          >
            Full Report <ChevronRight size={12} />
          </Link>
          <button
            onClick={() => {
              setDismissed(true);
              if (typeof window !== "undefined") localStorage.setItem(storageKey, "1");
            }}
            className="p-1.5 rounded-lg text-muted hover:text-foreground transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
