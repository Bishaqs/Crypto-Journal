"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type BettingSettings = {
  /** Starting bankroll, in the chosen currency. */
  bankroll: number;
  /** One unit = this percent of the (current) bankroll. */
  unitPct: number;
  /** Display currency symbol. */
  currency: string;
};

export const DEFAULT_BETTING_SETTINGS: BettingSettings = {
  bankroll: 1000,
  unitPct: 1,
  currency: "€",
};

function coerce(raw: unknown): BettingSettings {
  const r = (raw ?? {}) as Partial<Record<keyof BettingSettings, unknown>>;
  const bankroll = Number(r.bankroll);
  const unitPct = Number(r.unitPct);
  return {
    bankroll: Number.isFinite(bankroll) && bankroll > 0 ? bankroll : DEFAULT_BETTING_SETTINGS.bankroll,
    unitPct: Number.isFinite(unitPct) && unitPct > 0 ? unitPct : DEFAULT_BETTING_SETTINGS.unitPct,
    currency: typeof r.currency === "string" && r.currency.trim() ? r.currency.trim().slice(0, 4) : DEFAULT_BETTING_SETTINGS.currency,
  };
}

/**
 * Bankroll/unit settings persisted in `user_preferences.preferences.betting`
 * (same DB-backed pattern as tag-colors) so they survive a browser/localStorage reset.
 */
export function useBettingSettings() {
  const [settings, setSettings] = useState<BettingSettings>(DEFAULT_BETTING_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_preferences")
          .select("preferences")
          .maybeSingle();
        const betting = (data?.preferences as Record<string, unknown> | null)?.betting;
        if (active && betting) setSettings(coerce(betting));
      } catch {
        /* table/row may not exist — keep defaults */
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (partial: Partial<BettingSettings>) => {
    const next = coerce({ ...settings, ...partial });
    setSettings(next); // optimistic
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // Merge into existing preferences so we don't clobber tag_colors etc.
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("preferences")
        .maybeSingle();
      const merged = {
        ...((existing?.preferences as Record<string, unknown>) ?? {}),
        betting: next,
      };
      await supabase
        .from("user_preferences")
        .upsert(
          { user_id: user.id, preferences: merged, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
    } catch {
      /* RLS / offline — optimistic state still applies for the session */
    }
  }, [settings]);

  return { settings, loaded, save };
}
