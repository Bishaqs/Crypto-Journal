import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/broker-sync/crypto";
import { buildHeaders, type BitgetCredentials } from "@/lib/broker-sync/bitget";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint: raw Bitget API probe for the last 7 days.
 * No dedup, no cleanup, no insert — just shows what the API returns.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: conn } = await supabase
    .from("broker_connections")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const apiKey = decrypt(conn.encrypted_api_key, conn.encryption_iv);
    const apiSecret = decrypt(
      conn.encrypted_api_secret,
      conn.secret_iv ?? conn.encryption_iv,
    );
    const passphrase =
      conn.encrypted_passphrase && conn.passphrase_iv
        ? decrypt(conn.encrypted_passphrase, conn.passphrase_iv)
        : "";

    const creds: BitgetCredentials = { apiKey, apiSecret, passphrase };

    // Fetch just the last 7 days — single window, no pagination
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const queryParams = new URLSearchParams({
      productType: "USDT-FUTURES",
      limit: "100",
      startTime: sevenDaysAgo.toString(),
      endTime: now.toString(),
    });

    const path = "/api/v2/mix/order/fills";
    const query = "?" + queryParams.toString();
    const fullPath = path + query;

    const headers = buildHeaders(creds, "GET", fullPath);
    const res = await fetch("https://api.bitget.com" + fullPath, { headers });
    const json = await res.json();

    const fillList = json.data?.fillList ?? [];

    return NextResponse.json({
      api_status: res.status,
      api_code: json.code,
      api_msg: json.msg,
      fill_count: fillList.length,
      window: {
        start: new Date(sevenDaysAgo).toISOString(),
        end: new Date(now).toISOString(),
      },
      fills: fillList.map(
        (f: {
          tradeId: string;
          orderId: string;
          symbol: string;
          side: string;
          tradeSide?: string;
          price: string;
          size: string;
          fee: string;
          profit: string;
          cTime: string;
        }) => ({
          tradeId: f.tradeId,
          orderId: f.orderId,
          symbol: f.symbol,
          side: f.side,
          tradeSide: f.tradeSide,
          price: f.price,
          size: f.size,
          fee: f.fee,
          profit: f.profit,
          time: new Date(parseInt(f.cTime)).toISOString(),
        }),
      ),
      last_sync_at: conn.last_sync_at,
      connection_status: conn.status,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Debug failed" },
      { status: 500 },
    );
  }
}
