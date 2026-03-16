export type AssetCategory = "crypto" | "stocks" | "commodities" | "forex" | "general";

export type Sentiment = "bullish" | "bearish" | "neutral";

export type NewsPriority = "breaking" | "important" | "normal";

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  imageUrl: string | null;
  publishedAt: string;
  sentiment: Sentiment | null;
  votes?: { positive: number; negative: number };
  assetCategory: AssetCategory;
  urgencyScore: number;
  priority: NewsPriority;
}

export interface NewsFeedResponse {
  articles: NewsArticle[];
  timestamp: number;
}

export interface FlashNewsResponse {
  breaking: NewsArticle[];
  important: NewsArticle[];
  timestamp: number;
}
