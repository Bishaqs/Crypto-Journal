"use client";

import { NewsFeed } from "@/components/news/news-feed";

export default function CommoditiesNewsPage() {
  return (
    <div className="space-y-6">
      <NewsFeed asset="commodities" />
    </div>
  );
}
