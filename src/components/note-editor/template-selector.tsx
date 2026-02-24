"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserTemplate } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { X, BookmarkPlus } from "lucide-react";

type BuiltInTemplate = {
  id: string;
  label: string;
  content: string;
};

interface TemplateSelectorProps {
  templates: BuiltInTemplate[];
  contentRef: React.RefObject<HTMLDivElement | null>;
  onApply: (templateId: string, customContent?: string) => void;
  hasContent: boolean;
  disabled?: boolean;
}

export function TemplateSelector({ templates, contentRef, onApply, hasContent, disabled }: TemplateSelectorProps) {
  const [selected, setSelected] = useState("free");
  const [showWarning, setShowWarning] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<UserTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchCustomTemplates();
  }, []);

  async function fetchCustomTemplates() {
    const { data } = await supabase
      .from("user_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCustomTemplates(data as UserTemplate[]);
  }

  function handleApply() {
    const custom = customTemplates.find((t) => t.id === selected);
    if (custom) {
      if (hasContent && showWarning) {
        onApply(selected, custom.content);
        setShowWarning(false);
      } else if (hasContent) {
        setShowWarning(true);
      } else {
        onApply(selected, custom.content);
      }
      return;
    }

    if (hasContent && selected !== "free") {
      if (showWarning) {
        onApply(selected);
        setShowWarning(false);
      } else {
        setShowWarning(true);
      }
    } else {
      onApply(selected);
    }
  }

  async function handleSaveAsTemplate() {
    if (!templateName.trim()) return;
    const html = sanitizeHtml(contentRef.current?.innerHTML ?? "");
    if (!html || html === "<br>") return;

    setSaving(true);
    await supabase.from("user_templates").insert({ name: templateName.trim(), content: html });
    await fetchCustomTemplates();
    setSaving(false);
    setTemplateName("");
    setShowSaveInput(false);
    setSelected("free");
  }

  async function handleDeleteTemplate(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from("user_templates").delete().eq("id", id);
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selected === id) setSelected("free");
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          setShowWarning(false);
        }}
        disabled={disabled || saving}
        className="px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all disabled:opacity-50 min-w-[140px]"
      >
        <optgroup label="Built-in">
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </optgroup>
        {customTemplates.length > 0 && (
          <optgroup label="My Templates">
            {customTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <button
        type="button"
        onClick={handleApply}
        disabled={disabled || saving}
        className="px-4 py-2.5 rounded-xl bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
      >
        Apply
      </button>
      {showSaveInput ? (
        <>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleSaveAsTemplate(); }
              if (e.key === "Escape") { setShowSaveInput(false); setTemplateName(""); }
            }}
            placeholder="Template name..."
            autoFocus
            className="px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all min-w-[120px]"
          />
          <button
            type="button"
            onClick={handleSaveAsTemplate}
            disabled={!templateName.trim() || saving}
            className="px-3 py-2 rounded-xl bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setShowSaveInput(false); setTemplateName(""); }}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setShowSaveInput(true)}
          disabled={disabled || saving || !hasContent}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface text-xs text-muted hover:text-foreground hover:border-accent/30 transition-all disabled:opacity-30"
          title={!hasContent ? "Write content first" : "Save current content as a reusable template"}
        >
          <BookmarkPlus size={14} />
          Save as Template
        </button>
      )}
      {customTemplates.find((t) => t.id === selected) && !showSaveInput && (
        <button
          type="button"
          onClick={(e) => handleDeleteTemplate(selected, e)}
          className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-all"
          title="Delete template"
        >
          <X size={14} />
        </button>
      )}
      {showWarning && (
        <span className="text-[11px] text-loss">Click Apply again to replace content</span>
      )}
    </div>
  );
}
