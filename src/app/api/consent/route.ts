import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_consents")
    .select("consent_type, granted, updated_at, privacy_policy_version")
    .eq("user_id", user.id);

  if (error) {
    console.error("[consent] fetch error:", error.message);
    return NextResponse.json({ consents: [] });
  }

  return NextResponse.json({ consents: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { consent_type, granted } = body;

  if (!consent_type || typeof granted !== "boolean") {
    return NextResponse.json(
      { error: "Missing consent_type or granted" },
      { status: 400 }
    );
  }

  const validTypes = [
    "ai_data_processing",
    "functional_cookies",
    "leaderboard_profile",
    "shared_trades",
  ];
  if (!validTypes.includes(consent_type)) {
    return NextResponse.json(
      { error: "Invalid consent_type" },
      { status: 400 }
    );
  }

  // Get IP from headers (Vercel forwards this)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const { error } = await supabase.from("user_consents").upsert(
    {
      user_id: user.id,
      consent_type,
      granted,
      privacy_policy_version: "2026-03-14",
      ip_address: ip,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,consent_type" }
  );

  if (error) {
    console.error("[consent] upsert error:", error.message);
    return NextResponse.json(
      { error: "Failed to save consent" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
