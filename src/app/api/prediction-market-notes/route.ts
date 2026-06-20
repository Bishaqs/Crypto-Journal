import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PredictionMarketNoteCreateSchema } from "@/lib/schemas/prediction-market";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const predictionId = request.nextUrl.searchParams.get("prediction_id");
  if (!predictionId) {
    return NextResponse.json(
      { error: "prediction_id query parameter is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("prediction_market_notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("prediction_id", predictionId)
    .order("note_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = PredictionMarketNoteCreateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Confirm the parent prediction belongs to this user before attaching a note.
  const { data: parent, error: parentError } = await supabase
    .from("prediction_markets")
    .select("id")
    .eq("id", parsed.data.prediction_id)
    .eq("user_id", user.id)
    .single();

  if (parentError || !parent) {
    return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("prediction_market_notes")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data }, { status: 201 });
}
