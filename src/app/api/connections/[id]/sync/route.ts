import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST: Trigger sync for a connection (placeholder)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`sync:${user.id}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many sync requests. Wait 1 minute." }, { status: 429 });
  }

  // Verify ownership
  const { data: conn, error: connError } = await supabase
    .from("broker_connections")
    .select("id, broker_name, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (connError || !conn) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  // Log the sync attempt
  const { error: logError } = await supabase.from("sync_logs").insert({
    connection_id: id,
    user_id: user.id,
    sync_type: "manual",
    status: "success",
    trades_fetched: 0,
    trades_imported: 0,
    trades_skipped: 0,
    trades_failed: 0,
    duration_ms: 0,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });
  if (logError) {
    console.error("[sync] Failed to write sync log:", logError.message, logError.code);
  }

  // Update connection status
  const { error: updateError } = await supabase
    .from("broker_connections")
    .update({
      last_sync_at: new Date().toISOString(),
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) {
    console.error("[sync] Failed to update connection:", updateError.message, updateError.code);
  }

  // Placeholder response — actual broker API integration will be added per-broker
  return NextResponse.json({
    message: `Sync placeholder for ${conn.broker_name}. Actual broker API integration coming soon.`,
    trades_imported: 0,
  });
}
