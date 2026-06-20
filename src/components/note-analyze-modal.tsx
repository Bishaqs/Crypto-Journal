"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, X, AlertCircle, RefreshCw } from "lucide-react";
import { formatAndSanitizeMarkdown } from "@/lib/sanitize";
import type { JournalNote } from "@/lib/types";

/**
 * AI analysis of a single journal note against the trader's note history.
 * Produces one report: scenario-probability estimate + pattern/contradiction analysis.
 */
export function NoteAnalyzeModal({ note, onClose }: { note: JournalNote; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/ai/analyze-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: note.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to analyze note.");
      } else {
        setReport(data.report ?? "");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [note.id]);

  useEffect(() => {
    run();
  }, [run]);

  const title = note.title?.trim() || "Untitled note";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Sparkles size={15} className="text-accent" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground leading-tight">AI Note Analysis</h3>
              <p className="text-xs text-muted truncate">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={run}
              disabled={loading}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all disabled:opacity-40"
              title="Regenerate"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="relative">
                <Sparkles size={28} className="text-accent animate-pulse" />
              </div>
              <p className="text-sm text-muted">Analyzing against your note history…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-loss/10 border border-loss/20 px-4 py-3 text-sm text-loss">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && report && (
            <div
              className="prose prose-sm prose-invert max-w-none [&_strong]:text-accent [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h2:first-child]:mt-0 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_ul]:space-y-1 [&_ul]:pl-4 [&_li]:text-muted [&_p]:text-muted [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatAndSanitizeMarkdown(report) }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <p className="text-[10px] text-muted/70 text-center">
            Grounded in your own notes · process & psychology coaching, not financial advice
          </p>
        </div>
      </div>
    </div>
  );
}
