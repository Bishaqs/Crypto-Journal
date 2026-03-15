"use client";

import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, MessageCircle, Sparkles, ChevronRight } from "lucide-react";
import {
  FAQ_CATEGORIES,
  FAQ_ENTRIES,
  FAQ_MAP,
  scoreFaq,
  type FaqCategory,
  type FaqEntry,
} from "@/lib/help-content";
import { useHelpCenter } from "@/lib/help-center-context";
import { useGuide } from "@/components/stargate-guide/guide-context";

const POPULAR_CATEGORIES: FaqCategory[] = [
  "trading-journal",
  "analytics",
  "ai-coach",
  "market-tools",
  "getting-started",
  "glossary",
];

const HTML_CLASSES =
  "[&_strong]:text-foreground [&_strong]:font-semibold [&_code]:bg-surface-hover [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent [&_code]:text-[11px]";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function HelpCenterHome() {
  const { state, openArticle, openCategory, setSearch, closeHelpCenter } = useHelpCenter();
  const { toggleMenu, setMenuPanel } = useGuide();
  const [localQuery, setLocalQuery] = useState(state.searchQuery);
  const [results, setResults] = useState<FaqEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(localQuery);
      if (localQuery.trim()) {
        const scored = FAQ_ENTRIES
          .map((e) => ({ entry: e, score: scoreFaq(e, localQuery) }))
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        setResults(scored.map((s) => s.entry));
      } else {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [localQuery, setSearch]);

  const gettingStarted = FAQ_ENTRIES.filter((e) => e.category === "getting-started").slice(0, 4);

  function openChat() {
    closeHelpCenter();
    toggleMenu();
    setTimeout(() => setMenuPanel("chat"), 100);
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50" />
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Find your answer"
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all"
        />
      </div>

      {/* Search Results */}
      {localQuery.trim() && results.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-muted font-semibold uppercase tracking-widest">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((entry) => (
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
      ) : localQuery.trim() && results.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">
          No results found. Try different keywords.
        </p>
      ) : (
        <>
          {/* Popular Categories */}
          <div>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-2">
              Popular categories
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CATEGORIES.map((key) => {
                const cat = FAQ_CATEGORIES.find((c) => c.key === key);
                if (!cat) return null;
                return (
                  <button
                    key={key}
                    onClick={() => openCategory(key)}
                    className="px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium text-muted hover:text-foreground hover:border-accent/30 hover:bg-accent/5 transition-all"
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Cards */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => openCategory("getting-started")}
              className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-accent/10">
                <BookOpen size={18} className="text-accent" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">Knowledge base</p>
                <p className="text-xs text-muted">Find articles covering everything you need</p>
              </div>
              <ChevronRight size={16} className="text-muted group-hover:text-accent transition-colors" />
            </button>

            <button
              onClick={openChat}
              className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-accent/10">
                <MessageCircle size={18} className="text-accent" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">Chat assistant</p>
                <p className="text-xs text-muted">Get instant help with your questions</p>
              </div>
              <ChevronRight size={16} className="text-muted group-hover:text-accent transition-colors" />
            </button>
          </div>

          {/* Getting Started */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted font-semibold uppercase tracking-widest">
                Getting started
              </p>
              <button
                onClick={() => openCategory("getting-started")}
                className="text-[10px] text-accent/70 hover:text-accent transition-colors"
              >
                View all
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {gettingStarted.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => openArticle(entry.id)}
                  className="flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border border-border/30 hover:border-accent/20 hover:bg-accent/5 transition-all group"
                >
                  <Sparkles size={12} className="text-accent/50 shrink-0" />
                  <span className="text-xs text-muted group-hover:text-foreground transition-colors">
                    {entry.question}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Browse All */}
          <div>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-2">
              Browse by topic
            </p>
            <div className="flex flex-col gap-1.5">
              {FAQ_CATEGORIES.map((cat) => {
                const count = FAQ_ENTRIES.filter((e) => e.category === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => openCategory(cat.key)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/30 hover:border-accent/20 hover:bg-accent/5 transition-all group"
                  >
                    <span className="text-xs text-muted group-hover:text-foreground transition-colors">
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-muted/50">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
