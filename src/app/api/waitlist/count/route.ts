import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTierForPosition, TIERS, TOTAL_CAP } from "@/lib/waitlist-tiers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createAdminClient();
    // Count ALL signups (confirmed + unconfirmed) so counter moves immediately on signup
    const { count, error } = await admin
      .from("waitlist_signups")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("[waitlist/count] query failed:", error.message);
      return NextResponse.json({ total: 0, remaining: TOTAL_CAP, currentTier: "founding_100", currentTierName: "Founding 100", currentDiscount: 50 });
    }

    const total = count ?? 0;
    const nextPosition = total + 1;
    const tier = nextPosition <= TOTAL_CAP ? getTierForPosition(nextPosition) : null;
    const tierInfo = tier ? TIERS[tier] : null;

    // Calculate remaining spots within the current tier
    const tierRemaining = tierInfo
      ? Math.max(0, tierInfo.range[1] - total)
      : 0;

    return NextResponse.json(
      {
        total,
        remaining: Math.max(0, TOTAL_CAP - total),
        tierRemaining,
        currentTier: tier,
        currentTierName: tierInfo?.name ?? null,
        currentDiscount: tierInfo?.discount ?? null,
      },
      { headers: { "Cache-Control": "public, max-age=30" } }
    );
  } catch (err) {
    console.error("[waitlist/count] error:", err);
    return NextResponse.json({ total: 0, remaining: TOTAL_CAP, currentTier: "founding_100", currentTierName: "Founding 100", currentDiscount: 50 });
  }
}
