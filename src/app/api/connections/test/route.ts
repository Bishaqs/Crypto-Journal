import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST: Test a broker connection (placeholder)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`test-conn:${user.id}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many test requests" }, { status: 429 });
  }

  const body = await req.json();
  const { api_key, api_secret, broker_name } = body;

  if (!api_key || !api_secret) {
    return NextResponse.json({ error: "API key and secret are required" }, { status: 400 });
  }

  // Placeholder: validate key format
  if (api_key.length < 8) {
    return NextResponse.json(
      { success: false, error: "API key appears too short" },
      { status: 400 },
    );
  }

  // Placeholder: actual broker API connection test will be added per-broker
  return NextResponse.json({
    success: true,
    message: `Connection test passed for ${broker_name ?? "broker"} (placeholder)`,
  });
}
