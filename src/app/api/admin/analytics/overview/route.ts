import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function verifyOwner(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  let isOwner = !!(ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  if (!isOwner) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("is_owner")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub?.is_owner) isOwner = true;
  }

  return isOwner ? user : null;
}

export async function GET() {
  const supabase = await createClient();
  const owner = await verifyOwner(supabase);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  try {
    const [
      signupsRes,
      allSubsRes,
      xpEventsRes,
      wauRes,
      dauTodayRes,
    ] = await Promise.all([
      // User signups in last 90 days
      admin
        .from("user_subscriptions")
        .select("created_at")
        .gte("created_at", ninetyDaysAgo)
        .order("created_at", { ascending: true }),

      // All subscriptions for tier distribution
      admin
        .from("user_subscriptions")
        .select("tier, last_seen"),

      // XP events in last 30 days for engagement breakdown
      admin
        .from("user_xp_events")
        .select("source, created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true }),

      // WAU: distinct users active in last 7 days
      admin
        .from("user_subscriptions")
        .select("user_id", { count: "exact", head: true })
        .gte("last_seen", sevenDaysAgo)
        .not("last_seen", "is", null),

      // DAU today
      admin
        .from("user_subscriptions")
        .select("user_id", { count: "exact", head: true })
        .gte("last_seen", todayStart)
        .not("last_seen", "is", null),
    ]);

    // --- User Growth (daily signups, last 90 days) ---
    const growthMap = new Map<string, number>();
    for (const row of signupsRes.data ?? []) {
      const day = row.created_at.slice(0, 10); // YYYY-MM-DD
      growthMap.set(day, (growthMap.get(day) ?? 0) + 1);
    }
    const userGrowth = Array.from(growthMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- DAU (last 30 days) ---
    const dauMap = new Map<string, Set<string>>();
    for (const row of (allSubsRes.data ?? [])) {
      if (!row.last_seen) continue;
      const day = row.last_seen.slice(0, 10);
      if (day >= thirtyDaysAgo.slice(0, 10)) {
        if (!dauMap.has(day)) dauMap.set(day, new Set());
        // We're iterating user_subscriptions which has one row per user, so each is distinct
        dauMap.get(day)!.add(day); // count as 1
      }
    }
    // Re-derive DAU from last_seen field — count per day
    const dauCountMap = new Map<string, number>();
    for (const row of (allSubsRes.data ?? [])) {
      if (!row.last_seen) continue;
      const day = row.last_seen.slice(0, 10);
      if (day >= thirtyDaysAgo.slice(0, 10)) {
        dauCountMap.set(day, (dauCountMap.get(day) ?? 0) + 1);
      }
    }
    const dau = Array.from(dauCountMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Engagement Breakdown (last 30 days, grouped by day + source) ---
    const engagementMap = new Map<string, Record<string, number>>();
    for (const row of xpEventsRes.data ?? []) {
      const day = row.created_at.slice(0, 10);
      if (!engagementMap.has(day)) engagementMap.set(day, {});
      const dayData = engagementMap.get(day)!;
      const source = row.source as string;
      dayData[source] = (dayData[source] ?? 0) + 1;
    }
    const engagement = Array.from(engagementMap.entries())
      .map(([date, sources]) => ({ date, ...sources }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Tier Distribution ---
    const tierCounts: Record<string, number> = { free: 0, pro: 0, max: 0 };
    for (const row of allSubsRes.data ?? []) {
      const t = row.tier as string;
      if (t in tierCounts) tierCounts[t]++;
      else tierCounts[t] = 1;
    }
    const tierDistribution = Object.entries(tierCounts).map(([tier, count]) => ({ tier, count }));

    return NextResponse.json({
      userGrowth,
      dau,
      dauToday: dauTodayRes.count ?? 0,
      wau: wauRes.count ?? 0,
      engagement,
      tierDistribution,
    });
  } catch (err) {
    console.error("[admin/analytics/overview] query failed:", err);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}
