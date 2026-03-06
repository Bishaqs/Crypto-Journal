/**
 * Coins engine — manages in-app currency balance.
 *
 * Coin Sources:
 *   daily_login: 10 coins
 *   daily_challenge: 25 coins per challenge
 *   weekly_challenge: 100 coins
 *   streak_milestone_7: 50 coins
 *   streak_milestone_30: 150 coins
 *   streak_milestone_90: 300 coins
 *   streak_milestone_180: 500 coins
 *   streak_milestone_365: 1000 coins
 *   all_dailies_bonus: 25 coins
 *
 * Coin Sinks:
 *   streak_freeze: 50 coins
 *   streak_repair: 100 coins
 *   xp_boost: 75 coins (2x XP for 1 day)
 *   reroll_challenges: 25 coins
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const COIN_PRICES = {
  streak_freeze: 50,
  streak_repair: 100,
  xp_boost: 75,
  reroll_challenges: 25,
} as const;

export const COIN_REWARDS = {
  daily_login: 10,
  daily_challenge: 25,
  weekly_challenge: 100,
  all_dailies_bonus: 25,
  streak_milestone_7: 50,
  streak_milestone_30: 150,
  streak_milestone_90: 300,
  streak_milestone_180: 500,
  streak_milestone_365: 1000,
} as const;

export type CoinSource = keyof typeof COIN_REWARDS;
export type CoinSink = keyof typeof COIN_PRICES;

/**
 * Get or create user coins balance.
 */
async function getBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ balance: number; total_earned: number; total_spent: number }> {
  const { data } = await supabase
    .from("user_coins")
    .select("balance, total_earned, total_spent")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data;

  // Create default row
  const defaults = { user_id: userId, balance: 0, total_earned: 0, total_spent: 0 };
  await supabase.from("user_coins").upsert(defaults);
  return { balance: 0, total_earned: 0, total_spent: 0 };
}

/**
 * Award coins to a user.
 */
export async function earnCoins(
  supabase: SupabaseClient,
  userId: string,
  source: CoinSource,
  description?: string,
): Promise<{ newBalance: number; earned: number }> {
  const amount = COIN_REWARDS[source];
  const current = await getBalance(supabase, userId);

  const newBalance = current.balance + amount;

  await supabase.from("user_coins").upsert({
    user_id: userId,
    balance: newBalance,
    total_earned: current.total_earned + amount,
    total_spent: current.total_spent,
    updated_at: new Date().toISOString(),
  });

  await supabase.from("coin_transactions").insert({
    user_id: userId,
    amount,
    type: "earn",
    source,
    description: description ?? source.replace(/_/g, " "),
  });

  return { newBalance, earned: amount };
}

/**
 * Spend coins. Returns false if insufficient balance.
 */
export async function spendCoins(
  supabase: SupabaseClient,
  userId: string,
  sink: CoinSink,
  description?: string,
): Promise<{ success: boolean; newBalance: number }> {
  const cost = COIN_PRICES[sink];
  const current = await getBalance(supabase, userId);

  if (current.balance < cost) {
    return { success: false, newBalance: current.balance };
  }

  const newBalance = current.balance - cost;

  await supabase.from("user_coins").upsert({
    user_id: userId,
    balance: newBalance,
    total_earned: current.total_earned,
    total_spent: current.total_spent + cost,
    updated_at: new Date().toISOString(),
  });

  await supabase.from("coin_transactions").insert({
    user_id: userId,
    amount: cost,
    type: "spend",
    source: sink,
    description: description ?? sink.replace(/_/g, " "),
  });

  return { success: true, newBalance };
}

/**
 * Get user's current coin balance.
 */
export async function getCoinBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const data = await getBalance(supabase, userId);
  return data.balance;
}
