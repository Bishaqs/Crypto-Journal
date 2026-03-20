import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { TradeMarketContext, CalendarEvent } from "@/lib/market/types";

export const dynamic = "force-dynamic";

const FAIR_ECONOMY_URL =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const FNG_URL = "https://api.alternative.me/fng/";

const HIGH_IMPACT_EVENTS = [
  "Federal Funds Rate",
  "FOMC",
  "Non-Farm Employment Change",
  "CPI m/m",
  "CPI y/y",
  "Core CPI",
  "GDP",
  "PCE",
  "Unemployment Rate",
  "PPI",
];

function normalizeDate(mmddyyyy: string): string {
  const match = mmddyyyy.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return mmddyyyy;
  return `${match[3]}-${match[1]}-${match[2]}`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`trade-ctx:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from) {
    return NextResponse.json({ error: "Missing 'from' parameter" }, { status: 400 });
  }

  const entryDate = new Date(from);
  const exitDate = to ? new Date(to) : null;

  try {
    // Fetch calendar events + Fear & Greed in parallel
    const [calRes, fngRes] = await Promise.allSettled([
      fetch(FAIR_ECONOMY_URL, { next: { revalidate: 900 } }),
      fetch(`${FNG_URL}?limit=30`, { next: { revalidate: 300 } }),
    ]);

    // Process calendar events
    let calendarEvents: CalendarEvent[] = [];
    if (calRes.status === "fulfilled" && calRes.value.ok) {
      const raw = await calRes.value.json();
      calendarEvents = (raw as Array<{ title: string; country: string; date: string; time: string; impact: string; forecast: string; previous: string }>).map((e) => ({
        title: e.title,
        country: e.country,
        date: normalizeDate(e.date),
        time: e.time || "All Day",
        impact: (["high", "medium", "low", "holiday"].includes(e.impact?.toLowerCase()) ? e.impact.toLowerCase() : "low") as CalendarEvent["impact"],
        forecast: e.forecast || null,
        previous: e.previous || null,
      }));
    }

    // Find events near entry (same day ±1 day)
    const entryDateStr = entryDate.toISOString().split("T")[0];
    const entryDayBefore = new Date(entryDate.getTime() - 86400000).toISOString().split("T")[0];
    const entryDayAfter = new Date(entryDate.getTime() + 86400000).toISOString().split("T")[0];

    const eventsNearEntry = calendarEvents.filter(
      (e) => e.date >= entryDayBefore && e.date <= entryDayAfter && e.impact !== "holiday",
    );

    // Find events near exit
    let eventsNearExit: CalendarEvent[] = [];
    if (exitDate) {
      const exitDateStr = exitDate.toISOString().split("T")[0];
      const exitDayBefore = new Date(exitDate.getTime() - 86400000).toISOString().split("T")[0];
      const exitDayAfter = new Date(exitDate.getTime() + 86400000).toISOString().split("T")[0];
      eventsNearExit = calendarEvents.filter(
        (e) => e.date >= exitDayBefore && e.date <= exitDayAfter && e.impact !== "holiday",
      );
    }

    // Check for high-impact event near entry
    let highImpactAlert: string | null = null;
    const highImpactNearEntry = eventsNearEntry.find(
      (e) => e.impact === "high" && HIGH_IMPACT_EVENTS.some((h) => e.title.includes(h)),
    );
    if (highImpactNearEntry) {
      const diff = Math.abs(
        new Date(highImpactNearEntry.date).getTime() - entryDate.getTime(),
      );
      const hours = Math.round(diff / 3600000);
      const when = highImpactNearEntry.date === entryDateStr
        ? "on the same day as"
        : hours <= 24
        ? `${hours}h ${new Date(highImpactNearEntry.date) < entryDate ? "before" : "after"}`
        : "near";
      highImpactAlert = `${highImpactNearEntry.title} was ${when} your entry`;
    }

    // Process Fear & Greed
    let fearGreedAtEntry: { value: number; classification: string } | null = null;
    if (fngRes.status === "fulfilled" && fngRes.value.ok) {
      const fngData = await fngRes.value.json();
      if (fngData.data && Array.isArray(fngData.data)) {
        // Find closest F&G value to entry date
        const entryTs = Math.floor(entryDate.getTime() / 1000);
        let closest = fngData.data[0];
        let minDiff = Math.abs(Number(closest.timestamp) - entryTs);
        for (const d of fngData.data) {
          const diff = Math.abs(Number(d.timestamp) - entryTs);
          if (diff < minDiff) {
            minDiff = diff;
            closest = d;
          }
        }
        if (closest) {
          fearGreedAtEntry = {
            value: Number(closest.value),
            classification: closest.value_classification,
          };
        }
      }
    }

    const result: TradeMarketContext = {
      eventsNearEntry: eventsNearEntry.slice(0, 5),
      eventsNearExit: eventsNearExit.slice(0, 5),
      newsNearEntry: [], // Would need historical news API — skip for now
      fearGreedAtEntry,
      highImpactAlert,
    };

    const response = NextResponse.json(result);
    response.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
    return response;
  } catch (err) {
    console.error("[trade-context]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { eventsNearEntry: [], eventsNearExit: [], newsNearEntry: [], fearGreedAtEntry: null, highImpactAlert: null },
      { status: 200 },
    );
  }
}
