"use client";

import { NewsFeed } from "@/components/news/news-feed";

export default function StockNewsPage() {
  return (
    <div className="space-y-6">
      <NewsFeed asset="stocks" />
    </div>
  );
}
