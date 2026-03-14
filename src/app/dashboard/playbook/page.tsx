"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { calculateTradePnl } from "@/lib/calculations";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import {
  BookMarked,
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  BarChart3,
  Sparkles,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Header } from "@/components/header";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { PlaybookForm } from "@/components/playbook-form";
import type { Playbook } from "@/lib/schemas/playbook";

type SetupStats = {
  tradeCount: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  avgProcess: number;
};

export default function PlaybookPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPlaybooks = useCallback(async () => {
    try {
      const res = await fetch("/api/playbook");
      if (res.ok) {
        const data = await res.json();
        setPlaybooks(data.playbooks ?? []);
      }
    } catch {
      // Table may not exist yet
    }
  }, []);

  const fetchTrades = useCallback(async () => {
    const { data } = await fetchAllTrades(supabase);
    const dbTrades = (data as Trade[]) ?? [];
    setTrades(dbTrades.length === 0 ? DEMO_TRADES : dbTrades);
  }, [supabase]);

  useEffect(() => {
    Promise.all([fetchPlaybooks(), fetchTrades()]).then(() => setLoading(false));
  }, [fetchPlaybooks, fetchTrades]);

  // Calculate stats per playbook from trades with playbook_id
  const playbookStats = useMemo(() => {
    const map = new Map<string, { pnl: number; wins: number; count: number; processTotal: number; processCount: number }>();

    for (const t of trades.filter((t) => t.close_timestamp)) {
      // Match by playbook_id (hard link) or setup_type (fuzzy fallback)
      const tradeAny = t as Record<string, unknown>;
      const pbId = tradeAny.playbook_id as string | null;

      if (pbId) {
        const p = t.pnl ?? calculateTradePnl(t) ?? 0;
        const e = map.get(pbId) ?? { pnl: 0, wins: 0, count: 0, processTotal: 0, processCount: 0 };
        map.set(pbId, {
          pnl: e.pnl + p,
          wins: e.wins + (p > 0 ? 1 : 0),
          count: e.count + 1,
          processTotal: e.processTotal + (t.process_score ?? 0),
          processCount: e.processCount + (t.process_score !== null ? 1 : 0),
        });
      } else if (t.setup_type) {
        // Fuzzy match: find a playbook whose name matches this setup_type
        const matchedPb = playbooks.find(
          (pb) => pb.name.toLowerCase() === t.setup_type!.toLowerCase()
        );
        if (matchedPb) {
          const p = t.pnl ?? calculateTradePnl(t) ?? 0;
          const e = map.get(matchedPb.id) ?? { pnl: 0, wins: 0, count: 0, processTotal: 0, processCount: 0 };
          map.set(matchedPb.id, {
            pnl: e.pnl + p,
            wins: e.wins + (p > 0 ? 1 : 0),
            count: e.count + 1,
            processTotal: e.processTotal + (t.process_score ?? 0),
            processCount: e.processCount + (t.process_score !== null ? 1 : 0),
          });
        }
      }
    }

    const result = new Map<string, SetupStats>();
    for (const [key, d] of map) {
      result.set(key, {
        tradeCount: d.count,
        winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
        totalPnl: d.pnl,
        avgPnl: d.count > 0 ? d.pnl / d.count : 0,
        avgProcess: d.processCount > 0 ? d.processTotal / d.processCount : 0,
      });
    }
    return result;
  }, [trades, playbooks]);

  async function toggleActive(pb: Playbook) {
    const res = await fetch(`/api/playbook/${pb.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !pb.is_active }),
    });
    if (res.ok) fetchPlaybooks();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/playbook/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlaybooks((prev) => prev.filter((p) => p.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } finally {
      setDeleting(null);
    }
  }

  if (subLoading) return null;
  if (!hasAccess("playbook")) return <UpgradePrompt feature="playbook" requiredTier="pro" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  const hasPlaybooks = playbooks.length > 0;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      <div className="flex items-center justify-between">
        <div id="tour-playbook-header">
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BookMarked size={24} className="text-accent" />
            Playbook
            <InfoTooltip text="Document proven setups with entry/exit criteria, then track real performance against them" />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Document your setups, track their performance
          </p>
        </div>
        <button
          onClick={() => { setEditingPlaybook(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300"
        >
          <Plus size={18} />
          New Setup
        </button>
      </div>

      {/* Empty state */}
      {!hasPlaybooks && (
        <div className="glass rounded-2xl border border-border/50 p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <BookMarked size={48} className="text-accent/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Build Your Trading Playbook</h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Document your proven setups with specific entry/exit rules, stop loss strategies, and risk parameters.
            The AI Coach will check every trade against your playbook and flag rule violations.
          </p>
          <button
            onClick={() => { setEditingPlaybook(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
          >
            <Plus size={18} />
            Create Your First Setup
          </button>
        </div>
      )}

      {/* Playbook entries */}
      <div id="tour-playbook-entries" className="space-y-4">
        {playbooks.map((entry) => {
          const stats = playbookStats.get(entry.id);
          const isExpanded = expandedId === entry.id;
          return (
            <div
              key={entry.id}
              className={`glass rounded-2xl border overflow-hidden transition-opacity ${
                entry.is_active ? "border-border/50" : "border-border/30 opacity-60"
              }`}
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="p-5 cursor-pointer hover:bg-surface-hover/50 transition-all"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-foreground">{entry.name}</h3>
                      {!entry.is_active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/10 text-muted font-medium">
                          Inactive
                        </span>
                      )}
                      {entry.asset_class !== "all" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium capitalize">
                          {entry.asset_class}
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{entry.description}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    {stats && (
                      <div className="flex gap-4 text-xs">
                        <div className="text-center">
                          <p className="text-muted/60 uppercase tracking-wider text-[10px]">Trades</p>
                          <p className="font-bold text-foreground">{stats.tradeCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted/60 uppercase tracking-wider text-[10px]">Win Rate</p>
                          <p className={`font-bold ${stats.winRate >= 50 ? "text-win" : "text-loss"}`}>
                            {stats.winRate.toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted/60 uppercase tracking-wider text-[10px]">P&L</p>
                          <p className={`font-bold ${stats.totalPnl >= 0 ? "text-win" : "text-loss"}`}>
                            ${stats.totalPnl.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t border-border/50 space-y-4">
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingPlaybook(entry); setShowForm(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(entry); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
                    >
                      {entry.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                      {entry.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this setup? This cannot be undone.")) handleDelete(entry.id);
                      }}
                      disabled={deleting === entry.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-loss hover:border-loss/30 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      {deleting === entry.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {entry.entry_rules.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={14} className="text-win" />
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Entry Rules</h4>
                        </div>
                        <div className="space-y-1.5">
                          {entry.entry_rules.map((rule, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-muted">
                              <span className="text-accent mt-0.5 shrink-0">{i + 1}.</span>
                              <span>{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.exit_rules.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={14} className="text-accent" />
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Exit Rules</h4>
                        </div>
                        <div className="space-y-1.5">
                          {entry.exit_rules.map((rule, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-muted">
                              <span className="text-accent mt-0.5 shrink-0">{i + 1}.</span>
                              <span>{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stop Loss & Risk */}
                  {(entry.stop_loss_strategy || entry.risk_per_trade) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {entry.stop_loss_strategy && (
                        <div className="bg-background rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 size={14} className="text-loss" />
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Stop Loss</h4>
                          </div>
                          <p className="text-xs text-muted">{entry.stop_loss_strategy}</p>
                        </div>
                      )}
                      {entry.risk_per_trade && (
                        <div className="bg-background rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 size={14} className="text-accent" />
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Risk Per Trade</h4>
                          </div>
                          <p className="text-xs text-muted">{entry.risk_per_trade}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeframes */}
                  {entry.timeframes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Timeframes</h4>
                      <div className="flex gap-1.5">
                        {entry.timeframes.map((tf) => (
                          <span key={tf} className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium">
                            {tf}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance stats */}
                  {stats && (
                    <div className="bg-background rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Sparkles size={14} className="text-accent" />
                        Performance from your trades
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { label: "Trades", value: String(stats.tradeCount) },
                          { label: "Win Rate", value: `${stats.winRate.toFixed(0)}%`, color: stats.winRate >= 50 ? "text-win" : "text-loss" },
                          { label: "Total P&L", value: `$${stats.totalPnl.toFixed(0)}`, color: stats.totalPnl >= 0 ? "text-win" : "text-loss" },
                          { label: "Avg P&L", value: `$${stats.avgPnl.toFixed(0)}`, color: stats.avgPnl >= 0 ? "text-win" : "text-loss" },
                          { label: "Avg Process", value: stats.avgProcess > 0 ? `${stats.avgProcess.toFixed(1)}/10` : "—" },
                        ].map((s) => (
                          <div key={s.label}>
                            <p className="text-[10px] text-muted/60 uppercase tracking-wider">{s.label}</p>
                            <p className={`text-sm font-bold ${s.color ?? "text-foreground"}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Playbook Form Modal */}
      {showForm && (
        <PlaybookForm
          editPlaybook={editingPlaybook}
          onClose={() => { setShowForm(false); setEditingPlaybook(null); }}
          onSaved={fetchPlaybooks}
        />
      )}
    </div>
  );
}
