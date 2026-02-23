"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ReferralData = {
  code: string;
  totalReferrals: number;
  converted: number;
  freeDaysEarned: number;
};

export function useReferral() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, []);

  async function fetchReferralData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get or create referral link
    const { data: linkResult } = await supabase.rpc("get_or_create_referral_link", {
      p_user_id: user.id,
    });

    // Get stats
    const { data: statsResult } = await supabase.rpc("get_referral_stats", {
      p_user_id: user.id,
    });

    const code = linkResult?.code ?? "";
    const stats = statsResult ?? { total_referrals: 0, converted: 0, free_days_earned: 0 };

    setData({
      code,
      totalReferrals: stats.total_referrals,
      converted: stats.converted,
      freeDaysEarned: stats.free_days_earned,
    });
    setLoading(false);
  }

  return {
    code: data?.code ?? "",
    totalReferrals: data?.totalReferrals ?? 0,
    converted: data?.converted ?? 0,
    freeDaysEarned: data?.freeDaysEarned ?? 0,
    loading,
    refetch: fetchReferralData,
  };
}
