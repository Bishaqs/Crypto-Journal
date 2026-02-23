"use client";

import { useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { JournalNote } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { uploadJournalImage } from "@/lib/image-upload";
import {
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  Image,
  Heading2,
  List,
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

interface NoteEditorProps {
  editNote?: JournalNote | null;
  initialTemplate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function NoteEditor({ editNote = null, initialTemplate = "free", onClose, onSaved }: NoteEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  function execFormat(command: string, value?: string) {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  }

  function insertLink() {
    const url = prompt("Enter URL:");
    if (url) execFormat("createLink", url);
  }

  async function insertImage(file: File) {
    setUploading(true);
    try {
      const url = await uploadJournalImage(file);
      execFormat("insertImage", url);
    } catch {
      // Silently fail — image just won't appear
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

  async function saveNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const htmlContent = sanitizeHtml(contentRef.current?.innerHTML ?? "");
    const payload = {
      title: (formData.get("title") as string) || null,
      content: htmlContent,
      tags: ((formData.get("tags") as string) || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (!payload.content || payload.content === "<br>") return;

    if (editNote) {
      await supabase
        .from("journal_notes")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editNote.id);
    } else {
      await supabase.from("journal_notes").insert(payload);
    }
    onClose();
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-border/50 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">{editNote ? "Edit Note" : "New Note"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all">
            <X size={20} />
          </button>
        </div>

        {!editNote && (
          <div className="flex gap-2 px-5 pt-4 overflow-x-auto shrink-0">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTemplate(t.id);
                  if (contentRef.current) {
                    contentRef.current.innerHTML = sanitizeHtml(t.content);
                    contentRef.current.focus();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedTemplate === t.id
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "bg-background border border-border text-muted hover:text-foreground"
                }`}
              >
                <t.icon size={12} />
                {t.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={saveNote} className="p-5 space-y-4 overflow-y-auto flex-1">
          <input name="title" defaultValue={editNote?.title ?? ""} placeholder="Title (optional)" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-base font-semibold focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50" />
          <div className="flex items-center gap-1 p-2 rounded-xl bg-background border border-border">
            <button type="button" onClick={() => execFormat("bold")} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all" title="Bold"><Bold size={16} /></button>
            <button type="button" onClick={() => execFormat("italic")} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all" title="Italic"><Italic size={16} /></button>
            <button type="button" onClick={() => execFormat("underline")} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all" title="Underline"><Underline size={16} /></button>
            <button type="button" onClick={() => execFormat("strikethrough")} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all" title="Strikethrough"><Strikethrough size={16} /></button>
            <div className="w-px h-5 bg-border mx-1" />
            <button type="button" onClick={() => execFormat("formatBlock", "h2")} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all" title="Heading"><Heading2 size={16} /></button>
            <button type="button" onClick={() => execFormat("insertUnorderedList")} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all" title="Bullet list"><List size={16} /></button>
            <div className="w-px h-5 bg-border mx-1" />
            <button type="button" onClick={insertLink} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all" title="Insert link"><Link2 size={16} /></button>
            <button type="button" onClick={handleImageUpload} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all" title="Upload image"><Image size={16} /></button>
          </div>
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(editNote?.content ?? (TEMPLATES.find((t) => t.id === selectedTemplate)?.content ?? "")) }}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="w-full min-h-[200px] max-h-[400px] overflow-y-auto px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm leading-relaxed focus:outline-none focus:border-accent/50 transition-all note-content [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2 [&_h2]:font-semibold [&_h2]:text-base [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-4"
            data-placeholder="What did you learn today? Paste screenshots directly..."
          />
          <p className="text-[10px] text-muted/40">
            {uploading ? "Uploading image..." : "Paste images from clipboard or drag & drop screenshots"}
          </p>
          <input name="tags" defaultValue={editNote?.tags?.join(", ") ?? ""} placeholder="Tags (comma separated): psychology, strategy, mistake" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50" />
          <button type="submit" className="w-full py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300">
            {editNote ? "Update Note" : "Save Note"}
          </button>
        </form>
      </div>
    </div>
  );
}
