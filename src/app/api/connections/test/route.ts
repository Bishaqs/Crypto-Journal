import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { testBitgetConnection } from "@/lib/broker-sync/bitget";

export const dynamic = "force-dynamic";

// POST: Test a broker connection
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
  const { api_key, api_secret, broker_name, passphrase } = body;

  if (!api_key || !api_secret) {
    return NextResponse.json({ error: "API key and secret are required" }, { status: 400 });
  }

  if (api_key.length < 8) {
    return NextResponse.json(
      { success: false, error: "API key appears too short" },
      { status: 400 },
    );
  }

  const brokerLower = (broker_name ?? "").toLowerCase();

  // Bitget: real API test
  if (brokerLower.includes("bitget")) {
    if (!passphrase) {
      return NextResponse.json(
        { success: false, error: "Bitget requires a passphrase. Enter the passphrase you set when creating the API key." },
        { status: 400 },
      );
    }

    const result = await testBitgetConnection({
      apiKey: api_key,
      apiSecret: api_secret,
      passphrase,
    });

    if (result.ok) {
      return NextResponse.json({ success: true, message: "Bitget API connection verified." });
    }
    return NextResponse.json(
      { success: false, error: result.error || "Bitget connection test failed" },
      { status: 400 },
    );
  }

  // Other brokers: validate key format (placeholder)
  return NextResponse.json({
    success: true,
    message: `Connection test passed for ${broker_name ?? "broker"} (format check only — full API test coming soon)`,
  });
}
