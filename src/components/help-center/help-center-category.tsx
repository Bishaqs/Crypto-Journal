"use client";

import { FAQ_CATEGORIES, FAQ_ENTRIES, type FaqCategory } from "@/lib/help-content";
import { useHelpCenter } from "@/lib/help-center-context";
import { ChevronRight } from "lucide-react";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function HelpCenterCategory({ categoryKey }: { categoryKey: FaqCategory }) {
  const { openArticle } = useHelpCenter();
  const categoryMeta = FAQ_CATEGORIES.find((c) => c.key === categoryKey);
  const entries = FAQ_ENTRIES.filter((e) => e.category === categoryKey);

  return (
    <div className="p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {categoryMeta?.label ?? categoryKey}
        </h2>
        <p className="text-xs text-muted mt-1">
          {entries.length} article{entries.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => openArticle(entry.id)}
            className="text-left p-3 rounded-xl border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all group"
          >
            <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
              {entry.question}
            </p>
            <p className="text-xs text-muted mt-1 line-clamp-2">
              {stripHtml(entry.answer).slice(0, 120)}...
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
