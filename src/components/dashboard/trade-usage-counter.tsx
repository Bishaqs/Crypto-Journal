"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/use-subscription";
import { TrendingUp, Crown } from "lucide-react";
import Link from "next/link";

const FREE_WEEKLY_LIMIT = 2;

export function TradeUsageCounter() {
  const { tier, isOwner } = useSubscription();
  const [tradesThisWeek, setTradesThisWeek] = useState<number | null>(null);

  useEffect(() => {
    async function countWeeklyTrades() {
      const supabase = createClient();
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("trades")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monday.toISOString());

      setTradesThisWeek(count ?? 0);
    }
    countWeeklyTrades();
  }, []);

  if (tradesThisWeek === null) return null;

  const isPro = tier === "pro" || tier === "max" || isOwner;
  const limit = isPro ? null : FREE_WEEKLY_LIMIT;
  const atLimit = limit !== null && tradesThisWeek >= limit;
  const nearLimit = limit !== null && tradesThisWeek === limit - 1;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
      atLimit
        ? "bg-loss/10 border border-loss/30 text-loss"
        : nearLimit
          ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
          : "bg-surface border border-border text-muted"
    }`}>
      <TrendingUp size={12} />
      <span>
        {tradesThisWeek} {isPro ? "trades this week" : `of ${limit} trades this week`}
      </span>
      {atLimit && !isPro && (
        <Link
          href="/dashboard/settings?tab=subscription"
          className="flex items-center gap-1 ml-1 text-accent hover:underline"
        >
          <Crown size={10} />
          Upgrade
        </Link>
      )}
    </div>
  );
}
