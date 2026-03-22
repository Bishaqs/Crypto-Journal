import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NarrativeGenerateSchema } from "@/lib/schemas/ai";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiDailyLimit } from "@/lib/ai-rate-limit";
import { getProvider, resolveModel } from "@/lib/ai/providers";
import type { SummaryStats } from "@/lib/trading-summaries";
import {
  computeDailySummary,
  computeWeeklySummary,
  computeMonthlySummary,
  computeYearlySummary,
} from "@/lib/trading-summaries";
import type { Trade } from "@/lib/types";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import {
  getDailyNarrativePrompt,
  getWeeklyNarrativePrompt,
  getMonthlyNarrativePrompt,
  getYearlyNarrativePrompt,
  buildDailyNarrativeInput,
  buildHierarchicalNarrativeInput,
} from "@/lib/narrative-prompts";

export const dynamic = "force-dynamic";

const NARRATIVE_MODEL = "claude-haiku-4-5-20251001";

type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

function getPrompt(pt: PeriodType): string {
  switch (pt) {
    case "daily": return getDailyNarrativePrompt();
    case "weekly": return getWeeklyNarrativePrompt();
    case "monthly": return getMonthlyNarrativePrompt();
    case "yearly": return getYearlyNarrativePrompt();
  }
}

function getMaxTokens(pt: PeriodType): number {
  switch (pt) {
    case "daily": return 200;
    case "weekly": return 300;
    case "monthly": return 400;
    case "yearly": return 500;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 per minute
  const rl = await rateLimit(`ai-narrative:${user.id}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  const daily = await checkAiDailyLimit(user.id);
  if (!daily.allowed) return daily.response;

  const body = await req.json();
  const parsed = NarrativeGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e) => e.message).join(", ") },
      { status: 400 },
    );
  }

  const { period_type, period_start, force } = parsed.data;

  const provider = getProvider("anthropic");
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: "AI narratives not available" }, { status: 503 });
  }

  // Fetch the summary row
  let { data: summary, error: fetchErr } = await supabase
    .from("trading_summaries")
    .select("id, period_start, period_end, stats, narrative")
    .eq("user_id", user.id)
    .eq("period_type", period_type)
    .eq("period_start", period_start)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }

  // If no summary row exists, compute it on-demand
  if (!summary) {
    const { data: tradeData } = await fetchAllTrades(supabase);
    if (!tradeData || tradeData.length === 0) {
      return NextResponse.json({ error: "No trade data available" }, { status: 404 });
    }
    const trades = tradeData as Trade[];
    let computed;
    switch (period_type) {
      case "daily":
        computed = computeDailySummary(trades, period_start, user.id);
        break;
      case "weekly":
        computed = computeWeeklySummary(trades, period_start, user.id);
        break;
      case "monthly":
        computed = computeMonthlySummary(trades, period_start.substring(0, 7), user.id);
        break;
      case "yearly":
        computed = computeYearlySummary(trades, period_start.substring(0, 4), user.id);
        break;
    }
    if (computed.stats.tradeCount === 0) {
      return NextResponse.json({ error: "No trades found for this period" }, { status: 404 });
    }
    const { data: upserted, error: upsertErr } = await supabase
      .from("trading_summaries")
      .upsert({
        user_id: computed.user_id,
        period_type: computed.period_type,
        period_start: computed.period_start,
        period_end: computed.period_end,
        stats: computed.stats,
        narrative: null,
      }, { onConflict: "user_id,period_type,period_start" })
      .select("id, period_start, period_end, stats, narrative")
      .single();
    if (upsertErr || !upserted) {
      return NextResponse.json({ error: "Failed to create summary" }, { status: 500 });
    }
    summary = upserted;
  }

  // Return existing narrative if not forcing regeneration
  if (summary.narrative && !force) {
    return NextResponse.json({ narrative: summary.narrative });
  }

  const stats = summary.stats as SummaryStats;
  if (!stats || stats.tradeCount === 0) {
    return NextResponse.json({ error: "No trade data for this period" }, { status: 404 });
  }

  let userMessage: string;

  if (period_type === "daily") {
    const [notesRes, checkinRes, logsRes] = await Promise.all([
      supabase
        .from("journal_notes")
        .select("title, content, tags")
        .eq("user_id", user.id)
        .eq("note_date", period_start)
        .limit(5),
      supabase
        .from("daily_checkins")
        .select("mood, energy, traffic_light, gratitude, intention")
        .eq("user_id", user.id)
        .eq("date", period_start)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("behavioral_logs")
        .select("emotion, intensity, trigger, biases, physical_state")
        .eq("user_id", user.id)
        .gte("created_at", `${period_start}T00:00:00`)
        .lt("created_at", `${period_start}T23:59:59`)
        .limit(5),
    ]);

    userMessage = buildDailyNarrativeInput(
      period_start,
      stats,
      notesRes.data ?? [],
      checkinRes.data ?? null,
      logsRes.data ?? [],
    );
  } else {
    const subPeriodType: PeriodType =
      period_type === "weekly" ? "daily" :
      period_type === "monthly" ? "weekly" : "monthly";

    const { data: subPeriods } = await supabase
      .from("trading_summaries")
      .select("period_start, stats, narrative")
      .eq("user_id", user.id)
      .eq("period_type", subPeriodType)
      .gte("period_start", summary.period_start)
      .lte("period_start", summary.period_end)
      .order("period_start", { ascending: true });

    userMessage = buildHierarchicalNarrativeInput(
      period_type as "weekly" | "monthly" | "yearly",
      period_start,
      stats,
      (subPeriods ?? []).map((sp) => ({
        period_start: sp.period_start,
        stats: sp.stats as SummaryStats,
        narrative: sp.narrative,
      })),
    );
  }

  try {
    const model = resolveModel("anthropic", NARRATIVE_MODEL);
    const narrative = await provider.chat({
      system: getPrompt(period_type),
      userMessage,
      maxTokens: getMaxTokens(period_type),
      model,
    });

    // Store in DB
    await supabase
      .from("trading_summaries")
      .update({ narrative })
      .eq("id", summary.id);

    return NextResponse.json({ narrative });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
