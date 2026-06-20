import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MemeCoinNoteCreateSchema } from "@/lib/schemas/meme-coin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get("coin_id");

  let query = supabase
    .from("meme_coin_notes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (coinId) {
    query = query.eq("coin_id", coinId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data ?? [] });
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
  const parsed = MemeCoinNoteCreateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Ownership check: the coin this note targets must belong to the user.
  const { data: coin, error: coinError } = await supabase
    .from("meme_coins")
    .select("id")
    .eq("id", parsed.data.coin_id)
    .eq("user_id", user.id)
    .single();

  if (coinError || !coin) {
    return NextResponse.json({ error: "Coin not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("meme_coin_notes")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data }, { status: 201 });
}
