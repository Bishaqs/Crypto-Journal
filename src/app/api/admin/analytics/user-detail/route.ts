import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const owner = await verifyOwner(supabase);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const [
      levelRes,
      streakRes,
      achievementCountRes,
      tradeCountRes,
      noteCountRes,
      checkinCountRes,
      xpEventsRes,
      prefsRes,
      coinsRes,
      profileRes,
      subRes,
    ] = await Promise.all([
      admin
        .from("user_levels")
        .select("current_level, total_xp, xp_today")
        .eq("user_id", userId)
        .maybeSingle(),

      admin
        .from("user_streaks")
        .select("current_streak, longest_streak, last_active_date")
        .eq("user_id", userId)
        .maybeSingle(),

      admin
        .from("user_achievements")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),

      admin
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),

      admin
        .from("journal_notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),

      admin
        .from("daily_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),

      admin
        .from("user_xp_events")
        .select("source, xp_amount, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),

      admin
        .from("user_preferences")
        .select("psychology_tier")
        .eq("user_id", userId)
        .maybeSingle(),

      admin
        .from("user_coins")
        .select("balance, total_earned, total_spent")
        .eq("user_id", userId)
        .maybeSingle(),

      admin
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", userId)
        .maybeSingle(),

      admin
        .from("user_subscriptions")
        .select("tier, is_trial, is_banned, is_owner, created_at, last_seen")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      level: levelRes.data?.current_level ?? 1,
      totalXp: levelRes.data?.total_xp ?? 0,
      xpToday: levelRes.data?.xp_today ?? 0,
      currentStreak: streakRes.data?.current_streak ?? 0,
      longestStreak: streakRes.data?.longest_streak ?? 0,
      lastActiveDate: streakRes.data?.last_active_date ?? null,
      achievementCount: achievementCountRes.count ?? 0,
      tradeCount: tradeCountRes.count ?? 0,
      noteCount: noteCountRes.count ?? 0,
      checkinCount: checkinCountRes.count ?? 0,
      recentXpEvents: xpEventsRes.data ?? [],
      psychologyTier: prefsRes.data?.psychology_tier ?? "simple",
      coins: {
        balance: coinsRes.data?.balance ?? 0,
        totalEarned: coinsRes.data?.total_earned ?? 0,
        totalSpent: coinsRes.data?.total_spent ?? 0,
      },
      displayName: profileRes.data?.display_name ?? null,
      subscription: subRes.data
        ? {
            tier: subRes.data.tier,
            isTrial: subRes.data.is_trial,
            isBanned: subRes.data.is_banned,
            isOwner: subRes.data.is_owner,
            createdAt: subRes.data.created_at,
            lastSeen: subRes.data.last_seen,
          }
        : null,
    });
  } catch (err) {
    console.error("[admin/analytics/user-detail] query failed:", err);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}
