"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Gift, Check } from "lucide-react";

export function RedeemCodeSection() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage({ type: "error", text: "You must be logged in" }); setLoading(false); return; }

    const { data, error } = await supabase.rpc("redeem_invite_code", {
      p_code: code.trim().toUpperCase(),
      p_user_id: user.id,
    });

    if (error || !data?.success) {
      setMessage({ type: "error", text: data?.error ?? error?.message ?? "Failed to redeem" });
      setLoading(false);
      return;
    }

    setMessage({ type: "success", text: `You now have ${(data.tier as string).toUpperCase()} tier access!` });
    setCode("");
    setLoading(false);
    localStorage.removeItem("stargate-subscription-cache");
    setTimeout(() => window.location.reload(), 2000);
  }

  return (
    <div className="glass rounded-xl border border-border/50 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Gift size={20} className="text-accent" />
        <h3 className="text-lg font-bold text-foreground">Have an invite code?</h3>
      </div>
      <p className="text-sm text-muted mb-4">Redeem a code to unlock Pro or Max features for free.</p>
      <form onSubmit={handleRedeem} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="STARGATE-MAX-XXXXX"
          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder-muted focus:border-accent transition-colors"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !code} className="px-4 py-2 rounded-lg bg-accent text-background font-semibold hover:bg-accent-hover disabled:opacity-50 transition-all">
          {loading ? "..." : "Redeem"}
        </button>
      </form>
      {message && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${message.type === "success" ? "bg-win/10 text-win" : "bg-loss/10 text-loss"}`}>
          {message.type === "success" && <Check size={14} />}
          {message.text}
        </div>
      )}
    </div>
  );
}
