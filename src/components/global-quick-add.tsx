"use client";

import { useState, useEffect } from "react";
import { QuickTradeForm } from "@/components/quick-trade-form";

export function GlobalQuickAdd() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+N (Mac) or Ctrl+N (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        // Don't intercept if user is typing in an input/textarea/contenteditable
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  return (
    <QuickTradeForm
      onClose={() => setOpen(false)}
      onSaved={() => {
        setOpen(false);
        // Refresh trades on the current page
        window.dispatchEvent(new Event("stargate-trades-refresh"));
      }}
      onTradeCompleted={() => setOpen(false)}
      onSwitchToFull={() => setOpen(false)}
    />
  );
}
