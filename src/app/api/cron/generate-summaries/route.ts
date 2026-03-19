import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  computeDailySummary,
  computeWeeklySummary,
  computeMonthlySummary,
  computeYearlySummary,
} from "@/lib/trading-summaries";
import type { Trade } from "@/lib/types";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const deadline = startTime + 8000; // 2s safety margin before 10s Vercel timeout

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();
  const results = { daily: 0, weekly: 0, monthly: 0, yearly: 0, skipped: 0, errors: 0 };

  // Get distinct user IDs with trades
  const { data: users, error: usersError } = await supabase
    .from("trades")
    .select("user_id")
    .not("close_timestamp", "is", null)
    .limit(1000);

  if (usersError || !users) {
    return NextResponse.json({ error: "Failed to fetch users", detail: usersError?.message }, { status: 500 });
  }

  const uniqueUserIds = [...new Set(users.map((u) => u.user_id))];

  for (const userId of uniqueUserIds) {
    if (Date.now() > deadline) break;

    try {
      // Fetch all closed trades for this user
      const allTrades: Trade[] = [];
      let page = 0;
      while (true) {
        const { data, error } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", userId)
          .not("close_timestamp", "is", null)
          .order("close_timestamp", { ascending: false })
          .range(page * 1000, (page + 1) * 1000 - 1);

        if (error || !data || data.length === 0) break;
        allTrades.push(...(data as Trade[]));
        if (data.length < 1000) break;
        page++;
        if (Date.now() > deadline) break;
      }

      if (allTrades.length === 0) continue;

      // ─── Daily: yesterday ──────────────────────────────────────────────
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const { data: existingDaily } = await supabase
        .from("trading_summaries")
        .select("id")
        .eq("user_id", userId)
        .eq("period_type", "daily")
        .eq("period_start", yesterdayStr)
        .limit(1);

      if (!existingDaily || existingDaily.length === 0) {
        const yesterdayTrades = allTrades.filter((t) =>
          (t.close_timestamp ?? t.open_timestamp).split("T")[0] === yesterdayStr,
        );
        if (yesterdayTrades.length > 0) {
          const summary = computeDailySummary(allTrades, yesterdayStr, userId);
          const { error } = await supabase.from("trading_summaries").upsert({
            user_id: summary.user_id,
            period_type: summary.period_type,
            period_start: summary.period_start,
            period_end: summary.period_end,
            stats: summary.stats,
            narrative: summary.narrative,
          }, { onConflict: "user_id,period_type,period_start" });
          if (!error) results.daily++;
          else results.errors++;
        }
      } else {
        results.skipped++;
      }

      if (Date.now() > deadline) break;

      // ─── Weekly: if Monday, generate last week's summary ──────────────
      if (now.getDay() === 1) {
        const lastMonday = new Date(now);
        lastMonday.setDate(lastMonday.getDate() - 7);
        const lastMondayStr = lastMonday.toISOString().split("T")[0];

        const { data: existingWeekly } = await supabase
          .from("trading_summaries")
          .select("id")
          .eq("user_id", userId)
          .eq("period_type", "weekly")
          .eq("period_start", lastMondayStr)
          .limit(1);

        if (!existingWeekly || existingWeekly.length === 0) {
          const summary = computeWeeklySummary(allTrades, lastMondayStr, userId);
          if (summary.stats.tradeCount > 0) {
            const { error } = await supabase.from("trading_summaries").upsert({
              user_id: summary.user_id,
              period_type: summary.period_type,
              period_start: summary.period_start,
              period_end: summary.period_end,
              stats: summary.stats,
              narrative: summary.narrative,
            }, { onConflict: "user_id,period_type,period_start" });
            if (!error) results.weekly++;
            else results.errors++;
          }
        } else {
          results.skipped++;
        }
      }

      // ─── Monthly: if 1st, generate last month ─────────────────────────
      if (now.getDate() === 1) {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

        const { data: existingMonthly } = await supabase
          .from("trading_summaries")
          .select("id")
          .eq("user_id", userId)
          .eq("period_type", "monthly")
          .eq("period_start", `${lastMonthStr}-01`)
          .limit(1);

        if (!existingMonthly || existingMonthly.length === 0) {
          const summary = computeMonthlySummary(allTrades, lastMonthStr, userId);
          if (summary.stats.tradeCount > 0) {
            const { error } = await supabase.from("trading_summaries").upsert({
              user_id: summary.user_id,
              period_type: summary.period_type,
              period_start: summary.period_start,
              period_end: summary.period_end,
              stats: summary.stats,
              narrative: summary.narrative,
            }, { onConflict: "user_id,period_type,period_start" });
            if (!error) results.monthly++;
            else results.errors++;
          }
        } else {
          results.skipped++;
        }
      }

      // ─── Yearly: if Jan 1, generate last year ─────────────────────────
      if (now.getMonth() === 0 && now.getDate() === 1) {
        const lastYear = String(now.getFullYear() - 1);

        const { data: existingYearly } = await supabase
          .from("trading_summaries")
          .select("id")
          .eq("user_id", userId)
          .eq("period_type", "yearly")
          .eq("period_start", `${lastYear}-01-01`)
          .limit(1);

        if (!existingYearly || existingYearly.length === 0) {
          const summary = computeYearlySummary(allTrades, lastYear, userId);
          if (summary.stats.tradeCount > 0) {
            const { error } = await supabase.from("trading_summaries").upsert({
              user_id: summary.user_id,
              period_type: summary.period_type,
              period_start: summary.period_start,
              period_end: summary.period_end,
              stats: summary.stats,
              narrative: summary.narrative,
            }, { onConflict: "user_id,period_type,period_start" });
            if (!error) results.yearly++;
            else results.errors++;
          }
        } else {
          results.skipped++;
        }
      }
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({
    ok: true,
    users: uniqueUserIds.length,
    ...results,
    durationMs: Date.now() - startTime,
  });
}
