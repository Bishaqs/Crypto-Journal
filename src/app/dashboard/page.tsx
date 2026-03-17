"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { JournalNote } from "@/lib/types";
import { Trade } from "@/lib/types";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { sanitizeHtml } from "@/lib/sanitize";
import { DailyCheckin } from "@/components/daily-checkin";
import { AISummaryWidget } from "@/components/dashboard/ai-summary-widget";
import { Header } from "@/components/header";
import { getDailyGreeting, getDisplayName } from "@/lib/greetings";
import { NoteEditor } from "@/components/note-editor";
import { Plus, BookOpen, ArrowRight, Sparkles, Brain } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function JournalHomePage() {
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const { t } = useI18n();
  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("journal_notes")
      .select("*")
      .order("note_date", { ascending: false })
      .limit(7);
    if (!error && data) setNotes(data);
  }, [supabase]);

  const fetchTradesForAI = useCallback(async () => {
    const { data } = await fetchAllTrades(supabase);
    setTrades(data as Trade[]);
  }, [supabase]);

  useEffect(() => {
    Promise.all([fetchNotes(), fetchTradesForAI()]).then(() => setLoading(false));
  }, [fetchNotes, fetchTradesForAI]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <Header />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getDailyGreeting()}, {getDisplayName()}
          </h1>
          <p className="text-sm text-muted mt-1">How&apos;s your mindset today?</p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300"
        >
          <Plus size={16} />
          New Note
        </button>
      </div>

      {/* Daily Check-In (embedded) */}
      <DailyCheckin embedded />

      {/* AI Coach Nudge */}
      {trades.length > 0 && (
        <div id="tour-ai-summary">
          <AISummaryWidget trades={trades} />
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/psychology"
          className="glass rounded-xl border border-border/50 p-4 hover:border-accent/30 transition-all group flex items-center gap-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="p-2 rounded-lg bg-accent/10">
            <Brain size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">Psychology</p>
            <p className="text-[10px] text-muted">Behavioral patterns</p>
          </div>
        </Link>
        <Link
          href="/dashboard/ai"
          className="glass rounded-xl border border-border/50 p-4 hover:border-accent/30 transition-all group flex items-center gap-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="p-2 rounded-lg bg-accent/10">
            <Sparkles size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">AI Coach</p>
            <p className="text-[10px] text-muted">Ask me anything</p>
          </div>
        </Link>
      </div>

      {/* Recent Journal Entries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookOpen size={16} className="text-accent" />
            Recent Journal Entries
          </h2>
          <Link href="/dashboard/journal" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {notes.length === 0 ? (
          <div className="glass rounded-2xl border border-border/50 p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <BookOpen size={32} className="text-muted/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">No journal entries yet</p>
            <p className="text-xs text-muted mb-4">Start by writing about your trading day, your mindset, or a specific trade.</p>
            <button
              onClick={() => setShowEditor(true)}
              className="px-4 py-2 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
            >
              Write your first note
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/dashboard/journal?edit=${note.id}`}
                className="glass rounded-xl border border-border/50 p-4 hover:border-accent/30 transition-all block group"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                      {note.title || "Untitled"}
                    </p>
                    {note.content && (
                      <p className="text-xs text-muted mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content).replace(/<[^>]*>/g, "").slice(0, 120) }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-muted/60 shrink-0">
                    {new Date(note.note_date || note.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      {showEditor && (
        <NoteEditor
          onClose={() => setShowEditor(false)}
          onSaved={() => { setShowEditor(false); fetchNotes(); }}
        />
      )}
    </div>
  );
}
