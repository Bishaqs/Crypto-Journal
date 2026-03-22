import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProvider, resolveModel } from "@/lib/ai/providers";
import type { SummaryStats } from "@/lib/trading-summaries";
import {
  getDailyNarrativePrompt,
  getWeeklyNarrativePrompt,
  getMonthlyNarrativePrompt,
  getYearlyNarrativePrompt,
  buildDailyNarrativeInput,
  buildHierarchicalNarrativeInput,
} from "@/lib/narrative-prompts";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

function getPrompt(periodType: PeriodType): string {
  switch (periodType) {
    case "daily": return getDailyNarrativePrompt();
    case "weekly": return getWeeklyNarrativePrompt();
    case "monthly": return getMonthlyNarrativePrompt();
    case "yearly": return getYearlyNarrativePrompt();
  }
}

function getMaxTokens(periodType: PeriodType): number {
  switch (periodType) {
    case "daily": return 200;
    case "weekly": return 300;
    case "monthly": return 400;
    case "yearly": return 500;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = getProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ ok: true, skipped: "no AI provider configured" });
  }

  const startTime = Date.now();
  const deadline = startTime + 8000;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const results = { generated: 0, errors: 0, skipped: 0 };

  // Find summaries without narratives, prioritizing lower levels first
  // so higher levels can use their narratives
  const priorityOrder: PeriodType[] = ["daily", "weekly", "monthly", "yearly"];

  for (const periodType of priorityOrder) {
    if (Date.now() > deadline) break;

    const { data: candidates } = await supabase
      .from("trading_summaries")
      .select("id, user_id, period_type, period_start, period_end, stats")
      .eq("period_type", periodType)
      .is("narrative", null)
      .order("period_start", { ascending: false })
      .limit(3);

    if (!candidates || candidates.length === 0) continue;

    for (const summary of candidates) {
      if (Date.now() > deadline) break;
      if (results.generated >= 3) break; // Max 3 per invocation

      try {
        const stats = summary.stats as SummaryStats;
        if (!stats || stats.tradeCount === 0) {
          results.skipped++;
          continue;
        }

        let userMessage: string;

        if (periodType === "daily") {
          // Fetch journal notes, checkins, behavioral logs for this date
          const [notesRes, checkinRes, logsRes] = await Promise.all([
            supabase
              .from("journal_notes")
              .select("title, content, tags")
              .eq("user_id", summary.user_id)
              .eq("note_date", summary.period_start)
              .limit(5),
            supabase
              .from("daily_checkins")
              .select("mood, energy, traffic_light, gratitude, intention")
              .eq("user_id", summary.user_id)
              .eq("date", summary.period_start)
              .limit(1)
              .maybeSingle(),
            supabase
              .from("behavioral_logs")
              .select("emotion, intensity, trigger, biases, physical_state")
              .eq("user_id", summary.user_id)
              .gte("created_at", `${summary.period_start}T00:00:00`)
              .lt("created_at", `${summary.period_start}T23:59:59`)
              .limit(5),
          ]);

          userMessage = buildDailyNarrativeInput(
            summary.period_start,
            stats,
            notesRes.data ?? [],
            checkinRes.data ?? null,
            logsRes.data ?? [],
          );
        } else {
          // Fetch sub-period summaries
          const subPeriodType: PeriodType =
            periodType === "weekly" ? "daily" :
            periodType === "monthly" ? "weekly" : "monthly";

          const { data: subPeriods } = await supabase
            .from("trading_summaries")
            .select("period_start, stats, narrative")
            .eq("user_id", summary.user_id)
            .eq("period_type", subPeriodType)
            .gte("period_start", summary.period_start)
            .lte("period_start", summary.period_end)
            .order("period_start", { ascending: true });

          userMessage = buildHierarchicalNarrativeInput(
            periodType as "weekly" | "monthly" | "yearly",
            summary.period_start,
            stats,
            (subPeriods ?? []).map((sp) => ({
              period_start: sp.period_start,
              stats: sp.stats as SummaryStats,
              narrative: sp.narrative,
            })),
          );
        }

        const model = resolveModel(provider.id);
        const narrative = await provider.chat({
          system: getPrompt(periodType),
          userMessage,
          maxTokens: getMaxTokens(periodType),
          model,
        });

        const { error: updateError } = await supabase
          .from("trading_summaries")
          .update({ narrative })
          .eq("id", summary.id);

        if (updateError) {
          console.error(`[generate-narratives] Update failed for ${summary.id}:`, updateError.message);
          results.errors++;
        } else {
          results.generated++;
        }
      } catch (err) {
        console.error(`[generate-narratives] Error for ${summary.id}:`, err instanceof Error ? err.message : err);
        results.errors++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    ...results,
    durationMs: Date.now() - startTime,
  });
}
