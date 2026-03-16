import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { NewsArticle, AssetCategory, Sentiment, FlashNewsResponse } from "@/lib/news/types";
import { scoreArticle, applySourceCooldown, applyTimeDecay, type ScoringMeta } from "@/lib/news/scoring";

export const dynamic = "force-dynamic";
export const revalidate = 90;

const CRYPTOPANIC_BASE = "https://cryptopanic.com/api/v1/posts/";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

// ---------------------------------------------------------------------------
// CryptoPanic normalizer (filter=important for breaking news)
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

    const base = {
      title: r.title,
      publishedAt: r.published_at,
      sentiment,
    };

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

// ---------------------------------------------------------------------------
// Finnhub normalizer with scoring
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

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchCryptoPanicImportant(): Promise<NewsArticle[]> {
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

async function fetchFinnhubFlash(): Promise<NewsArticle[]> {
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
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`flash-news:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  try {
    const [cpResult, fhResult] = await Promise.allSettled([
      fetchCryptoPanicImportant(),
      fetchFinnhubFlash(),
    ]);

    let allArticles: NewsArticle[] = [];
    if (cpResult.status === "fulfilled") allArticles.push(...cpResult.value);
    if (fhResult.status === "fulfilled") allArticles.push(...fhResult.value);

    // Deduplicate
    const seen = new Set<string>();
    allArticles = allArticles.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

    // Apply anti-fatigue filters
    allArticles = applyTimeDecay(allArticles);
    allArticles = applySourceCooldown(allArticles);

    // Sort by urgency score descending
    allArticles.sort((a, b) => b.urgencyScore - a.urgencyScore);

    const breaking = allArticles.filter((a) => a.priority === "breaking").slice(0, 3);
    const important = allArticles.filter((a) => a.priority === "important").slice(0, 10);

    const response: FlashNewsResponse = { breaking, important, timestamp: Date.now() };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "s-maxage=90, stale-while-revalidate=180" },
    });
  } catch (err) {
    console.error("[market/flash-news]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch flash news" }, { status: 500 });
  }
}
