import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { encrypt } from "@/lib/broker-sync/crypto";
import { testBitgetConnection } from "@/lib/broker-sync/bitget";

export const dynamic = "force-dynamic";

const ConnectionSchema = z.object({
  broker_name: z.string().min(1),
  broker_type: z.enum(["crypto_exchange", "stock_broker", "dex", "forex_broker"]),
  account_label: z.string().nullable().optional(),
  api_key: z.string().min(1),
  api_secret: z.string().min(1),
  passphrase: z.string().optional(),
  target_table: z.enum(["trades", "stock_trades", "commodity_trades", "forex_trades"]).default("trades"),
  sync_frequency: z.enum(["manual", "hourly", "daily", "weekly"]).default("manual"),
  timezone: z.string().default("UTC"),
  currency: z.string().default("USD"),
});

// GET: List user's connections (without decrypted keys)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("broker_connections")
    .select("id, broker_name, broker_type, account_label, target_table, sync_frequency, timezone, currency, auto_sync_enabled, status, last_sync_at, total_trades_synced, last_error, encrypted_api_key, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[connections:GET] DB query failed:", error.message, error.code, error.details);
    return NextResponse.json({ error: "Failed to load connections" }, { status: 500 });
  }

  // Return connections with masked API key (last 4 chars of encrypted key as identifier)
  const connections = (data ?? []).map(({ encrypted_api_key, ...rest }) => ({
    ...rest,
    api_key_last4: encrypted_api_key ? encrypted_api_key.slice(-4) : null,
  }));

  return NextResponse.json({ connections });
}

// POST: Create a new connection
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`connections:${user.id}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let parsed;
  try {
    parsed = ConnectionSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message ?? "Invalid request" : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Encrypt each credential with its own IV
  const encryptedKey = encrypt(parsed.api_key);
  const encryptedSecret = encrypt(parsed.api_secret);
  const encryptedPassphrase = parsed.passphrase ? encrypt(parsed.passphrase) : null;

  // Auto-test connection to determine initial status
  let initialStatus = "pending";
  const brokerLower = parsed.broker_name.toLowerCase();
  if (brokerLower.includes("bitget") && parsed.passphrase) {
    try {
      const testResult = await testBitgetConnection({
        apiKey: parsed.api_key,
        apiSecret: parsed.api_secret,
        passphrase: parsed.passphrase,
      });
      if (testResult.ok) initialStatus = "active";
    } catch {
      // Test failed — keep "pending"
    }
  }

  const { data, error } = await supabase
    .from("broker_connections")
    .insert({
      user_id: user.id,
      broker_name: parsed.broker_name,
      broker_type: parsed.broker_type,
      account_label: parsed.account_label ?? null,
      encrypted_api_key: encryptedKey.encrypted,
      encrypted_api_secret: encryptedSecret.encrypted,
      encryption_iv: encryptedKey.iv,
      secret_iv: encryptedSecret.iv,
      encrypted_passphrase: encryptedPassphrase?.encrypted ?? null,
      passphrase_iv: encryptedPassphrase?.iv ?? null,
      target_table: parsed.target_table,
      sync_frequency: parsed.sync_frequency,
      timezone: parsed.timezone,
      currency: parsed.currency,
      status: initialStatus,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[connections:POST] DB insert failed:", error.message, error.code, error.details);
    const userMessage =
      error.code === "42P01" ? "Database table not found — please contact support." :
      error.code === "42501" ? "Permission denied — database security policies may need updating." :
      error.code === "23505" ? "A connection with these credentials already exists." :
      `Save failed: ${error.message}`;
    return NextResponse.json({ error: userMessage, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
