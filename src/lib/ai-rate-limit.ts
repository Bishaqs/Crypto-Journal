import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const DAILY_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  max: 0, // 0 = unlimited
};

/**
 * Check whether a user has remaining daily AI messages based on their subscription tier.
 * Returns `{ allowed: true }` or `{ allowed: false, response }` with a 429 NextResponse.
 */
export async function checkAiDailyLimit(
  userId: string
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("tier, is_owner")
    .eq("user_id", userId)
    .maybeSingle();

  const tier = sub?.tier ?? "free";
  const isOwner = sub?.is_owner ?? false;
  const dailyMax = DAILY_LIMITS[tier] ?? 5;

  // Owner and max tier get unlimited
  if (isOwner || dailyMax === 0) return { allowed: true };

  const rl = await rateLimit(`ai-daily:${userId}`, dailyMax, 86_400_000);
  if (!rl.success) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: `Daily AI limit reached (${dailyMax}/day on ${tier} plan). Upgrade for more.`,
          remaining: 0,
          resetMs: rl.resetMs,
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) },
        }
      ),
    };
  }

  return { allowed: true };
}
