"use client";

import { useState } from "react";
import { Copy, Plus, Trash2, Check, XCircle, AlertTriangle } from "lucide-react";

type InviteCode = {
  id: string;
  code: string;
  grants_tier: string;
  description: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
};

export function AdminInviteManager({ initialCodes }: { initialCodes: InviteCode[] }) {
  const [codes, setCodes] = useState<InviteCode[]>(initialCodes);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tier, setTier] = useState<"pro" | "max">("max");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          description: description || undefined,
          maxUses: maxUses ? parseInt(maxUses) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create code");
        return;
      }
      setCodes([data.code, ...codes]);
      setShowForm(false);
      setDescription("");
      setMaxUses("");
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function deactivateCode(id: string) {
    const res = await fetch("/api/admin/invite", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCodes(codes.map((c) => (c.id === id ? { ...c, is_active: false } : c)));
    }
  }

  async function deleteCode(id: string) {
    const res = await fetch("/api/admin/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCodes(codes.filter((c) => c.id !== id));
    }
    setConfirmDelete(null);
  }

  function copyLink(code: string) {
    const link = `https://stargate-journal.vercel.app/login?invite=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Manage Invite Codes</h3>
          <p className="text-xs text-muted">Create, deactivate, or delete invite codes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-xs font-semibold hover:bg-accent-hover transition-all"
        >
          <Plus size={12} /> New Code
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-loss/10 border border-loss/20 text-xs text-loss">
          <AlertTriangle size={12} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><XCircle size={12} /></button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={createCode} className="rounded-xl border border-border/50 bg-surface p-4 space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1 font-medium">Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as "pro" | "max")}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
            >
              <option value="max">Max</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 font-medium">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Beta tester"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 font-medium">Max uses (empty = unlimited)</label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-border text-muted text-sm hover:text-foreground transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Codes list */}
      <div className="space-y-2">
        {codes.map((c) => (
          <div
            key={c.id}
            className={`rounded-xl border border-border/50 bg-surface p-4 ${!c.is_active ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <code className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                    {c.code}
                  </code>
                  <span className="text-[10px] font-bold uppercase bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                    {c.grants_tier}
                  </span>
                  {!c.is_active && (
                    <span className="text-[10px] bg-muted/20 text-muted px-1.5 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                {c.description && (
                  <p className="text-xs text-muted mb-0.5">{c.description}</p>
                )}
                <span className="text-[10px] text-muted">
                  Uses: {c.current_uses}/{c.max_uses ?? "\u221e"}
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => copyLink(c.code)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                  title="Copy invite link"
                >
                  {copiedCode === c.code ? (
                    <Check size={14} className="text-win" />
                  ) : (
                    <Copy size={14} className="text-muted" />
                  )}
                </button>
                {c.is_active && (
                  <button
                    onClick={() => deactivateCode(c.id)}
                    className="p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
                    title="Deactivate"
                  >
                    <XCircle size={14} className="text-amber-400" />
                  </button>
                )}
                {confirmDelete === c.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteCode(c.id)}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-loss text-white hover:bg-loss/80 transition-all"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1 rounded text-[10px] font-semibold text-muted hover:text-foreground transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(c.id)}
                    className="p-1.5 rounded-lg hover:bg-loss/10 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 size={14} className="text-loss" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {codes.length === 0 && (
          <div className="text-center py-8 text-muted text-sm">
            No invite codes yet. Click &quot;New Code&quot; to create one.
          </div>
        )}
      </div>
    </div>
  );
}
