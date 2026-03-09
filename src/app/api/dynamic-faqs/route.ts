import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("dynamic_faqs")
    .select("id, question, answer, category, tags, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dynamic-faqs] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load FAQs" }, { status: 500 });
  }

  return NextResponse.json({ faqs: data ?? [] });
}
