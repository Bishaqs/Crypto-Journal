import { createAdminClient } from "@/lib/supabase/admin";
import { sendWeeklyDigest } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const deadline = startTime + 8000; // 2s safety margin

  // Authenticate via CRON_SECRET
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const sent: string[] = [];
  const errors: string[] = [];

  try {
    // Get all users
    const {
      data: { users },
      error: usersError,
    } = await admin.auth.admin.listUsers({ perPage: 1000 });

    if (usersError || !users) {
      return NextResponse.json(
        { error: "Failed to list users" },
        { status: 500 }
      );
    }

    // Calculate date range for the past week
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setUTCHours(23, 59, 59, 999);
    weekEnd.setUTCDate(weekEnd.getUTCDate() - 1); // yesterday end
    const weekStart = new Date(weekEnd);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6); // 7 days ago
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    for (const user of users) {
      // Deadline guard
      if (Date.now() > deadline) {
        break;
      }

      if (!user.email) continue;

      // Check opt-out
      const { data: sub } = await admin
        .from("user_subscriptions")
        .select("email_digest_enabled")
        .eq("user_id", user.id)
        .single();

      if (sub?.email_digest_enabled === false) continue;

      // Fetch trades for this user in the past week
      const { data: trades } = await admin
        .from("trades")
        .select("pnl, entry_price, exit_price, quantity, position, fees, open_timestamp, close_timestamp, symbol, emotion")
        .eq("user_id", user.id)
        .gte("open_timestamp", weekStart.toISOString())
        .lte("open_timestamp", weekEnd.toISOString());

      if (!trades || trades.length === 0) continue;

      // Calculate stats in-memory
      const closedTrades = trades.filter((t) => t.pnl != null);
      const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
      const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
      const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0).length;
      const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

      // Best/worst by P&L
      const sorted = [...closedTrades].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
      const bestTrade = sorted[0]?.pnl != null
        ? { symbol: sorted[0].symbol ?? "Unknown", pnl: sorted[0].pnl! }
        : null;
      const worstTrade = sorted.length > 0 && sorted[sorted.length - 1]?.pnl != null
        ? { symbol: sorted[sorted.length - 1].symbol ?? "Unknown", pnl: sorted[sorted.length - 1].pnl! }
        : null;

      // Green/red days
      const dayPnl = new Map<string, number>();
      for (const t of closedTrades) {
        const day = (t.close_timestamp ?? t.open_timestamp ?? "").slice(0, 10);
        if (day) dayPnl.set(day, (dayPnl.get(day) ?? 0) + (t.pnl ?? 0));
      }
      let greenDays = 0;
      let redDays = 0;
      for (const pnl of dayPnl.values()) {
        if (pnl > 0) greenDays++;
        else if (pnl < 0) redDays++;
      }

      try {
        await sendWeeklyDigest(user.email, {
          weekLabel,
          totalPnl,
          tradeCount: trades.length,
          winRate,
          wins,
          losses,
          bestTrade,
          worstTrade,
          greenDays,
          redDays,
        });
        sent.push(user.email);
      } catch (err) {
        errors.push(user.email);
        console.error(`[weekly-digest] Failed for ${user.email}:`, err);
      }
    }

    return NextResponse.json({
      sent: sent.length,
      errors: errors.length,
      timedOut: Date.now() > deadline,
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error("[weekly-digest] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal error", durationMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}
