"use client";

import { useState, useMemo } from "react";
import { Trade, JournalNote } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/client";
import { unlinkNoteFromTrade } from "@/lib/journal-links";
import { Clock, Plus, Link2, X, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimelineEvent = {
  type: "trade-open" | "note" | "trade-close";
  timestamp: string;
  trade?: Trade;
  note?: JournalNote;
};

type TradeTimelineProps = {
  trade: Trade;
  notes: JournalNote[];
  onCreateNote: () => void;
  onLinkExisting: () => void;
  onRefresh: () => void;
  variant?: "card" | "flat";
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTimeline(trade: Trade, notes: JournalNote[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({ type: "trade-open", timestamp: trade.open_timestamp, trade });

  for (const note of notes) {
    events.push({ type: "note", timestamp: note.note_date ?? note.created_at, note });
  }

  if (trade.close_timestamp) {
    events.push({ type: "trade-close", timestamp: trade.close_timestamp, trade });
  }

  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return events;
}

function dotColor(event: TimelineEvent): string {
  if (event.type === "trade-open") return "bg-accent";
  if (event.type === "trade-close") {
    return (event.trade?.pnl ?? 0) >= 0 ? "bg-win" : "bg-loss";
  }
  return "bg-muted/60";
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function stripHtml(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, "");
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? "";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TradeOpenItem({ trade }: { trade: Trade }) {
  return (
    <div className="pb-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Trade Opened</span>
        <span className="text-[10px] text-muted/50">{formatTs(trade.open_timestamp)}</span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-semibold ${
          trade.position === "long" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"
        }`}>
          {trade.position === "long" ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trade.position.toUpperCase()}
        </span>
        <span className="text-sm text-foreground font-medium">{trade.symbol}</span>
        <span className="text-xs text-muted">@ ${trade.entry_price.toLocaleString()}</span>
        <span className="text-xs text-muted">x{trade.quantity}</span>
      </div>
    </div>
  );
}

function TradeCloseItem({ trade }: { trade: Trade }) {
  const pnl = trade.pnl ?? 0;
  const isWin = pnl >= 0;
  const costBasis = trade.entry_price * trade.quantity;
  const pctReturn = costBasis > 0 ? ((pnl / costBasis) * 100).toFixed(2) : "0.00";

  return (
    <div className="pb-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Trade Closed</span>
        <span className="text-[10px] text-muted/50">{formatTs(trade.close_timestamp!)}</span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-xs text-muted">@ ${trade.exit_price?.toLocaleString()}</span>
        <span className={`text-sm font-bold ${isWin ? "text-win" : "text-loss"}`}>
          {isWin ? "+" : ""}${pnl.toFixed(2)} ({isWin ? "+" : ""}{pctReturn}%)
        </span>
      </div>
    </div>
  );
}

function NoteItem({
  note, expanded, onToggle, onUnlink, unlinking,
}: {
  note: JournalNote;
  expanded: boolean;
  onToggle: () => void;
  onUnlink: () => void;
  unlinking: boolean;
}) {
  const snippet = stripHtml(note.content).slice(0, 120);
  const hasMore = stripHtml(note.content).length > 120;
  const typeLabel = note.template_id
    ? note.template_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : note.note_type === "trade" ? "Trade Note" : "Update";

  return (
    <div className="pb-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">{typeLabel}</span>
        <span className="text-[10px] text-muted/50">{formatTs(note.note_date ?? note.created_at)}</span>
      </div>
      <div className="mt-1 p-2.5 rounded-lg bg-background/50 border border-border/30 group hover:border-border/60 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {note.title || "Update"}
            </p>
            {expanded ? (
              <div
                className="text-xs text-foreground/80 mt-1 leading-relaxed prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
              />
            ) : (
              <p
                className={`text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed ${hasMore ? "cursor-pointer" : ""}`}
                onClick={hasMore ? onToggle : undefined}
              >
                {snippet}{hasMore ? "..." : ""}
              </p>
            )}
            {note.tags?.length > 0 && (
              <div className="flex gap-1 mt-1.5">
                {note.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {hasMore && (
              <button onClick={onToggle} className="p-1 rounded text-muted hover:text-foreground transition-colors">
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            <button
              onClick={onUnlink}
              disabled={unlinking}
              title="Unlink note"
              className="p-1 rounded text-muted hover:text-loss hover:bg-loss/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TradeTimeline({ trade, notes, onCreateNote, onLinkExisting, onRefresh, variant = "card" }: TradeTimelineProps) {
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const events = useMemo(() => buildTimeline(trade, notes), [trade, notes]);

  async function handleUnlink(noteId: string) {
    setUnlinking(noteId);
    try {
      const supabase = createClient();
      await unlinkNoteFromTrade(supabase, noteId, trade.id);
      onRefresh();
    } catch {
      // Fallback to legacy if junction table doesn't exist
      const supabase = createClient();
      await supabase
        .from("journal_notes")
        .update({ trade_id: null, trade_asset_type: null, note_type: "other" })
        .eq("id", noteId);
      onRefresh();
    } finally {
      setUnlinking(null);
    }
  }

  function toggleExpand(noteId: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }

  return (
    <div className={variant === "card" ? "glass rounded-2xl border border-border/50 p-5 space-y-3" : "space-y-3"} style={variant === "card" ? { boxShadow: "var(--shadow-card)" } : undefined}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={14} className="text-accent" /> Trade Timeline
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onLinkExisting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted hover:text-foreground hover:bg-border/30 transition-colors"
          >
            <Link2 size={12} /> Link Existing
          </button>
          <button
            onClick={onCreateNote}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/20 transition-colors"
          >
            <Plus size={12} /> Add Update
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {events.map((event, i) => {
          const isLast = i === events.length - 1 && !!trade.close_timestamp;
          const key = event.type === "note" ? event.note!.id : event.type;

          return (
            <div key={key} className="flex gap-3">
              {/* Dot + vertical line */}
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${dotColor(event)}`} />
                {!isLast && <div className="w-px flex-1 bg-border/50 min-h-[16px]" />}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-3"}`}>
                {event.type === "trade-open" && <TradeOpenItem trade={event.trade!} />}
                {event.type === "trade-close" && <TradeCloseItem trade={event.trade!} />}
                {event.type === "note" && (
                  <NoteItem
                    note={event.note!}
                    expanded={expandedNotes.has(event.note!.id)}
                    onToggle={() => toggleExpand(event.note!.id)}
                    onUnlink={() => handleUnlink(event.note!.id)}
                    unlinking={unlinking === event.note!.id}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* "Add update..." prompt for open trades or end of timeline */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <button
              onClick={onCreateNote}
              className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-accent/50 shrink-0 mt-1 hover:border-accent transition-colors"
            />
          </div>
          <button
            onClick={onCreateNote}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Add update...
          </button>
        </div>
      </div>
    </div>
  );
}
