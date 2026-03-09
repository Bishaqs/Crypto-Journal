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
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { count, error } = await admin
    .from("user_subscriptions")
    .select("*", { count: "exact", head: true })
    .gte("last_seen", fiveMinAgo);

  if (error) {
    console.error("[admin/online] query failed:", error.message);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
