"use client";

import { Zap, ExternalLink } from "lucide-react";
import { useFlashNews } from "@/lib/news/flash-news-context";
import { PriorityBadge } from "./priority-badge";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function BreakingSection() {
  const { breakingArticles, importantArticles } = useFlashNews();
  const articles = [...breakingArticles, ...importantArticles].slice(0, 6);

  if (articles.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-red-400" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
          Flash News
        </span>
        <span className="text-[10px] text-muted">
          {articles.length} alert{articles.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-shrink-0 w-72 rounded-lg border p-3 transition-all hover:scale-[1.02] group ${
              article.priority === "breaking"
                ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
            }`}
            style={{
              borderLeftWidth: 3,
              borderLeftColor:
                article.priority === "breaking"
                  ? "rgb(239 68 68 / 0.6)"
                  : "rgb(245 158 11 / 0.5)",
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <PriorityBadge priority={article.priority} compact />
              <ExternalLink
                size={10}
                className="text-muted/30 group-hover:text-accent transition-colors flex-shrink-0 mt-0.5"
              />
            </div>
            <p className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors mb-2">
              {article.title}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-muted">
              <span>{article.source}</span>
              <span className="text-muted/40">{timeAgo(article.publishedAt)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
