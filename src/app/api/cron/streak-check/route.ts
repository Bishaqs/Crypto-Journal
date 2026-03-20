import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStreakRiskEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Daily cron: Check for users whose streaks are at risk (haven't logged today)
 * and send a reminder email.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deadline = Date.now() + 8000; // 8s deadline (Vercel 10s limit)
  const supabase = createAdminClient();

  try {
    // Get today and yesterday in YYYY-MM-DD format
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Find users with active streaks (3+ days) who were last active yesterday or before
    // If last_active_date is yesterday, streak is still alive but at risk today
    // If last_active_date is 2+ days ago, streak is already broken — don't email
    const { data: atRiskStreaks, error } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak, last_active_date")
      .gte("current_streak", 3) // Only care about 3+ day streaks
      .eq("last_active_date", yesterday); // Last active yesterday = at risk today

    if (error) {
      console.error("[streak-check] DB error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!atRiskStreaks || atRiskStreaks.length === 0) {
      return NextResponse.json({ sent: 0, message: "No at-risk streaks" });
    }

    // Get user emails and email preferences
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const userEmailMap = new Map(users.map((u) => [u.id, u.email]));

    // Check email preferences
    const userIds = atRiskStreaks.map((s) => s.user_id);
    const { data: prefs } = await supabase
      .from("user_subscriptions")
      .select("user_id, email_digest_enabled")
      .in("user_id", userIds);

    const optedOut = new Set(
      (prefs || []).filter((p) => p.email_digest_enabled === false).map((p) => p.user_id),
    );

    let sent = 0;
    let skipped = 0;

    for (const streak of atRiskStreaks) {
      if (Date.now() > deadline) break; // Deadline guard

      const email = userEmailMap.get(streak.user_id);
      if (!email || optedOut.has(streak.user_id)) {
        skipped++;
        continue;
      }

      await sendStreakRiskEmail(email, streak.current_streak);
      sent++;
    }

    return NextResponse.json({ sent, skipped, total: atRiskStreaks.length });
  } catch (err) {
    console.error("[streak-check] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
