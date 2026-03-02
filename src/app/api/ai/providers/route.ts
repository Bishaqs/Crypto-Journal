import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAvailableProviders, PROVIDER_CONFIGS } from "@/lib/ai";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const available = getAvailableProviders();

  return NextResponse.json({
    providers: available,
    allProviders: Object.values(PROVIDER_CONFIGS),
  });
}
