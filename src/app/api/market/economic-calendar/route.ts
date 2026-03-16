import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const FAIR_ECONOMY_URL =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

interface RawEvent {
  title: string;
  country: string;
  date: string; // MM-DD-YYYY
  time: string; // "8:30am" | "All Day" | "Tentative"
  impact: string; // "High" | "Medium" | "Low" | "Holiday"
  forecast: string;
  previous: string;
  url: string;
}

function normalizeDate(mmddyyyy: string): string {
  // MM-DD-YYYY → YYYY-MM-DD
  const match = mmddyyyy.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return mmddyyyy;
  return `${match[3]}-${match[1]}-${match[2]}`;
}

function normalizeImpact(impact: string): string {
  const lower = impact.toLowerCase();
  if (["high", "medium", "low", "holiday"].includes(lower)) return lower;
  return "low";
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`econ-cal:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) },
      }
    );
  }

  try {
    const res = await fetch(FAIR_ECONOMY_URL, {
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      // Feed unavailable — return empty gracefully
      const response = NextResponse.json({
        events: [],
        timestamp: Date.now(),
      });
      response.headers.set(
        "Cache-Control",
        "s-maxage=60, stale-while-revalidate=120"
      );
      return response;
    }

    const raw: RawEvent[] = await res.json();

    const events = raw.map((e) => ({
      title: e.title,
      country: e.country,
      date: normalizeDate(e.date),
      time: e.time || "All Day",
      impact: normalizeImpact(e.impact),
      forecast: e.forecast || null,
      previous: e.previous || null,
      url: e.url || "",
    }));

    const response = NextResponse.json({
      events,
      timestamp: Date.now(),
    });

    response.headers.set(
      "Cache-Control",
      "s-maxage=900, stale-while-revalidate=1800"
    );
    return response;
  } catch (err) {
    console.error(
      "[market/economic-calendar]",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { events: [], timestamp: Date.now() },
      { status: 200 }
    );
  }
}
