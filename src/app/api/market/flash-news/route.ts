import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { NewsArticle, FlashNewsResponse } from "@/lib/news/types";
import { applySourceCooldown, applyTimeDecay } from "@/lib/news/scoring";
import { fetchCryptoPanicImportant, fetchFinnhubFlash } from "@/lib/news/fetch-flash-news";

export const dynamic = "force-dynamic";
export const revalidate = 90;

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
