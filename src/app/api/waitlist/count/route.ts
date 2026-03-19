import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("waitlist_signups")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("[waitlist/count] query failed:", error.message);
      return NextResponse.json({ total: 0, remaining: 100 });
    }

    const total = count ?? 0;
    return NextResponse.json(
      { total, remaining: Math.max(0, 100 - total) },
      { headers: { "Cache-Control": "public, max-age=30" } }
    );
  } catch (err) {
    console.error("[waitlist/count] error:", err);
    return NextResponse.json({ total: 0, remaining: 100 });
  }
}
