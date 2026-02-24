"use client";

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Image,
  Minus,
  Clock,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface EditorToolbarProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  onImageUpload: () => void;
  uploading: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

function execFormat(contentRef: React.RefObject<HTMLDivElement | null>, command: string, value?: string) {
  document.execCommand(command, false, value);
  contentRef.current?.focus();
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

type ToolbarButton = {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  action: () => void;
};

export function EditorToolbar({ contentRef, onImageUpload, uploading, isFullscreen, onToggleFullscreen }: EditorToolbarProps) {
  const fmt = (cmd: string, val?: string) => execFormat(contentRef, cmd, val);

  const groups: ToolbarButton[][] = [
    [
      { icon: Bold, title: "Bold", action: () => fmt("bold") },
      { icon: Italic, title: "Italic", action: () => fmt("italic") },
      { icon: Underline, title: "Underline", action: () => fmt("underline") },
      { icon: Strikethrough, title: "Strikethrough", action: () => fmt("strikethrough") },
    ],
    [
      { icon: Heading2, title: "Heading", action: () => fmt("formatBlock", "h2") },
      { icon: List, title: "Bullet list", action: () => fmt("insertUnorderedList") },
      { icon: ListOrdered, title: "Numbered list", action: () => fmt("insertOrderedList") },
    ],
    [
      { icon: AlignLeft, title: "Align left", action: () => fmt("justifyLeft") },
      { icon: AlignCenter, title: "Align center", action: () => fmt("justifyCenter") },
      { icon: AlignRight, title: "Align right", action: () => fmt("justifyRight") },
      { icon: AlignJustify, title: "Justify", action: () => fmt("justifyFull") },
    ],
    [
      { icon: Link2, title: "Insert link", action: () => insertLink(contentRef) },
      { icon: Image, title: uploading ? "Uploading..." : "Upload image", action: onImageUpload },
      { icon: Minus, title: "Horizontal rule", action: () => fmt("insertHorizontalRule") },
      { icon: Clock, title: "Insert timestamp", action: () => insertTimestamp(contentRef) },
    ],
  ];

  return (
    <div className="flex items-center gap-1 p-2 rounded-xl bg-background border border-border flex-wrap">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-5 bg-border mx-1" />}
          {group.map((btn) => (
            <button
              key={btn.title}
              type="button"
              onClick={btn.action}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
              title={btn.title}
            >
              <btn.icon size={16} />
            </button>
          ))}
        </div>
      ))}
      <div className="w-px h-5 bg-border mx-1" />
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all ml-auto"
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
}
