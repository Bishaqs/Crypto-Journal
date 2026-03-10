"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JournalNote } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { NoteEditor, TEMPLATES } from "@/components/note-editor";
import {
  Plus,
  Search,
  Filter,
  Settings,
  FileText,
  Star,
  Pencil,
  Trash2,
  X,
  Calendar,
} from "lucide-react";
import { TagManager } from "@/components/tag-manager";
import { Trade } from "@/lib/types";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { getTagColor } from "@/lib/tag-colors";
import { ImageLightbox } from "@/components/image-lightbox";

type NoteTypeFilter = "all" | "trade" | "daily" | "other" | "favorites";
type DateRange = "all" | "today" | "yesterday" | "7d" | "this-month" | "last-month" | "this-year";

const NOTE_TYPE_OPTIONS: { value: NoteTypeFilter; label: string }[] = [
  { value: "all", label: "All Notes" },
  { value: "trade", label: "Trade Notes" },
  { value: "daily", label: "Trading Day Notes" },
  { value: "other", label: "Other Notes" },
  { value: "favorites", label: "Favorites" },
];

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 Days" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-year", label: "This Year" },
];

function getDateRangeBounds(range: DateRange): { from: Date | null; to: Date | null } {
  if (range === "all") return { from: null, to: null };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "today":
      return { from: todayStart, to: null };
    case "yesterday": {
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      return { from: yesterdayStart, to: todayStart };
    }
    case "7d": {
      const weekAgo = new Date(todayStart);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { from: weekAgo, to: null };
    }
    case "this-month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: monthStart, to: null };
    }
    case "last-month": {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: lastMonthStart, to: lastMonthEnd };
    }
    case "this-year": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { from: yearStart, to: null };
    }
    default:
      return { from: null, to: null };
  }
}

export default function JournalPage() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [noteTypeFilter, setNoteTypeFilter] = useState<NoteTypeFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [editNote, setEditNote] = useState<JournalNote | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("free");
  const [showTagManager, setShowTagManager] = useState(false);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("journal_notes")
      .select("*")
      .order("note_date", { ascending: false });

    if (error) {
      console.error("[Journal] fetchNotes error:", error.message);
      setLoading(false);
      return;
    }

    setNotes((data as JournalNote[]) ?? []);
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
    setAllTrades((data as Trade[]) ?? []);
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
    const matchesSearch =
      !search ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.title?.toLowerCase().includes(search.toLowerCase());

    const matchesTag =
      !activeTag ||
      (activeTag === "__untagged__"
        ? n.tags.length === 0
        : n.tags.includes(activeTag));

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

    const { from, to } = getDateRangeBounds(dateRange);
    const noteDate = new Date(n.note_date ?? n.created_at);
    const matchesDate = (!from || noteDate >= from) && (!to || noteDate < to);

    return matchesSearch && matchesTag && matchesType && matchesDate;
  });

  function openEditor(template?: string) {
    setEditNote(null);
    setSelectedTemplate(template ?? "free");
    setShowEditor(true);
  }

  async function deleteNote(id: string) {
    await supabase.from("journal_notes").delete().eq("id", id);
    fetchNotes();
  }

  async function toggleFavorite(noteId: string, currentValue: boolean) {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, is_favorite: !currentValue } : n))
    );
    const { error } = await supabase
      .from("journal_notes")
      .update({ is_favorite: !currentValue })
      .eq("id", noteId);
    if (error) {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, is_favorite: currentValue } : n))
      );
    }
  }

  function handleContentClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      setLightboxSrc((target as HTMLImageElement).src);
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
            {`${notes.length} notes`}
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

      {/* Filters: Search + Date Range + Tag + Manage tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
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
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="appearance-none pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all cursor-pointer min-w-[140px]"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={activeTag ?? ""}
            onChange={(e) => setActiveTag(e.target.value || null)}
            className="appearance-none pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all cursor-pointer min-w-[160px]"
          >
            <option value="">All Tags</option>
            <option value="__untagged__">No Tag</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
        {activeTag && (
          <button
            onClick={() => setActiveTag(null)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-medium border border-accent/20 hover:bg-accent/20 transition-all"
          >
            <X size={12} />
            {activeTag === "__untagged__" ? "No Tag" : activeTag}
          </button>
        )}
        <button
          onClick={() => setShowTagManager(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-muted hover:text-foreground hover:border-accent/30 transition-all whitespace-nowrap"
        >
          <Settings size={14} />
          Manage Tags
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
            const isFavorite = note.is_favorite === true;
            return (
              <div
                key={note.id}
                className="bg-surface border border-border rounded-2xl hover:border-accent/30 transition-all duration-300 flex flex-col overflow-hidden"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {/* Header: title + action buttons */}
                <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-0">
                  <div className="flex-1 min-w-0">
                    {note.title && (
                      <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                        {note.title}
                      </h3>
                    )}
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {note.tags.map((tag) => {
                          const color = getTagColor(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => setActiveTag(tag)}
                              className="text-[10px] px-2 py-0.5 rounded-md font-medium border hover:opacity-80 transition-opacity cursor-pointer"
                              style={{
                                backgroundColor: color.bg,
                                color: color.text,
                                borderColor: color.border,
                              }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => toggleFavorite(note.id, isFavorite)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isFavorite ? "text-yellow-400" : "text-muted/40 hover:text-yellow-400/60"
                      }`}
                      title={isFavorite ? "Unfavorite" : "Favorite"}
                    >
                      <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => { setEditNote(note); setShowEditor(true); }}
                      className="p-1.5 rounded-lg text-muted/40 hover:text-accent hover:bg-accent/10 transition-all"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1.5 rounded-lg text-muted/40 hover:text-loss hover:bg-loss/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Scrollable content */}
                <div
                  className="text-sm text-muted leading-relaxed flex-1 px-4 pt-2 note-content max-h-[400px] overflow-y-auto [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2 [&_img]:cursor-pointer [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_strong]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
                  onClick={handleContentClick}
                />

                {/* Footer: date */}
                <div className="px-4 py-2 text-xs text-muted border-t border-border/50 mt-auto">
                  {new Date(note.note_date ?? note.created_at).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
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

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
