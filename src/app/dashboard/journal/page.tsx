"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JournalNote } from "@/lib/types";
import { DEMO_JOURNAL_NOTES } from "@/lib/demo-data";
import { sanitizeHtml } from "@/lib/sanitize";
import { DemoBanner } from "@/components/demo-banner";
import { NoteEditor, TEMPLATES } from "@/components/note-editor";
import {
  Plus,
  Search,
  Filter,
  Settings,
  FileText,
  Star,
} from "lucide-react";
import { TagManager } from "@/components/tag-manager";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { InfoTooltip } from "@/components/ui/info-tooltip";

type NoteTypeFilter = "all" | "trade" | "daily" | "other" | "favorites";

const NOTE_TYPE_OPTIONS: { value: NoteTypeFilter; label: string }[] = [
  { value: "all", label: "All Notes" },
  { value: "trade", label: "Trade Notes" },
  { value: "daily", label: "Trading Day Notes" },
  { value: "other", label: "Other Notes" },
  { value: "favorites", label: "Favorites" },
];

export default function JournalPage() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [noteTypeFilter, setNoteTypeFilter] = useState<NoteTypeFilter>("all");
  const [editNote, setEditNote] = useState<JournalNote | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("free");
  const [showTagManager, setShowTagManager] = useState(false);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("journal_notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Journal] fetchNotes error:", error.message);
      setLoading(false);
      return;
    }

    const dbNotes = (data as JournalNote[]) ?? [];
    if (dbNotes.length === 0) {
      setNotes(DEMO_JOURNAL_NOTES);
      setUsingDemo(true);
    } else {
      setNotes(dbNotes);
    }
    setLoading(false);
  }, [supabase]);

  const fetchTrades = useCallback(async () => {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    if (error) {
      console.error("[Journal] fetchTrades error:", error.message);
      return;
    }
    const dbTrades = (data as Trade[]) ?? [];
    setAllTrades(dbTrades.length === 0 ? DEMO_TRADES : dbTrades);
  }, [supabase]);

  useEffect(() => {
    fetchNotes();
    fetchTrades();
  }, [fetchNotes, fetchTrades]);

  // Auto-open editor when navigated with ?new=true
  useEffect(() => {
    if (searchParams.get("new") === "true" && !loading) {
      setShowEditor(true);
    }
  }, [searchParams, loading]);

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  const filtered = notes.filter((n) => {
    // Search filter
    const matchesSearch =
      !search ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.title?.toLowerCase().includes(search.toLowerCase());

    // Tag filter
    const matchesTag = !activeTag || n.tags.includes(activeTag);

    // Note type filter
    let matchesType = true;
    switch (noteTypeFilter) {
      case "trade":
        matchesType = n.trade_id !== null;
        break;
      case "daily":
        matchesType = n.trade_id === null;
        break;
      case "other":
        matchesType = n.note_type === "other" || (!n.note_type && n.trade_id === null);
        break;
      case "favorites":
        matchesType = n.is_favorite === true;
        break;
    }

    return matchesSearch && matchesTag && matchesType;
  });

  function openEditor(template?: string) {
    setEditNote(null);
    setSelectedTemplate(template ?? "free");
    setShowEditor(true);
  }

  async function deleteNote(id: string) {
    if (usingDemo) return;
    await supabase.from("journal_notes").delete().eq("id", id);
    fetchNotes();
  }

  async function toggleFavorite(noteId: string, currentValue: boolean) {
    if (usingDemo) return;
    // Optimistic update
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, is_favorite: !currentValue } : n))
    );
    const { error } = await supabase
      .from("journal_notes")
      .update({ is_favorite: !currentValue })
      .eq("id", noteId);
    if (error) {
      // Revert on error
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, is_favorite: currentValue } : n))
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mx-auto max-w-[1600px]">
      <div id="journal-header" className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">Journal <InfoTooltip text="Write daily reflections, tag trades, and track your mental state over time" /></h2>
          <p className="text-sm text-muted mt-0.5">
            {usingDemo ? "Sample entries" : `${notes.length} notes`}
          </p>
        </div>
        <button
          id="tour-new-note"
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300"
        >
          <Plus size={18} />
          New Note
        </button>
      </div>
      {usingDemo && <DemoBanner feature="journal" />}

      {/* Search + Tag filter + Manage tags */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Notes..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm placeholder-muted focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(0,180,216,0.1)] transition-all duration-300"
          />
        </div>
        <div className="relative">
          <select
            value={activeTag ?? ""}
            onChange={(e) => setActiveTag(e.target.value || null)}
            className="appearance-none pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all cursor-pointer min-w-[160px]"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
        <button
          onClick={() => setShowTagManager(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-muted hover:text-foreground hover:border-accent/30 transition-all whitespace-nowrap"
        >
          <Settings size={14} />
          Manage Note Tags
        </button>
      </div>

      {/* Note type filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted font-medium">Filter Note Type:</span>
        {NOTE_TYPE_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="noteType"
              checked={noteTypeFilter === opt.value}
              onChange={() => setNoteTypeFilter(opt.value)}
              className="w-3.5 h-3.5 accent-accent"
            />
            <span className={`text-xs font-medium transition-colors ${
              noteTypeFilter === opt.value ? "text-foreground" : "text-muted"
            }`}>
              {opt.label}
            </span>
          </label>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="text-accent/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">
            {notes.length === 0 ? "Start your trading journal" : "No notes match your filters"}
          </p>
          <p className="text-sm text-muted max-w-md mx-auto mb-6">
            {notes.length === 0
              ? "Document your trades, emotions, and lessons. Pick a template to get started quickly."
              : "Try a different search term or clear your filters."}
          </p>
          {notes.length === 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {TEMPLATES.filter((t) => t.id !== "free").map((t) => (
                <button
                  key={t.id}
                  onClick={() => openEditor(t.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-sm text-muted hover:text-foreground hover:border-accent/30 transition-all"
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => {
            const isExpanded = expandedNote === note.id;
            const isFavorite = note.is_favorite === true;
            return (
              <div
                key={note.id}
                onClick={() => setExpandedNote(isExpanded ? null : note.id)}
                className={`bg-surface border border-border rounded-2xl p-5 hover:border-accent/30 transition-all duration-300 cursor-pointer group flex flex-col ${
                  isExpanded ? "lg:col-span-3 md:col-span-2" : ""
                }`}
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  {note.title ? (
                    <h3 className="font-semibold text-foreground text-sm group-hover:text-accent transition-colors flex-1">
                      {note.title}
                    </h3>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(note.id, isFavorite); }}
                    className={`shrink-0 p-1 rounded transition-all ${
                      isFavorite
                        ? "text-yellow-400"
                        : "text-muted/30 hover:text-yellow-400/60"
                    }`}
                    title={isFavorite ? "Unfavorite" : "Favorite"}
                  >
                    <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                </div>
                <div
                  className={`text-sm text-muted leading-relaxed flex-1 note-content [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2 [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_strong]:text-foreground ${
                    isExpanded ? "" : "line-clamp-4"
                  }`}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
                />
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {note.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted mt-3 pt-2 border-t border-border/50">
                  <span>{new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditNote(note); setShowEditor(true); }} className="hover:text-accent transition-colors px-2 py-0.5 rounded hover:bg-accent/10">Edit</button>
                    {!usingDemo && (
                      <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="hover:text-loss transition-colors px-2 py-0.5 rounded hover:bg-loss/10">Delete</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showEditor && (
        <div id="journal-editor">
          <NoteEditor
            editNote={editNote}
            initialTemplate={selectedTemplate}
            onClose={() => { setShowEditor(false); setEditNote(null); }}
            onSaved={fetchNotes}
          />
        </div>
      )}

      {showTagManager && (
        <TagManager
          trades={allTrades}
          notes={notes}
          onClose={() => setShowTagManager(false)}
          onUpdate={() => { fetchNotes(); fetchTrades(); }}
        />
      )}
    </div>
  );
}
