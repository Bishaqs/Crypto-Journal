"use client";

import { FAQ_MAP, FAQ_CATEGORIES } from "@/lib/help-content";
import { sanitizeHtml } from "@/lib/sanitize";
import { useHelpCenter } from "@/lib/help-center-context";
import { ChevronRight } from "lucide-react";

const HTML_CLASSES =
  "[&_strong]:text-foreground [&_strong]:font-semibold [&_code]:bg-surface-hover [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent [&_code]:text-[11px] [&_a]:text-accent [&_a]:underline";

export function HelpCenterArticle({ articleId }: { articleId: string }) {
  const { openArticle, openCategory } = useHelpCenter();
  const entry = FAQ_MAP[articleId];

  if (!entry) {
    return (
      <div className="p-5 text-center">
        <p className="text-sm text-muted">Article not found.</p>
      </div>
    );
  }

  const categoryMeta = FAQ_CATEGORIES.find((c) => c.key === entry.category);
  const relatedEntries = entry.relatedIds
    .map((id) => FAQ_MAP[id])
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Category badge */}
      {categoryMeta && (
        <button
          onClick={() => openCategory(entry.category)}
          className="self-start px-2.5 py-1 rounded-lg bg-accent/10 text-[10px] font-semibold text-accent uppercase tracking-wider hover:bg-accent/20 transition-colors"
        >
          {categoryMeta.label}
        </button>
      )}

      {/* Question */}
      <h2 className="text-lg font-bold text-foreground leading-snug">
        {entry.question}
      </h2>

      {/* Answer */}
      <div
        className={`text-sm text-muted leading-relaxed ${HTML_CLASSES}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.answer) }}
      />

      {/* Related Articles */}
      {relatedEntries.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-2">
            Related articles
          </p>
          <div className="flex flex-col gap-1.5">
            {relatedEntries.map((related) => (
              <button
                key={related.id}
                onClick={() => openArticle(related.id)}
                className="flex items-center justify-between text-left px-3 py-2.5 rounded-xl border border-border/30 hover:border-accent/20 hover:bg-accent/5 transition-all group"
              >
                <span className="text-xs text-muted group-hover:text-foreground transition-colors">
                  {related.question}
                </span>
                <ChevronRight size={12} className="text-muted/40 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
