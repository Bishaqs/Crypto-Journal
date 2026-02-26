"use client";

import { useState } from "react";
import { Gift, Check } from "lucide-react";

export function RedeemCodeSection() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage({ type: "error", text: data.error ?? "Failed to redeem" });
        setLoading(false);
        return;
      }

      setMessage({ type: "success", text: `You now have ${(data.tier as string).toUpperCase()} tier access!` });
      setCode("");
      setLoading(false);
      localStorage.removeItem("stargate-subscription-cache");
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      setMessage({ type: "error", text: "Failed to redeem code" });
      setLoading(false);
    }
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
