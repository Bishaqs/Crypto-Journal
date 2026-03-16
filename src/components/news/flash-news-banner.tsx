"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Zap } from "lucide-react";
import { useFlashNews } from "@/lib/news/flash-news-context";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function FlashNewsBanner() {
  const { breakingArticles, dismiss, dismissAll } = useFlashNews();
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate every 6 seconds if multiple articles
  useEffect(() => {
    if (breakingArticles.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % breakingArticles.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [breakingArticles.length]);

  // Reset index if articles change
  useEffect(() => {
    if (activeIndex >= breakingArticles.length) setActiveIndex(0);
  }, [breakingArticles.length, activeIndex]);

  if (breakingArticles.length === 0) return null;

  const article = breakingArticles[activeIndex];
  if (!article) return null;

  return (
    <div className="sticky top-0 z-20 mb-4 animate-in slide-in-from-top duration-300">
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Pulsing dot + BREAKING label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-[10px] font-black tracking-wider text-red-400 uppercase">
              Breaking
            </span>
          </div>

          {/* Article title */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 text-sm font-semibold text-foreground hover:text-accent transition-colors truncate"
          >
            {article.title}
          </a>

          {/* Meta */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0 text-[10px] text-muted">
            <span>{article.source}</span>
            <span className="text-muted/40">{timeAgo(article.publishedAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-foreground/10 transition-colors text-muted hover:text-foreground"
            >
              <ExternalLink size={12} />
            </a>
            <button
              onClick={() => dismiss(article.id)}
              className="p-1 rounded hover:bg-foreground/10 transition-colors text-muted hover:text-foreground"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Multi-article indicator + dismiss all */}
        {breakingArticles.length > 1 && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-red-500/10">
            <div className="flex items-center gap-1.5">
              {breakingArticles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === activeIndex ? "bg-red-400 w-3" : "bg-red-400/30"
                  }`}
                />
              ))}
              <span className="text-[10px] text-red-400/60 ml-1">
                {activeIndex + 1}/{breakingArticles.length}
              </span>
            </div>
            <button
              onClick={dismissAll}
              className="text-[10px] text-muted hover:text-foreground transition-colors"
            >
              Dismiss all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
