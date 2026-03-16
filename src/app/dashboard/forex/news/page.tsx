"use client";

import { NewsFeed } from "@/components/news/news-feed";

export default function ForexNewsPage() {
  return (
    <div className="space-y-6">
      <NewsFeed asset="forex" />
    </div>
  );
}
