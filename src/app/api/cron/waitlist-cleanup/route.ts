import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Daily cron: delete unconfirmed waitlist signups older than 30 days.
 * Extended from 48h to give users more time to confirm (emails often land in spam).
 */
export async function GET() {
  const admin = createAdminClient();

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("waitlist_signups")
    .delete()
    .eq("email_confirmed", false)
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("[cron/waitlist-cleanup] failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deleted = data?.length ?? 0;
  console.log(`[cron/waitlist-cleanup] deleted ${deleted} unconfirmed signups`);

  return NextResponse.json({ deleted });
}
