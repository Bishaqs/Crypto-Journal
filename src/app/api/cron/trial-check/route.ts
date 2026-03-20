import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrialExpiredEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Daily cron: Check for expired trials and downgrade users to free tier.
 * Sends a trial-expired email notification.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deadline = Date.now() + 8000;
  const supabase = createAdminClient();

  try {
    const now = new Date().toISOString();

    // Find expired trials
    const { data: expiredTrials, error } = await supabase
      .from("user_subscriptions")
      .select("user_id, tier, trial_end")
      .eq("is_trial", true)
      .lt("trial_end", now);

    if (error) {
      console.error("[trial-check] DB error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      return NextResponse.json({ downgraded: 0, message: "No expired trials" });
    }

    // Get user emails
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const userEmailMap = new Map(users.map((u) => [u.id, u.email]));

    let downgraded = 0;

    for (const trial of expiredTrials) {
      if (Date.now() > deadline) break;

      // Downgrade to free
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({ tier: "free", is_trial: false, updated_at: now })
        .eq("user_id", trial.user_id);

      if (updateError) {
        console.error(`[trial-check] Failed to downgrade ${trial.user_id}:`, updateError.message);
        continue;
      }

      // Send notification email
      const email = userEmailMap.get(trial.user_id);
      if (email) {
        const tierLabel = trial.tier === "max" ? "Max" : "Pro";
        await sendTrialExpiredEmail(email, tierLabel);
      }

      downgraded++;
    }

    return NextResponse.json({ downgraded, total: expiredTrials.length });
  } catch (err) {
    console.error("[trial-check] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
