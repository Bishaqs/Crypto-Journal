"use client";

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Image,
  Minus,
  Clock,
} from "lucide-react";

interface CompactToolbarProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  onImageUpload: () => void;
  uploading: boolean;
}

function execFormat(
  contentRef: React.RefObject<HTMLDivElement | null>,
  command: string,
  value?: string,
) {
  contentRef.current?.focus();
  document.execCommand(command, false, value);
}

function insertLink(contentRef: React.RefObject<HTMLDivElement | null>) {
  const url = prompt("Enter URL:");
  if (url) execFormat(contentRef, "createLink", url);
}

function insertTimestamp(contentRef: React.RefObject<HTMLDivElement | null>) {
  const now = new Date();
  const formatted = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  execFormat(contentRef, "insertText", formatted);
}

type ToolbarItem =
  | { icon: React.ComponentType<{ size?: number }>; title: string; action: () => void }
  | null;

export function CompactToolbar({ contentRef, onImageUpload, uploading }: CompactToolbarProps) {
  const fmt = (cmd: string, val?: string) => execFormat(contentRef, cmd, val);

  const items: ToolbarItem[] = [
    { icon: Bold, title: "Bold", action: () => fmt("bold") },
    { icon: Italic, title: "Italic", action: () => fmt("italic") },
    { icon: Underline, title: "Underline", action: () => fmt("underline") },
    { icon: Strikethrough, title: "Strikethrough", action: () => fmt("strikethrough") },
    null,
    { icon: Heading2, title: "Heading", action: () => fmt("formatBlock", "h2") },
    { icon: List, title: "Bullet list", action: () => fmt("insertUnorderedList") },
    { icon: ListOrdered, title: "Numbered list", action: () => fmt("insertOrderedList") },
    null,
    { icon: Link2, title: "Insert link", action: () => insertLink(contentRef) },
    { icon: Image, title: uploading ? "Uploading..." : "Upload image", action: onImageUpload },
    { icon: Minus, title: "Horizontal rule", action: () => fmt("insertHorizontalRule") },
    { icon: Clock, title: "Insert timestamp", action: () => insertTimestamp(contentRef) },
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 rounded-t-xl bg-surface/50 border border-b-0 border-border ring-1 ring-white/5 flex-wrap">
      {items.map((item, i) =>
        item === null ? (
          <div key={`sep-${i}`} className="w-px h-4 bg-border mx-0.5" />
        ) : (
          <button
            key={item.title}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              item.action();
            }}
            className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-surface-hover transition-all"
            title={item.title}
          >
            <item.icon size={14} />
          </button>
        ),
      )}
    </div>
  );
}
