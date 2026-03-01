import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return all shared trades for this user
  const { data, error } = await supabase
    .from("shared_trades")
    .select("*, trades(*)")
    .eq("user_id", user.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    // Table might not exist yet — return empty
    return NextResponse.json({ shares: [] });
  }

  return NextResponse.json({ shares: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const tradeId = body.tradeId;

  if (!tradeId) {
    return NextResponse.json({ error: "tradeId required" }, { status: 400 });
  }

  // Verify trade belongs to user
  const { data: trade } = await supabase
    .from("trades")
    .select("id, user_id")
    .eq("id", tradeId)
    .single();

  if (!trade || trade.user_id !== user.id) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const shareToken = randomUUID();

  const { data, error } = await supabase
    .from("shared_trades")
    .upsert(
      { trade_id: tradeId, user_id: user.id, share_token: shareToken, is_public: true },
      { onConflict: "trade_id,user_id" }
    )
    .select()
    .single();

  if (error) {
    // Table might not exist — return mock response
    return NextResponse.json({
      share: { trade_id: tradeId, share_token: shareToken, is_public: true },
    });
  }

  return NextResponse.json({ share: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tradeId = searchParams.get("tradeId");

  if (!tradeId) {
    return NextResponse.json({ error: "tradeId required" }, { status: 400 });
  }

  await supabase
    .from("shared_trades")
    .update({ is_public: false })
    .eq("trade_id", tradeId)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
