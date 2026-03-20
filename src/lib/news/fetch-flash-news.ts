/**
 * Shared flash news fetch functions — used by both the flash-news API route
 * and the AI stream route for market context injection.
 */
import type { NewsArticle, AssetCategory, Sentiment } from "./types";
import { scoreArticle, type ScoringMeta } from "./scoring";

const CRYPTOPANIC_BASE = "https://cryptopanic.com/api/v1/posts/";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

// ---------------------------------------------------------------------------
// CryptoPanic
// ---------------------------------------------------------------------------

interface CPResult {
  id: number;
  title: string;
  url: string;
  source: { title: string };
  published_at: string;
  votes: { positive: number; negative: number; important: number };
  metadata?: { image?: string };
}

function normalizeCryptoPanicFlash(results: CPResult[]): NewsArticle[] {
  return results.map((r) => {
    let sentiment: Sentiment | null = null;
    if (r.votes.positive > r.votes.negative * 2) sentiment = "bullish";
    else if (r.votes.negative > r.votes.positive * 2) sentiment = "bearish";
    else if (r.votes.positive > 0 || r.votes.negative > 0) sentiment = "neutral";

    const meta: ScoringMeta = {
      fromImportantFilter: true,
      importantVotes: r.votes.important,
    };

    const base = { title: r.title, publishedAt: r.published_at, sentiment };
    const { urgencyScore, priority } = scoreArticle(base, meta);

    return {
      id: `cp-${r.id}`,
      title: r.title,
      url: r.url,
      source: r.source.title,
      imageUrl: r.metadata?.image || null,
      publishedAt: r.published_at,
      sentiment,
      votes: { positive: r.votes.positive, negative: r.votes.negative },
      assetCategory: "crypto" as AssetCategory,
      urgencyScore,
      priority,
    };
  });
}

export async function fetchCryptoPanicImportant(): Promise<NewsArticle[]> {
  const key = process.env.CRYPTOPANIC_API_KEY;
  if (!key) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(
      `${CRYPTOPANIC_BASE}?auth_token=${key}&public=true&kind=news&filter=important`,
      { next: { revalidate: 90 }, signal: controller.signal },
    );
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.results) return [];
    return normalizeCryptoPanicFlash(json.results);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Finnhub
// ---------------------------------------------------------------------------

interface FHArticle {
  id: number;
  headline: string;
  url: string;
  source: string;
  image: string;
  datetime: number;
  category: string;
}

const PRIORITY_SOURCES = new Set([
  "reuters", "bloomberg", "cnbc", "wsj", "financial times",
  "associated press", "bbc", "the wall street journal",
]);

function normalizeFinnhubFlash(articles: FHArticle[], assetCategory: AssetCategory): NewsArticle[] {
  return articles.map((a) => {
    const isPriority = PRIORITY_SOURCES.has(a.source.toLowerCase());
    const meta: ScoringMeta = { fromPriorityDomain: isPriority };
    const base = {
      title: a.headline,
      publishedAt: new Date(a.datetime * 1000).toISOString(),
      sentiment: null as Sentiment | null,
    };
    const { urgencyScore, priority } = scoreArticle(base, meta);

    return {
      id: `fh-${a.id}`,
      title: a.headline,
      url: a.url,
      source: a.source,
      imageUrl: a.image || null,
      publishedAt: base.publishedAt,
      sentiment: null,
      assetCategory,
      urgencyScore,
      priority,
    };
  });
}

export async function fetchFinnhubFlash(): Promise<NewsArticle[]> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(
      `${FINNHUB_BASE}/news?category=general&token=${token}`,
      { next: { revalidate: 90 }, signal: controller.signal },
    );
    if (!res.ok) return [];
    const data: FHArticle[] = await res.json();
    return normalizeFinnhubFlash(data, "general");
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Combined fetch (for AI context)
// ---------------------------------------------------------------------------

export async function fetchTopMarketNews(limit = 5): Promise<NewsArticle[]> {
  const [cpResult, fhResult] = await Promise.allSettled([
    fetchCryptoPanicImportant(),
    fetchFinnhubFlash(),
  ]);

  let articles: NewsArticle[] = [];
  if (cpResult.status === "fulfilled") articles.push(...cpResult.value);
  if (fhResult.status === "fulfilled") articles.push(...fhResult.value);

  // Deduplicate
  const seen = new Set<string>();
  articles = articles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Sort by urgency, take top N
  articles.sort((a, b) => b.urgencyScore - a.urgencyScore);
  return articles.slice(0, limit);
}
