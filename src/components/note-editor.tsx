"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { JournalNote, Trade } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { uploadJournalImage } from "@/lib/image-upload";
import { EditorToolbar } from "@/components/note-editor/editor-toolbar";
import { TemplateSelector } from "@/components/note-editor/template-selector";
import { TradeLinker } from "@/components/note-editor/trade-linker";
import { getCustomTagPresets } from "@/lib/tag-manager";
import { isStructuredTemplate, StructuredTemplateForm, serializeToHtml } from "@/components/note-editor/structured-templates";
import {
  X,
  FileText,
  ClipboardList,
  AlertTriangle,
  Calendar,
} from "lucide-react";

type Template = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  content: string;
};

const TEMPLATES: Template[] = [
  { id: "free", label: "Free-form", icon: FileText, content: "" },
  {
    id: "trade-review",
    label: "Trade Review",
    icon: ClipboardList,
    content: `<h2>What went well</h2><p><br></p><h2>What went wrong</h2><p><br></p><h2>Lessons learned</h2><p><br></p><h2>Action items for next session</h2><p><br></p>`,
  },
  {
    id: "morning-plan",
    label: "Morning Plan",
    icon: Calendar,
    content: `<h2>Market conditions</h2><p><br></p><h2>Watchlist</h2><ul><li><br></li></ul><h2>Session limits</h2><p>Max trades today: </p><p>Max loss today: $</p><h2>Focus for today</h2><p><br></p>`,
  },
  {
    id: "weekly-recap",
    label: "Weekly Recap",
    icon: FileText,
    content: `<h2>This week's P&L</h2><p><br></p><h2>Best trade</h2><p><br></p><h2>Worst trade</h2><p><br></p><h2>Emotional patterns</h2><p><br></p><h2>One thing to improve next week</h2><p><br></p>`,
  },
  {
    id: "mistake",
    label: "Mistake Analysis",
    icon: AlertTriangle,
    content: `<h2>What happened</h2><p><br></p><h2>What I felt</h2><p><br></p><h2>What the rule says</h2><p><br></p><h2>What I'll do differently</h2><p><br></p>`,
  },
];

export { TEMPLATES };

const TEMPLATE_LIST = TEMPLATES.map(({ id, label, content }) => ({ id, label, content }));

interface NoteEditorProps {
  editNote?: JournalNote | null;
  initialTemplate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function NoteEditor({ editNote = null, initialTemplate = "free", onClose, onSaved }: NoteEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkedTradeId, setLinkedTradeId] = useState<string | null>(editNote?.trade_id ?? null);
  const [autoLinkOnImport, setAutoLinkOnImport] = useState(editNote?.auto_link_on_import ?? false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(editNote?.tags?.[0] ?? null);
  const [allExistingTags, setAllExistingTags] = useState<string[]>([]);
  const [appliedTemplate, setAppliedTemplate] = useState(initialTemplate);
  const [structuredData, setStructuredData] = useState<Record<string, string | number | null>>({});
  const [noteDate, setNoteDate] = useState<string>(
    editNote?.note_date
      ? editNote.note_date.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const supabase = createClient();

  const useStructured = !editNote && isStructuredTemplate(appliedTemplate);

  // Initialize contentEditable content ONCE on mount
  useEffect(() => {
    if (!initialized.current && contentRef.current) {
      const initial = editNote?.content ?? (TEMPLATES.find((t) => t.id === initialTemplate)?.content ?? "");
      contentRef.current.innerHTML = sanitizeHtml(initial);
      initialized.current = true;
    }
  }, []);

  // Fetch trades for TradeLinker + existing tags for suggestions
  useEffect(() => {
    async function loadData() {
      const [tradesResult, notesResult] = await Promise.all([
        supabase.from("trades").select("*").order("open_timestamp", { ascending: false }),
        supabase.from("journal_notes").select("tags"),
      ]);
      if (tradesResult.data) setTrades(tradesResult.data as Trade[]);
      if (notesResult.data) {
        const dbTags = Array.from(new Set((notesResult.data as { tags: string[] }[]).flatMap((n) => n.tags)));
        setAllExistingTags(dbTags);
      }
    }
    loadData();
  }, []);

  const tagOptions = useMemo(() => {
    const presets = getCustomTagPresets();
    return Array.from(new Set([...allExistingTags, ...presets])).sort();
  }, [allExistingTags]);

  const hasContent = useCallback(() => {
    const html = contentRef.current?.innerHTML ?? "";
    return html.length > 0 && html !== "<br>";
  }, []);

  async function insertImage(file: File) {
    setUploading(true);
    try {
      const url = await uploadJournalImage(file);
      const img = document.createElement("img");
      img.src = url;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "0.5rem";
      img.style.margin = "0.5rem 0";
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && contentRef.current?.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.collapse(false);
      } else {
        contentRef.current?.appendChild(img);
      }
      contentRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    }
    setUploading(false);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) insertImage(file);
        return;
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files) return;
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        insertImage(file);
      }
    }
  }

  function handleImageUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) insertImage(file);
    };
    input.click();
  }

  function handleTemplateApply(templateId: string, customContent?: string) {
    setAppliedTemplate(templateId);
    setStructuredData({});
    // Only inject HTML for free-form/custom templates
    if (!isStructuredTemplate(templateId) && contentRef.current) {
      const content = customContent ?? TEMPLATES.find((t) => t.id === templateId)?.content ?? "";
      contentRef.current.innerHTML = sanitizeHtml(content);
      contentRef.current.focus();
    }
  }

  async function saveNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const htmlContent = useStructured
        ? serializeToHtml(appliedTemplate, structuredData)
        : sanitizeHtml(contentRef.current?.innerHTML ?? "");

      // Determine note_type automatically
      let noteType = "other";
      if (linkedTradeId) {
        noteType = "trade";
      } else if (appliedTemplate === "morning-plan") {
        noteType = "daily";
      }

      const payload: Record<string, unknown> = {
        title: (formData.get("title") as string) || null,
        content: htmlContent,
        tags: selectedTag ? [selectedTag] : [],
        trade_id: linkedTradeId,
        auto_link_on_import: autoLinkOnImport,
        note_type: noteType,
        note_date: noteDate ? new Date(noteDate).toISOString() : new Date().toISOString(),
      };

      if (!payload.content || payload.content === "<br>") {
        setError("Please add some content before saving.");
        return;
      }

      let dbError;
      if (editNote) {
        ({ error: dbError } = await supabase
          .from("journal_notes")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editNote.id));
      } else {
        ({ error: dbError } = await supabase.from("journal_notes").insert(payload));
        if (!dbError) {
          try {
            const { awardXP } = await import("@/lib/xp/engine");
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await awardXP(supabase, user.id, "journal_entry");
            }
          } catch { /* XP tables may not exist yet */ }
        }
      }

      if (dbError) {
        setError(dbError.message);
        return;
      }

      onClose();
      onSaved();
    } catch (err) {
      console.error("[NoteEditor] saveNote error:", err);
      setError(err instanceof Error ? err.message : "Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`glass border border-border/50 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
        isFullscreen
          ? "w-full h-full max-w-full max-h-full rounded-none"
          : "w-full max-w-4xl max-h-[90vh]"
      }`}>
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">{editNote ? "Edit Note" : "New Note"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={saveNote} className="flex flex-col flex-1 overflow-hidden">
          {/* Title + Tag row */}
          <div className="px-5 pt-4 shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">Note Title</label>
                <input name="title" defaultValue={editNote?.title ?? ""} placeholder="Note Title" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-semibold focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">Note Tag</label>
                <select
                  value={selectedTag ?? ""}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
                >
                  <option value="">No Tag</option>
                  {tagOptions.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Note Date */}
          <div className="px-5 pt-3 shrink-0">
            <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">Note Date</label>
            <input
              type="datetime-local"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>

          {/* Template selector */}
          {!editNote && (
            <div className="px-5 pt-3 shrink-0">
              <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5 font-semibold">Note Template</label>
              <TemplateSelector
                templates={TEMPLATE_LIST}
                contentRef={contentRef}
                onApply={handleTemplateApply}
                hasContent={hasContent()}
                disabled={saving}
              />
              <p className="text-[11px] text-muted/60 mt-1.5 italic">
                Note: Applying a note template removes all contents of the current note.
              </p>
            </div>
          )}

          {/* Editor area */}
          <div className="px-5 pt-3 pb-5 space-y-3 overflow-y-auto flex-1">
            {useStructured ? (
              <>
                <label className="block text-[11px] uppercase tracking-wider text-muted font-semibold">
                  {TEMPLATES.find((t) => t.id === appliedTemplate)?.label ?? "Template"}
                </label>
                <StructuredTemplateForm
                  templateId={appliedTemplate}
                  data={structuredData}
                  onChange={setStructuredData}
                />
              </>
            ) : (
              <>
                <label className="block text-[11px] uppercase tracking-wider text-muted font-semibold">Notes</label>
                <EditorToolbar
                  contentRef={contentRef}
                  onImageUpload={handleImageUpload}
                  uploading={uploading}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen((f) => !f)}
                />

                <div
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  onPaste={handlePaste}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`w-full overflow-y-auto px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm leading-relaxed focus:outline-none focus:border-accent/50 transition-all note-content [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2 [&_h2]:font-semibold [&_h2]:text-base [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_hr]:border-border [&_hr]:my-3 [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono ${
                    isFullscreen ? "min-h-[400px] flex-1" : "min-h-[200px] max-h-[400px]"
                  }`}
                  data-placeholder="What did you learn today? Paste screenshots directly..."
                />
                <p className="text-[10px] text-muted/40">
                  {uploading ? "Uploading image..." : "Paste images from clipboard or drag & drop screenshots"}
                </p>
              </>
            )}

            {trades.length > 0 && (
              <TradeLinker
                trades={trades}
                selectedTradeId={linkedTradeId}
                onSelect={setLinkedTradeId}
                autoLinkOnImport={autoLinkOnImport}
                onAutoLinkChange={setAutoLinkOnImport}
              />
            )}

            {error && (
              <p className="text-sm text-loss bg-loss/10 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300 disabled:opacity-50">
              {saving ? "Saving..." : editNote ? "Update Note" : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
