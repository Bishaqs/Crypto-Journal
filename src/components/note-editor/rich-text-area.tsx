"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { uploadJournalImage } from "@/lib/image-upload";
import { sanitizeHtml } from "@/lib/sanitize";

interface RichTextAreaProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextArea({ value, onChange, placeholder, minHeight = "120px" }: RichTextAreaProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [uploading, setUploading] = useState(false);

  // Initialize content once on mount
  useEffect(() => {
    if (!initialized.current && contentRef.current) {
      contentRef.current.innerHTML = sanitizeHtml(value || "");
      initialized.current = true;
    }
  }, []);

  const handleInput = useCallback(() => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  }, [onChange]);

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
      handleInput();
    } catch {
      // Image upload failed — user can retry
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

  return (
    <div className="relative">
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full overflow-y-auto px-4 py-3 rounded-xl bg-background border border-border ring-1 ring-white/5 text-foreground text-sm leading-relaxed focus:outline-none focus:border-accent/50 transition-all note-content [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
      {uploading && (
        <p className="text-[10px] text-accent mt-1">Uploading image...</p>
      )}
    </div>
  );
}
