import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { NewsArticle, AssetCategory, Sentiment } from "@/lib/news/types";
import { scoreArticle, type ScoringMeta } from "@/lib/news/scoring";

export const dynamic = "force-dynamic";

const COINDESK_NEWS = "https://data-api.coindesk.com/news/v1/article/list";
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

  const [cdRes, cpRes] = await Promise.allSettled([
    fetch(`${COINDESK_NEWS}?lang=EN&limit=30`, {
      next: { revalidate: 300 },
    }),
    process.env.CRYPTOPANIC_API_KEY
      ? fetch(
          `${CRYPTOPANIC_BASE}?auth_token=${process.env.CRYPTOPANIC_API_KEY}&public=true&kind=news&filter=hot`,
          { next: { revalidate: 300 } },
        )
      : Promise.resolve(null),
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

    // Deduplicate by id
    const seen = new Set<string>();
    articles = articles.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

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
