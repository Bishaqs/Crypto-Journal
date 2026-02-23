"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/use-subscription";
import { Copy, Plus, Trash2, Check } from "lucide-react";

type InviteCode = {
  id: string;
  code: string;
  grants_tier: "pro" | "max";
  description: string | null;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export function InviteCodesTab() {
  const { isOwner } = useSubscription();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tier, setTier] = useState<"pro" | "max">("max");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const supabase = createClient();

  const fetchCodes = useCallback(async () => {
    const { data } = await supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCodes(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (isOwner) fetchCodes();
    else setLoading(false);
  }, [isOwner, fetchCodes]);

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const code = `STARGATE-${tier.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { error } = await supabase.from("invite_codes").insert({
      code,
      grants_tier: tier,
      description: description || null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      created_by: user.id,
    });

    if (error) { alert("Failed: " + error.message); return; }
    setShowForm(false);
    setDescription("");
    setMaxUses("");
    fetchCodes();
  }

  async function deactivateCode(id: string) {
    await supabase.from("invite_codes").update({ is_active: false }).eq("id", id);
    fetchCodes();
  }

  function copyLink(code: string) {
    const link = `https://stargate-journal.vercel.app/login?invite=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  if (!isOwner) {
    return <div className="text-center py-12 text-muted">Only the owner can manage invite codes.</div>;
  }

  if (loading) return <div className="text-center py-8 text-muted">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Invite Codes</h3>
          <p className="text-sm text-muted">Generate links to grant free access</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all">
          <Plus size={14} /> New Code
        </button>
      </div>

      {showForm && (
        <form onSubmit={createCode} className="glass rounded-xl border border-border/50 p-4 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
          <div>
            <label className="block text-sm text-muted mb-1">Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as "pro" | "max")} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground">
              <option value="max">Max</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Beta tester" className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder-muted" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Max uses (leave empty for unlimited)</label>
            <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder-muted" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-background font-semibold hover:bg-accent-hover transition-all">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground transition-all">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {codes.map((c) => (
          <div key={c.id} className={`glass rounded-xl border border-border/50 p-4 ${!c.is_active ? "opacity-50" : ""}`} style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono text-accent bg-accent/10 px-2 py-1 rounded">{c.code}</code>
                  <span className="text-[10px] font-bold uppercase bg-accent/15 text-accent px-2 py-0.5 rounded">{c.grants_tier}</span>
                  {!c.is_active && <span className="text-[10px] bg-muted/20 text-muted px-2 py-0.5 rounded">Inactive</span>}
                </div>
                {c.description && <p className="text-sm text-muted mb-1">{c.description}</p>}
                <span className="text-xs text-muted">Uses: {c.current_uses}/{c.max_uses ?? "\u221e"}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => copyLink(c.code)} className="p-2 rounded-lg hover:bg-surface transition-colors" title="Copy invite link">
                  {copiedCode === c.code ? <Check size={14} className="text-win" /> : <Copy size={14} className="text-muted" />}
                </button>
                {c.is_active && (
                  <button onClick={() => deactivateCode(c.id)} className="p-2 rounded-lg hover:bg-loss/10 transition-colors" title="Deactivate">
                    <Trash2 size={14} className="text-loss" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {codes.length === 0 && <div className="text-center py-8 text-muted text-sm">No invite codes yet.</div>}
      </div>
    </div>
  );
}
