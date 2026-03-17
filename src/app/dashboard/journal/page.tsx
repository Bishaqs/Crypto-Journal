"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JournalNote, AssetType } from "@/lib/types";
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
  ArrowUpDown,
  LayoutGrid,
  List,
  AlignJustify,
  Link2,
  TrendingUp,
  TrendingDown,
  Bitcoin,
  BarChart3,
  Wheat,
  DollarSign,
  Layers,
} from "lucide-react";
import { TagManager } from "@/components/tag-manager";
import { Trade } from "@/lib/types";
import { getLinkedNoteIds, linkNoteToTrade } from "@/lib/journal-links";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { getTagColor } from "@/lib/tag-colors";
import { ImageLightbox } from "@/components/image-lightbox";
import { CustomSelect } from "@/components/ui/custom-select";
import { useTheme } from "@/lib/theme-context";

type AssetFilter = AssetType | "all";
type NoteTypeFilter = "all" | "trade" | "daily" | "other" | "favorites";
type DateRange = "all" | "today" | "yesterday" | "7d" | "this-month" | "last-month" | "this-year";
type SortOption = "created-newest" | "created-oldest" | "newest" | "oldest" | "name-asc" | "name-desc";
type LayoutMode = "grid" | "list" | "compact";

const ASSET_FILTER_OPTIONS: { value: AssetFilter; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "all", label: "All", icon: Layers },
  { value: "crypto", label: "Crypto", icon: Bitcoin },
  { value: "stocks", label: "Stocks", icon: BarChart3 },
  { value: "commodities", label: "Commodities", icon: Wheat },
  { value: "forex", label: "Forex", icon: DollarSign },
];

const TRADE_TABLE_MAP: Record<AssetType, string> = {
  crypto: "trades",
  stocks: "stock_trades",
  commodities: "commodity_trades",
  forex: "forex_trades",
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "created-newest", label: "Recently Added" },
  { value: "created-oldest", label: "Oldest Added" },
  { value: "newest", label: "Date (Newest)" },
  { value: "oldest", label: "Date (Oldest)" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
];

const NOTE_TYPE_OPTIONS: { value: NoteTypeFilter; label: string }[] = [
  { value: "all", label: "All Notes" },
  { value: "trade", label: "Trade Notes" },
  { value: "daily", label: "Trading Day Notes" },
  { value: "other", label: "Other Notes" },
  { value: "favorites", label: "Favorites" },
];

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 Days" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-year", label: "This Year" },
  { value: "all", label: "All Time" },
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

function formatTitle(title: string): string {
  return title.replace(
    /^([A-Z]{2,10})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/,
    "$1 — $2"
  );
}

export default function JournalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [allTrades, setAllTrades] = useState<(Trade & { _assetType?: AssetType })[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("created-newest");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("stargate-journal-layout") as LayoutMode) || "grid";
    }
    return "grid";
  });
  const [assetFilter, setAssetFilter] = useState<AssetFilter>(() => {
    if (typeof window !== "undefined") {
      const urlAsset = new URLSearchParams(window.location.search).get("asset");
      if (urlAsset && ["crypto", "stocks", "commodities", "forex", "all"].includes(urlAsset)) {
        return urlAsset as AssetFilter;
      }
      return (localStorage.getItem("stargate-asset-context") as AssetFilter) || "crypto";
    }
    return "crypto";
  });
  const [linkingNoteId, setLinkingNoteId] = useState<string | null>(null);
  const [linkSearch, setLinkSearch] = useState("");
  const [linkedNoteIdSet, setLinkedNoteIdSet] = useState<Set<string>>(new Set());
  const { viewMode } = useTheme();
  const isBeginner = viewMode === "beginner";
  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    let query = supabase
      .from("journal_notes")
      .select("*")
      .order("note_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (assetFilter !== "all") {
      query = query.eq("asset_type", assetFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Journal] fetchNotes error:", error.message);
      setLoading(false);
      return;
    }

    setNotes((data as JournalNote[]) ?? []);
    setLoading(false);
  }, [supabase, assetFilter]);

  const fetchTrades = useCallback(async () => {
    // Fetch trades from the relevant table(s) based on asset filter
    const tablesToFetch: AssetType[] = assetFilter === "all"
      ? ["crypto", "stocks", "commodities", "forex"]
      : [assetFilter];

    const results = await Promise.all(
      tablesToFetch.map(async (at) => {
        const table = TRADE_TABLE_MAP[at];
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .order("open_timestamp", { ascending: false });
        if (error) {
          console.error(`[Journal] fetchTrades(${table}) error:`, error.message);
          return [];
        }
        // Normalize forex trades: they use `pair` instead of `symbol`
        return ((data ?? []) as Record<string, unknown>[]).map((t) => ({
          ...t,
          symbol: (t.symbol as string) ?? (t.pair as string) ?? "Unknown",
          _assetType: at,
        })) as (Trade & { _assetType?: AssetType })[];
      })
    );

    setAllTrades(results.flat());
  }, [supabase, assetFilter]);

  // Fetch which notes have trade links (for link icon display)
  const fetchLinkedIds = useCallback(async () => {
    try {
      const ids = await getLinkedNoteIds(supabase);
      setLinkedNoteIdSet(ids);
    } catch { /* junction table may not exist yet */ }
  }, [supabase]);

  useEffect(() => {
    fetchNotes();
    fetchTrades();
    fetchLinkedIds();
  }, [fetchNotes, fetchTrades, fetchLinkedIds]);

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
        matchesType = n.note_type === "trade" || linkedNoteIdSet.has(n.id);
        break;
      case "daily":
        matchesType = n.note_type === "daily";
        break;
      case "other":
        matchesType = n.note_type === "other" || (!n.note_type && !linkedNoteIdSet.has(n.id));
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

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.note_date ?? b.created_at).getTime() - new Date(a.note_date ?? a.created_at).getTime();
      case "oldest":
        return new Date(a.note_date ?? a.created_at).getTime() - new Date(b.note_date ?? b.created_at).getTime();
      case "created-newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "created-oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "name-asc":
        return (a.title ?? "").localeCompare(b.title ?? "");
      case "name-desc":
        return (b.title ?? "").localeCompare(a.title ?? "");
      default:
        return 0;
    }
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

  async function syncTradeToNote(noteId: string, tradeId: string) {
    // Find the trade to determine which table it belongs to
    const trade = allTrades.find((t) => t.id === tradeId);
    const tradeAssetType: AssetType = (trade as { _assetType?: AssetType })?._assetType ?? "crypto";
    const tradeTable = TRADE_TABLE_MAP[tradeAssetType];

    // 1. Link via junction table + update note_type
    try {
      await linkNoteToTrade(supabase, noteId, tradeId, tradeAssetType);
    } catch {
      // Fallback to legacy column if junction table doesn't exist
      await supabase
        .from("journal_notes")
        .update({ trade_id: tradeId, trade_asset_type: tradeAssetType })
        .eq("id", noteId);
    }
    await supabase
      .from("journal_notes")
      .update({ note_type: "trade" })
      .eq("id", noteId);

    // 2. Non-destructive psychology merge: copy if trade fields are empty
    const note = notes.find((n) => n.id === noteId);
    if (note?.structured_data && trade) {
      const sd = note.structured_data as Record<string, string | number | boolean | null>;
      const update: Record<string, unknown> = {};
      const noteEmotion = Array.isArray(sd.emotions) ? (sd.emotions as string[])[0] : sd.emotion;
      if (!trade.emotion && noteEmotion) update.emotion = noteEmotion;
      if (!trade.confidence && sd.confidence) update.confidence = sd.confidence;
      if (!trade.setup_type && sd.setup_type) update.setup_type = sd.setup_type;
      if (Object.keys(update).length > 0) {
        await supabase.from(tradeTable).update(update).eq("id", tradeId);
      }
    }

    setLinkingNoteId(null);
    setLinkSearch("");
    fetchNotes();
    fetchTrades();
    fetchLinkedIds();
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
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">Journal <InfoTooltip text="Write daily reflections, tag trades, and track your mental state over time" articleId="tj-journal" /></h2>
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

      {/* Asset type switcher — hidden for beginners */}
      {!isBeginner && <div className="flex rounded-xl border border-border/50 p-0.5 bg-surface w-fit">
        {ASSET_FILTER_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => {
              setAssetFilter(value);
              setLoading(true);
              // Update URL without full navigation
              const url = new URL(window.location.href);
              if (value === "all") {
                url.searchParams.delete("asset");
              } else {
                url.searchParams.set("asset", value);
              }
              router.replace(url.pathname + url.search, { scroll: false });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              assetFilter === value
                ? "bg-accent/15 text-accent border border-accent/20"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>}

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
        <CustomSelect
          value={dateRange}
          onChange={(v) => setDateRange(v as DateRange)}
          options={DATE_RANGE_OPTIONS}
          icon={<Calendar size={14} />}
          minWidth="150px"
        />
        {!isBeginner && (
          <>
            <CustomSelect
              value={activeTag ?? ""}
              onChange={(v) => setActiveTag(v || null)}
              options={[
                { value: "", label: "All Tags" },
                { value: "__untagged__", label: "No Tag" },
                ...allTags.map((tag) => ({ value: tag, label: tag })),
              ]}
              icon={<Filter size={14} />}
              minWidth="160px"
            />
            <CustomSelect
              value={sortBy}
              onChange={(v) => setSortBy(v as SortOption)}
              options={SORT_OPTIONS}
              icon={<ArrowUpDown size={14} />}
              minWidth="170px"
            />
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
            <div className="flex rounded-xl border border-border/50 p-0.5 bg-surface">
              {([
                { mode: "grid" as LayoutMode, icon: LayoutGrid, title: "Grid" },
                { mode: "list" as LayoutMode, icon: List, title: "List" },
                { mode: "compact" as LayoutMode, icon: AlignJustify, title: "Timeline" },
              ]).map(({ mode, icon: Icon, title }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setLayoutMode(mode);
                    localStorage.setItem("stargate-journal-layout", mode);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    layoutMode === mode
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                  title={title}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Note type filter — hidden for beginners */}
      {!isBeginner && <div className="flex items-center gap-3 flex-wrap">
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
      </div>}

      {sorted.length === 0 ? (
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
        <>
          {/* ── Grid View ── */}
          {layoutMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((note) => {
                const isFavorite = note.is_favorite === true;
                return (
                  <div
                    key={note.id}
                    className="bg-surface border border-border rounded-2xl hover:border-accent/30 transition-all duration-300 flex flex-col overflow-hidden"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-0">
                      <div className="flex-1 min-w-0">
                        {note.title && (
                          <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                            {formatTitle(note.title)}
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
                        {!linkedNoteIdSet.has(note.id) ? (
                          <button
                            onClick={() => { setLinkingNoteId(note.id); setLinkSearch(""); }}
                            className="p-1.5 rounded-lg text-muted/40 hover:text-accent hover:bg-accent/10 transition-all"
                            title="Link to Trade"
                          >
                            <Link2 size={14} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-accent font-medium px-1.5" title="Linked to trade">
                            <Link2 size={12} className="inline" />
                          </span>
                        )}
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
                    <div
                      className="text-sm text-muted leading-relaxed flex-1 px-4 pt-2 note-content max-h-[400px] overflow-y-auto [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2 [&_img]:cursor-pointer [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_strong]:text-foreground"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
                      onClick={handleContentClick}
                    />
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

          {/* ── List View ── */}
          {layoutMode === "list" && (
            <div className="space-y-1">
              {sorted.map((note) => {
                const isFavorite = note.is_favorite === true;
                const noteDate = new Date(note.note_date ?? note.created_at);
                return (
                  <div
                    key={note.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface border border-border/50 hover:border-accent/30 hover:bg-surface-hover transition-all cursor-pointer group"
                    onClick={() => { setEditNote(note); setShowEditor(true); }}
                  >
                    {/* Tags */}
                    <div className="flex gap-1 shrink-0 min-w-[80px] max-w-[200px] overflow-hidden">
                      {note.tags.slice(0, 3).map((tag) => {
                        const color = getTagColor(tag);
                        return (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.5 rounded font-medium border truncate"
                            style={{
                              backgroundColor: color.bg,
                              color: color.text,
                              borderColor: color.border,
                            }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                      {note.tags.length > 3 && (
                        <span className="text-[9px] text-muted">+{note.tags.length - 3}</span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground font-medium truncate block">
                        {note.title ? formatTitle(note.title) : "Untitled"}
                      </span>
                    </div>

                    {/* Date */}
                    <span className="text-xs text-muted shrink-0 whitespace-nowrap">
                      {noteDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(note.id, isFavorite); }}
                        className={`p-1.5 rounded-lg transition-all ${
                          isFavorite ? "text-yellow-400 opacity-100" : "text-muted/40 hover:text-yellow-400/60"
                        }`}
                        title={isFavorite ? "Unfavorite" : "Favorite"}
                      >
                        <Star size={13} fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                      {!linkedNoteIdSet.has(note.id) ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLinkingNoteId(note.id); setLinkSearch(""); }}
                          className="p-1.5 rounded-lg text-muted/40 hover:text-accent hover:bg-accent/10 transition-all"
                          title="Link to Trade"
                        >
                          <Link2 size={13} />
                        </button>
                      ) : (
                        <span className="text-accent px-1" title="Linked to trade">
                          <Link2 size={11} />
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        className="p-1.5 rounded-lg text-muted/40 hover:text-loss hover:bg-loss/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Compact / Timeline View ── */}
          {layoutMode === "compact" && (() => {
            const groups = new Map<string, JournalNote[]>();
            for (const note of sorted) {
              const d = new Date(note.note_date ?? note.created_at);
              const key = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
              if (!groups.has(key)) groups.set(key, []);
              groups.get(key)!.push(note);
            }
            return (
              <div className="space-y-4">
                {Array.from(groups.entries()).map(([dateLabel, dateNotes]) => (
                  <div key={dateLabel}>
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-px flex-1 bg-border/50" />
                      <span className="text-[11px] font-semibold text-muted uppercase tracking-wider whitespace-nowrap">
                        {dateLabel}
                      </span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>
                    {/* Entries */}
                    <div className="space-y-0.5 pl-2">
                      {dateNotes.map((note) => {
                        const isFavorite = note.is_favorite === true;
                        const time = new Date(note.note_date ?? note.created_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });
                        return (
                          <div
                            key={note.id}
                            className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer group"
                            onClick={() => { setEditNote(note); setShowEditor(true); }}
                          >
                            {/* Time */}
                            <span className="text-[11px] text-muted/60 font-mono w-[72px] shrink-0">
                              {time}
                            </span>

                            {/* Title */}
                            <span className="text-sm text-foreground truncate flex-1 min-w-0">
                              {note.title ? formatTitle(note.title) : "Untitled"}
                            </span>

                            {/* Tags */}
                            <div className="flex gap-1 shrink-0">
                              {note.tags.slice(0, 2).map((tag) => {
                                const color = getTagColor(tag);
                                return (
                                  <span
                                    key={tag}
                                    className="text-[9px] px-1.5 py-0.5 rounded font-medium border"
                                    style={{
                                      backgroundColor: color.bg,
                                      color: color.text,
                                      borderColor: color.border,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                );
                              })}
                              {note.tags.length > 2 && (
                                <span className="text-[9px] text-muted">+{note.tags.length - 2}</span>
                              )}
                            </div>

                            {/* Favorite indicator + actions */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              {isFavorite && (
                                <Star size={11} className="text-yellow-400" fill="currentColor" />
                              )}
                              {linkedNoteIdSet.has(note.id) ? (
                                <span className="text-accent px-0.5" title="Linked to trade">
                                  <Link2 size={10} />
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setLinkingNoteId(note.id); setLinkSearch(""); }}
                                  className="p-1 rounded text-muted/30 hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
                                  title="Link to Trade"
                                >
                                  <Link2 size={12} />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                className="p-1 rounded text-muted/30 hover:text-loss opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {showEditor && (
        <div id="journal-editor">
          <NoteEditor
            editNote={editNote}
            initialTemplate={selectedTemplate}
            assetType={assetFilter === "all" ? "crypto" : assetFilter}
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

      {/* Trade Picker Modal for "Sync to Trade" */}
      {linkingNoteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setLinkingNoteId(null); setLinkSearch(""); }}>
          <div className="glass border border-border/50 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Link to Trade</h3>
              <button onClick={() => { setLinkingNoteId(null); setLinkSearch(""); }} className="p-1 rounded-lg text-muted hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Search by symbol or date..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-0.5">
                {allTrades.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">No trades found</p>
                ) : (
                  allTrades
                    .filter((t) => {
                      if (!linkSearch) return true;
                      const q = linkSearch.toLowerCase();
                      return t.symbol.toLowerCase().includes(q) || t.open_timestamp.includes(q) || t.position.includes(q);
                    })
                    .slice(0, 12)
                    .map((trade) => (
                      <button
                        key={trade.id}
                        onClick={() => syncTradeToNote(linkingNoteId, trade.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-accent/10 transition-colors"
                      >
                        {trade.pnl !== null && trade.pnl >= 0 ? (
                          <TrendingUp size={13} className="text-win shrink-0" />
                        ) : (
                          <TrendingDown size={13} className="text-loss shrink-0" />
                        )}
                        <span className="text-sm font-medium text-foreground">{trade.symbol}</span>
                        <span className="text-xs text-muted capitalize">{trade.position}</span>
                        <span className="text-xs text-muted">
                          {new Date(trade.open_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className={`text-xs font-medium ml-auto ${trade.pnl !== null && trade.pnl >= 0 ? "text-win" : "text-loss"}`}>
                          {trade.pnl !== null ? (trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`) : "Open"}
                        </span>
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
