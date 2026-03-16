"use client";

import { NewsFeed } from "@/components/news/news-feed";

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <NewsFeed asset="crypto" />
    </div>
  );
}
