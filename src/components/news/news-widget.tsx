"use client";

import { useState, useEffect, useCallback } from "react";
import { Newspaper, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { NewsCard } from "./news-card";
import type { NewsArticle, AssetCategory } from "@/lib/news/types";

const NEWS_LINKS: Record<AssetCategory, string> = {
  crypto: "/dashboard/news",
  stocks: "/dashboard/stocks/news",
  commodities: "/dashboard/commodities/news",
  forex: "/dashboard/forex/news",
  general: "/dashboard/news",
};

interface NewsWidgetProps {
  asset: AssetCategory;
}

export function NewsWidget({ asset }: NewsWidgetProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/news?asset=${asset}`);
      if (!res.ok) return;
      const data = await res.json();
      setArticles((data.articles ?? []).slice(0, 5));
    } catch {
      // Silently fail for widget — not critical
    } finally {
      setLoading(false);
    }
  }, [asset]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return (
    <div
      className="glass rounded-xl border border-border/50 p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-accent" />
          <span className="text-xs font-semibold text-foreground">Latest News</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNews}
            disabled={loading}
            className="text-muted/50 hover:text-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            href={NEWS_LINKS[asset] || "/dashboard/news"}
            className="flex items-center gap-1 text-[10px] text-accent font-medium hover:underline"
          >
            View All <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {loading && articles.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded bg-foreground/5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-foreground/5 rounded w-3/4" />
                <div className="h-2 bg-foreground/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <p className="text-[10px] text-muted text-center py-4">No news available</p>
      )}

      {articles.length > 0 && (
        <div>
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} compact />
          ))}
        </div>
      )}
    </div>
  );
}
