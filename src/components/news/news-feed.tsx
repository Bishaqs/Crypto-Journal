"use client";

import { useState, useEffect, useCallback } from "react";
import { Newspaper, RefreshCw, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { NewsCard } from "./news-card";
import { BreakingSection } from "./breaking-section";
import type { NewsArticle, AssetCategory, Sentiment } from "@/lib/news/types";

const ASSET_LABELS: Record<string, string> = {
  crypto: "Crypto",
  stocks: "Stocks",
  commodities: "Commodities",
  forex: "Forex",
};

interface NewsFeedProps {
  asset: AssetCategory;
}

export function NewsFeed({ asset }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "asset">("asset");
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryAsset = tab === "all" ? "general" : asset;
      const params = new URLSearchParams({ asset: queryAsset });
      if (sentimentFilter) params.set("sentiment", sentimentFilter);

      const res = await fetch(`/api/market/news?${params}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch news");
    } finally {
      setLoading(false);
    }
  }, [asset, tab, sentimentFilter]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper size={20} className="text-accent" />
          <h1 className="text-xl font-bold text-foreground">Market News</h1>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tabs + Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-lg bg-foreground/[0.03] border border-border/30">
          <button
            onClick={() => setTab("asset")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === "asset"
                ? "bg-accent text-background shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {ASSET_LABELS[asset] || "Asset"} News
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === "all"
                ? "bg-accent text-background shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            All News
          </button>
        </div>

        {/* Sentiment filter — only for crypto tab */}
        {asset === "crypto" && tab === "asset" && (
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-muted" />
            <button
              onClick={() => setSentimentFilter(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                sentimentFilter === null
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground border border-transparent"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSentimentFilter("bullish")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                sentimentFilter === "bullish"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground border border-transparent"
              }`}
            >
              <TrendingUp size={10} />
              Bullish
            </button>
            <button
              onClick={() => setSentimentFilter("bearish")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                sentimentFilter === "bearish"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground border border-transparent"
              }`}
            >
              <TrendingDown size={10} />
              Bearish
            </button>
          </div>
        )}
      </div>

      {/* Flash / Breaking News */}
      <BreakingSection />

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-loss/30 bg-loss/5 p-3 text-xs text-loss">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && articles.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="glass rounded-xl border border-border/50 overflow-hidden animate-pulse"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="w-full h-36 bg-foreground/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-foreground/5 rounded w-3/4" />
                <div className="h-3 bg-foreground/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Articles grid */}
      {!loading && articles.length === 0 && !error && (
        <div className="text-center py-12 text-muted text-sm">
          No news articles found. Try a different filter or check back later.
        </div>
      )}

      {articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
