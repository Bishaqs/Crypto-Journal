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

    // Probe history-position endpoint (closed positions)
    const hpPath = "/api/v2/mix/position/history-position";
    const hpQuery = "?productType=USDT-FUTURES&marginCoin=USDT&limit=10";
    const hpFullPath = hpPath + hpQuery;
    const hpHeaders = buildHeaders(creds, "GET", hpFullPath);
    let historyPositions: unknown[] = [];
    let hpError = "";
    try {
      const hpRes = await fetch("https://api.bitget.com" + hpFullPath, { headers: hpHeaders, signal: AbortSignal.timeout(4000) });
      const hpJson = await hpRes.json();
      if (hpJson.code === "00000") {
        historyPositions = (hpJson.data?.list ?? []).slice(0, 5);
      } else {
        hpError = hpJson.msg || `Code: ${hpJson.code}`;
      }
    } catch (e) {
      hpError = e instanceof Error ? e.message : "Failed";
    }

    // Probe open positions endpoint
    const opPath = "/api/v2/mix/position/get-all-position";
    const opQuery = "?productType=USDT-FUTURES";
    const opFullPath = opPath + opQuery;
    const opHeaders = buildHeaders(creds, "GET", opFullPath);
    let openPositions: unknown[] = [];
    let opError = "";
    try {
      const opRes = await fetch("https://api.bitget.com" + opFullPath, { headers: opHeaders, signal: AbortSignal.timeout(4000) });
      const opJson = await opRes.json();
      if (opJson.code === "00000") {
        openPositions = opJson.data ?? [];
      } else {
        opError = opJson.msg || `Code: ${opJson.code}`;
      }
    } catch (e) {
      opError = e instanceof Error ? e.message : "Failed";
    }

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
      history_positions: historyPositions,
      history_positions_count: historyPositions.length,
      history_positions_error: hpError || undefined,
      open_positions: openPositions,
      open_positions_count: openPositions.length,
      open_positions_error: opError || undefined,
      last_sync_at: conn.last_sync_at,
      last_error: conn.last_error,
      connection_status: conn.status,
      total_trades_synced: conn.total_trades_synced,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Debug failed" },
      { status: 500 },
    );
  }
}
