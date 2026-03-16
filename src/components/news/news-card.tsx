"use client";

import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { NewsArticle } from "@/lib/news/types";
import { PriorityBadge } from "./priority-badge";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SentimentBadge({ sentiment, votes }: Pick<NewsArticle, "sentiment" | "votes">) {
  if (!sentiment) return null;

  const config = {
    bullish: { icon: TrendingUp, label: "Bullish", className: "text-win bg-win/10" },
    bearish: { icon: TrendingDown, label: "Bearish", className: "text-loss bg-loss/10" },
    neutral: { icon: Minus, label: "Neutral", className: "text-muted bg-muted/10" },
  }[sentiment];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${config.className}`}
    >
      <Icon size={10} />
      {config.label}
      {votes && (votes.positive > 0 || votes.negative > 0) && (
        <span className="text-muted/60 ml-0.5">
          {votes.positive}/{votes.negative}
        </span>
      )}
    </span>
  );
}

interface NewsCardProps {
  article: NewsArticle;
  compact?: boolean;
}

export function NewsCard({ article, compact }: NewsCardProps) {
  if (compact) {
    return (
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 py-2.5 px-1 border-b border-border/30 last:border-0 hover:bg-foreground/[0.03] transition-colors group"
      >
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt=""
            className="w-10 h-10 rounded object-cover flex-shrink-0 mt-0.5"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
            {article.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <PriorityBadge priority={article.priority} compact />
            <span className="text-[10px] text-muted">{article.source}</span>
            <span className="text-[10px] text-muted/50">{timeAgo(article.publishedAt)}</span>
            <SentimentBadge sentiment={article.sentiment} votes={article.votes} />
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass rounded-xl border border-border/50 overflow-hidden hover:border-accent/30 transition-all group block"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {article.imageUrl && (
        <div className="w-full h-36 overflow-hidden relative">
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {article.priority !== "normal" && (
            <div className="absolute top-2 right-2">
              <PriorityBadge priority={article.priority} />
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors mb-2">
          {article.title}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted font-medium">{article.source}</span>
            <span className="text-[10px] text-muted/50">{timeAgo(article.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <SentimentBadge sentiment={article.sentiment} votes={article.votes} />
            <ExternalLink size={10} className="text-muted/40 group-hover:text-accent transition-colors" />
          </div>
        </div>
      </div>
    </a>
  );
}
