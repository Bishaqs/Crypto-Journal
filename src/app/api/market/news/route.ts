import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { NewsArticle, AssetCategory, Sentiment } from "@/lib/news/types";
import { scoreArticle, type ScoringMeta } from "@/lib/news/scoring";
import { fetchWhaleAlerts } from "@/lib/news/fetch-whale-alerts";

export const dynamic = "force-dynamic";

const COINDESK_NEWS = "https://data-api.coindesk.com/news/v1/article/list";

// ---------------------------------------------------------------------------
// Title-based deduplication
// ---------------------------------------------------------------------------

function titleWords(title: string): Set<string> {
  return new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2),
  );
}

function titleOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  for (const w of a) if (b.has(w)) common++;
  return common / Math.min(a.size, b.size);
}

const SOURCE_PRIORITY: Record<string, number> = {
  Reuters: 10, Bloomberg: 10, "Associated Press": 10,
  "Wall Street Journal": 9, "Financial Times": 9, CNBC: 8,
  "Whale Alert": 8, CoinDesk: 7, CoinTelegraph: 6,
};

function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const kept: NewsArticle[] = [];
  const keptWords: Set<string>[] = [];

  // Sort by source priority (highest first) so we keep the best version
  const sorted = [...articles].sort((a, b) => {
    const pa = SOURCE_PRIORITY[a.source] ?? 5;
    const pb = SOURCE_PRIORITY[b.source] ?? 5;
    return pb - pa;
  });

  for (const article of sorted) {
    const words = titleWords(article.title);
    const isDuplicate = keptWords.some((kw) => titleOverlap(words, kw) > 0.6);
    if (!isDuplicate) {
      kept.push(article);
      keptWords.push(words);
    }
  }

  return kept;
}
const CRYPTOPANIC_BASE = "https://cryptopanic.com/api/v1/posts/";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

// ---------------------------------------------------------------------------
// CoinDesk (formerly CryptoCompare) normalizer
// ---------------------------------------------------------------------------

interface CDArticle {
  ID: string;
  TITLE: string;
  URL: string;
  IMAGE_URL: string;
  PUBLISHED_ON: number;
  SOURCE_DATA: { NAME: string };
  CATEGORY_DATA: { NAME: string }[];
}

function normalizeCoinDesk(articles: CDArticle[]): NewsArticle[] {
  return articles.map((a) => {
    const publishedAt = new Date(a.PUBLISHED_ON * 1000).toISOString();
    const { urgencyScore, priority } = scoreArticle({ title: a.TITLE, publishedAt, sentiment: null });
    return {
      id: `cd-${a.ID}`,
      title: a.TITLE,
      url: a.URL,
      source: a.SOURCE_DATA?.NAME || "CoinDesk",
      imageUrl: a.IMAGE_URL || null,
      publishedAt,
      sentiment: null,
      assetCategory: "crypto" as AssetCategory,
      urgencyScore,
      priority,
    };
  });
}

// ---------------------------------------------------------------------------
// CryptoPanic normalizer
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

function normalizeCryptoPanic(results: CPResult[]): NewsArticle[] {
  return results.map((r) => {
    let sentiment: Sentiment | null = null;
    if (r.votes.positive > r.votes.negative * 2) sentiment = "bullish";
    else if (r.votes.negative > r.votes.positive * 2) sentiment = "bearish";
    else if (r.votes.positive > 0 || r.votes.negative > 0) sentiment = "neutral";

    const meta: ScoringMeta = { importantVotes: r.votes.important };
    const { urgencyScore, priority } = scoreArticle(
      { title: r.title, publishedAt: r.published_at, sentiment },
      meta,
    );

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

// ---------------------------------------------------------------------------
// Finnhub normalizer
// ---------------------------------------------------------------------------

interface FHArticle {
  id: number;
  headline: string;
  url: string;
  source: string;
  image: string;
  datetime: number;
  category: string;
  summary: string;
}

function normalizeFinnhub(
  articles: FHArticle[],
  assetCategory: AssetCategory,
): NewsArticle[] {
  return articles.map((a) => {
    const publishedAt = new Date(a.datetime * 1000).toISOString();
    const { urgencyScore, priority } = scoreArticle({ title: a.headline, publishedAt, sentiment: null });
    return {
      id: `fh-${a.id}`,
      title: a.headline,
      url: a.url,
      source: a.source,
      imageUrl: a.image || null,
      publishedAt,
      sentiment: null,
      assetCategory,
      urgencyScore,
      priority,
    };
  });
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchCryptoNews(): Promise<NewsArticle[]> {
  const results: NewsArticle[] = [];

  const [cdRes, cpRes, waRes] = await Promise.allSettled([
    fetch(`${COINDESK_NEWS}?lang=EN&limit=10`, {
      next: { revalidate: 300 },
    }),
    process.env.CRYPTOPANIC_API_KEY
      ? fetch(
          `${CRYPTOPANIC_BASE}?auth_token=${process.env.CRYPTOPANIC_API_KEY}&public=true&kind=news&filter=important`,
          { next: { revalidate: 300 } },
        )
      : Promise.resolve(null),
    fetchWhaleAlerts(),
  ]);

  if (cdRes.status === "fulfilled" && cdRes.value.ok) {
    const json = await cdRes.value.json();
    if (Array.isArray(json.Data)) results.push(...normalizeCoinDesk(json.Data));
  }

  if (
    cpRes.status === "fulfilled" &&
    cpRes.value &&
    "ok" in cpRes.value &&
    cpRes.value.ok
  ) {
    const json = await (cpRes.value as Response).json();
    if (json.results) results.push(...normalizeCryptoPanic(json.results));
  }

  // Whale Alert results come directly as NewsArticle[]
  if (waRes.status === "fulfilled") {
    results.push(...waRes.value);
  }

  return results;
}

async function fetchFinnhubNews(
  category: string,
  assetCategory: AssetCategory,
): Promise<NewsArticle[]> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return [];

  const res = await fetch(
    `${FINNHUB_BASE}/news?category=${category}&token=${token}`,
    { next: { revalidate: 300 } },
  );

  if (!res.ok) return [];
  const data: FHArticle[] = await res.json();
  return normalizeFinnhub(data, assetCategory);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`news:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const asset = (searchParams.get("asset") || "crypto") as AssetCategory;
  const sentimentFilter = searchParams.get("sentiment") as Sentiment | null;

  try {
    let articles: NewsArticle[] = [];

    switch (asset) {
      case "crypto":
        articles = await fetchCryptoNews();
        break;
      case "stocks":
        articles = await fetchFinnhubNews("general", "stocks");
        break;
      case "forex":
        articles = await fetchFinnhubNews("forex", "forex");
        break;
      case "commodities":
        articles = await fetchFinnhubNews("general", "commodities");
        break;
      case "general":
      default: {
        const [crypto, general] = await Promise.allSettled([
          fetchCryptoNews(),
          fetchFinnhubNews("general", "general"),
        ]);
        if (crypto.status === "fulfilled") articles.push(...crypto.value);
        if (general.status === "fulfilled") articles.push(...general.value);
        break;
      }
    }

    // Deduplicate by id + title similarity
    articles = deduplicateArticles(articles);

    // Sort newest first
    articles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    // Apply sentiment filter
    if (sentimentFilter) {
      articles = articles.filter((a) => a.sentiment === sentimentFilter);
    }

    const response = NextResponse.json({
      articles,
      timestamp: Date.now(),
    });

    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600",
    );
    return response;
  } catch (err) {
    console.error(
      "[market/news]",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 },
    );
  }
}
