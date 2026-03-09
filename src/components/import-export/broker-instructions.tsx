"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Info, ExternalLink } from "lucide-react";
import type { BrokerInstruction } from "@/lib/import-export-types";

export function BrokerInstructions({ instruction }: { instruction: BrokerInstruction }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-accent">
          <FileText size={14} />
          {instruction.brokerName} Export Instructions
        </span>
        {expanded ? <ChevronDown size={14} className="text-accent" /> : <ChevronRight size={14} className="text-accent" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Steps */}
          <ol className="space-y-1.5">
            {instruction.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-foreground">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {/* File format & expected columns */}
          <div className="flex flex-wrap gap-4 pt-1">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">File Format</p>
              <span className="text-xs text-foreground px-2 py-1 rounded-md bg-surface border border-border">
                {instruction.fileFormat}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Expected Columns</p>
              <div className="flex flex-wrap gap-1">
                {instruction.expectedColumns.slice(0, 6).map((col) => (
                  <span key={col} className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                    {col}
                  </span>
                ))}
                {instruction.expectedColumns.length > 6 && (
                  <span className="text-[10px] text-muted">+{instruction.expectedColumns.length - 6} more</span>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {instruction.notes.length > 0 && (
            <div className="space-y-1 pt-1">
              {instruction.notes.map((note, i) => (
                <p key={i} className="flex gap-1.5 text-xs text-muted">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  {note}
                </p>
              ))}
            </div>
          )}

          {/* Export URL link */}
          {instruction.exportUrl && (
            <a
              href={instruction.exportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              Go to {instruction.brokerName} export page
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
