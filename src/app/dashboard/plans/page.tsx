"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DailyPlan } from "@/lib/types";
import {
  ClipboardList,
  Plus,
  X,
  Target,
  ShieldAlert,
  Eye,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";

export default function PlansPage() {
  usePageTour("plans-page");
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const supabase = createClient();

  // Form state
  const [watchlist, setWatchlist] = useState("");
  const [maxTrades, setMaxTrades] = useState("");
  const [maxLoss, setMaxLoss] = useState("");
  const [sessionGoal, setSessionGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [eodReview, setEodReview] = useState("");

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("date", selectedDate)
      .limit(1)
      .single();

    if (data) {
      const p = data as DailyPlan;
      setPlan(p);
      setWatchlist((p.watchlist ?? []).join(", "));
      setMaxTrades(p.max_trades?.toString() ?? "");
      setMaxLoss(p.max_loss?.toString() ?? "");
      setSessionGoal(p.session_goal ?? "");
      setNotes(p.notes ?? "");
      setEodReview(p.eod_review ?? "");
    } else {
      setPlan(null);
      setWatchlist("");
      setMaxTrades("");
      setMaxLoss("");
      setSessionGoal("");
      setNotes("");
      setEodReview("");
    }
    setLoading(false);
  }, [supabase, selectedDate]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  async function savePlan() {
    setSaving(true);
    const planData = {
      date: selectedDate,
      watchlist: watchlist
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
      max_trades: maxTrades ? parseInt(maxTrades) : null,
      max_loss: maxLoss ? parseFloat(maxLoss) : null,
      session_goal: sessionGoal || null,
      notes: notes || null,
      eod_review: eodReview || null,
    };

    if (plan) {
      await supabase
        .from("daily_plans")
        .update(planData)
        .eq("id", plan.id);
    } else {
      await supabase.from("daily_plans").insert(planData);
    }

    await fetchPlan();
    setSaving(false);
  }

  async function deletePlan() {
    if (!plan) return;
    await supabase.from("daily_plans").delete().eq("id", plan.id);
    setPlan(null);
    setWatchlist("");
    setMaxTrades("");
    setMaxLoss("");
    setSessionGoal("");
    setNotes("");
    setEodReview("");
  }

  function shiftDate(days: number) {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  const isToday = selectedDate === new Date().toISOString().split("T")[0];
  const dateLabel = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const hasContent = watchlist || maxTrades || maxLoss || sessionGoal || notes || eodReview;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 id="tour-plans-header" className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Trade / Day Plans
            <PageInfoButton tourName="plans-page" />
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Plan before trading. Review after.
          </p>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {dateLabel}
          </span>
          {isToday && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              Today
            </span>
          )}
        </div>
        <button
          onClick={() => shiftDate(1)}
          className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all"
        >
          <ChevronRight size={18} />
        </button>
        {!isToday && (
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="text-xs text-muted hover:text-accent transition-colors ml-2"
          >
            Go to today
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-accent">Loading...</div>
        </div>
      ) : (
        <div id="tour-plans-list" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pre-Market Plan */}
          <div
            className="glass rounded-2xl border border-border/50 p-6 space-y-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-accent" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Pre-Market Plan
              </h2>
            </div>

            {/* Watchlist */}
            <div>
              <label className="flex items-center gap-2 text-[11px] text-muted font-semibold uppercase tracking-wider mb-2">
                <Eye size={12} />
                Watchlist
              </label>
              <input
                type="text"
                value={watchlist}
                onChange={(e) => setWatchlist(e.target.value)}
                placeholder="BTCUSDT, ETHUSDT, SOLUSDT..."
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
              />
              <p className="text-[10px] text-muted/50 mt-1">
                Comma-separated symbols
              </p>
            </div>

            {/* Max trades + max loss */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[11px] text-muted font-semibold uppercase tracking-wider mb-2">
                  <ShieldAlert size={12} />
                  Max Trades
                </label>
                <input
                  type="number"
                  value={maxTrades}
                  onChange={(e) => setMaxTrades(e.target.value)}
                  placeholder="e.g. 5"
                  min={0}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[11px] text-muted font-semibold uppercase tracking-wider mb-2">
                  <ShieldAlert size={12} />
                  Max Loss ($)
                </label>
                <input
                  type="number"
                  value={maxLoss}
                  onChange={(e) => setMaxLoss(e.target.value)}
                  placeholder="e.g. 200"
                  min={0}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                />
              </div>
            </div>

            {/* Session goal */}
            <div>
              <label className="flex items-center gap-2 text-[11px] text-muted font-semibold uppercase tracking-wider mb-2">
                <Target size={12} />
                Session Goal
              </label>
              <input
                type="text"
                value={sessionGoal}
                onChange={(e) => setSessionGoal(e.target.value)}
                placeholder="Not P&L — process goal. e.g. 'Follow checklist on every trade'"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-[11px] text-muted font-semibold uppercase tracking-wider mb-2">
                <FileText size={12} />
                Key Levels / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key levels, market context, setups you're watching..."
                rows={4}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all resize-none"
              />
            </div>
          </div>

          {/* EOD Review */}
          <div
            className="glass rounded-2xl border border-border/50 p-6 space-y-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-accent" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                End-of-Day Review
              </h2>
            </div>

            <div>
              <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-2 block">
                How did the day go? Did you follow your plan?
              </label>
              <textarea
                value={eodReview}
                onChange={(e) => setEodReview(e.target.value)}
                placeholder="What went well? What would you do differently? Did you stick to your max trades / max loss? Rate your discipline..."
                rows={10}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all resize-none"
              />
            </div>

            {/* Quick prompts */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted/60 font-semibold uppercase tracking-wider">
                Reflection prompts
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Did I follow my entry rules?",
                  "Did I respect my stop losses?",
                  "Was I patient or impulsive?",
                  "What's one thing I'd do differently?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() =>
                      setEodReview((prev) =>
                        prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`
                      )
                    }
                    className="text-[10px] px-3 py-1.5 rounded-lg border border-border text-muted hover:text-accent hover:border-accent/30 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save / delete bar */}
      {!loading && (
        <div className="flex items-center justify-between">
          <div>
            {plan && (
              <button
                onClick={deletePlan}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-loss hover:bg-loss/10 transition-all"
              >
                <Trash2 size={14} />
                Delete Plan
              </button>
            )}
          </div>
          <button
            onClick={savePlan}
            disabled={saving || !hasContent}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              "Saving..."
            ) : plan ? (
              <>
                <CheckCircle2 size={16} />
                Update Plan
              </>
            ) : (
              <>
                <Plus size={16} />
                Save Plan
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
