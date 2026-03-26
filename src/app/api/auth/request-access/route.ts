import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET — check current user's access request status
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("access_requests")
    .select("status, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[request-access] GET failed:", error.message);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ status: "none" });
  }

  return NextResponse.json({ status: data.status, created_at: data.created_at });
}

// POST — submit an access request
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`request-access:${user.id}`, 5, 3_600_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const email = user.email.toLowerCase();

  // Check if user already has access (only early_access_emails grants access)
  const { data: earlyAccess } = await supabase
    .from("early_access_emails")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (earlyAccess) {
    return NextResponse.json({ status: "approved", message: "You already have access." });
  }

  // Check for existing request
  const { data: existing } = await supabase
    .from("access_requests")
    .select("status, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      status: existing.status,
      created_at: existing.created_at,
      message:
        existing.status === "pending"
          ? "Your request is already pending."
          : existing.status === "approved"
            ? "You've been approved!"
            : "Your request was not approved.",
    });
  }

  // Insert new request
  const { error } = await supabase
    .from("access_requests")
    .insert({ user_id: user.id, email });

  if (error) {
    console.error("[request-access] POST failed:", error.message);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }

  return NextResponse.json({ status: "pending", message: "Request submitted!" });
}
