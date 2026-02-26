import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  let isOwnerByEnv = !!(user && ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());
  let isOwnerByDb = false;

  let dbResult = null;
  if (user) {
    const { data: sub, error } = await supabase
      .from("user_subscriptions")
      .select("tier, is_owner, is_trial")
      .eq("user_id", user.id)
      .maybeSingle();
    dbResult = { sub, error: error?.message ?? null };
    if (sub?.is_owner) isOwnerByDb = true;
  }

  return NextResponse.json({
    OWNER_EMAIL: process.env.OWNER_EMAIL ? "set" : "unset",
    NEXT_PUBLIC_OWNER_EMAIL: process.env.NEXT_PUBLIC_OWNER_EMAIL ? "set" : "unset",
    resolvedOwnerEmail: ownerEmail ?? "none",
    userEmail: user?.email ?? "no-user",
    isOwnerByEnv,
    isOwnerByDb,
    isOwnerFinal: isOwnerByEnv || isOwnerByDb,
    dbResult,
  });
}
