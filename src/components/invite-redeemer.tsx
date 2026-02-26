"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearSubscriptionCache } from "@/lib/use-subscription";

/**
 * Reads ?invite= and ?ref= params from the URL (set during OAuth redirect)
 * and auto-redeems invite codes or tracks referral signups.
 * Renders nothing — just runs the side effect on mount.
 */
export function InviteRedeemer() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    const ref = params.get("ref");
    if (!invite && !ref) return;

    async function process() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (invite) {
        try {
          const res = await fetch("/api/invite/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: invite }),
          });
          const result = await res.json();
          if (result?.success) {
            clearSubscriptionCache();
          }
        } catch {}
      }

      if (ref) {
        await supabase.rpc("track_referral_signup", {
          p_code: ref,
          p_new_user_id: user.id,
        });
      }

      // Clean URL params after processing
      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.pathname);
    }

    process();
  }, []);

  return null;
}
