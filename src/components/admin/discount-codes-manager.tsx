"use client";

import { useState } from "react";
import { Copy, Plus, Trash2, Check, XCircle, AlertTriangle } from "lucide-react";

type DiscountCode = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  applicable_tiers: string[];
  applicable_billing: string[];
  description: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
};

export function AdminDiscountManager({ initialCodes }: { initialCodes: DiscountCode[] }) {
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [applicableTiers, setApplicableTiers] = useState<string[]>(["pro", "max"]);
  const [applicableBilling, setApplicableBilling] = useState<string[]>(["monthly", "yearly"]);
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function toggleTier(tier: string) {
    setApplicableTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  }

  function toggleBilling(cycle: string) {
    setApplicableBilling((prev) =>
      prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle]
    );
  }

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountType,
          discountValue: parseFloat(discountValue),
          applicableTiers,
          applicableBilling,
          description: description || undefined,
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiresAt: expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create discount code");
        return;
      }
      setCodes([data.code, ...codes]);
      setShowForm(false);
      setDiscountValue("");
      setDescription("");
      setMaxUses("");
      setExpiresAt("");
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function deactivateCode(id: string) {
    const res = await fetch("/api/admin/discount", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCodes(codes.map((c) => (c.id === id ? { ...c, is_active: false } : c)));
    }
  }

  async function deleteCode(id: string) {
    const res = await fetch("/api/admin/discount", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCodes(codes.filter((c) => c.id !== id));
    }
    setConfirmDelete(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function formatDiscount(type: string, value: number): string {
    return type === "percentage" ? `${value}% off` : `$${value} off`;
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Manage Discount Codes</h3>
          <p className="text-xs text-muted">Create pricing discounts for checkout</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1 font-medium">Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1 font-medium">
                Value {discountType === "percentage" ? "(%)" : "($)"}
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "e.g., 20" : "e.g., 5"}
                required
                min="0.01"
                max={discountType === "percentage" ? "100" : undefined}
                step="0.01"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 font-medium">Applicable Tiers</label>
            <div className="flex gap-2">
              {["pro", "max"].map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applicableTiers.includes(t)}
                    onChange={() => toggleTier(t)}
                    className="rounded border-border accent-accent"
                  />
                  <span className="capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 font-medium">Applicable Billing</label>
            <div className="flex gap-2">
              {["monthly", "yearly"].map((b) => (
                <label key={b} className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applicableBilling.includes(b)}
                    onChange={() => toggleBilling(b)}
                    className="rounded border-border accent-accent"
                  />
                  <span className="capitalize">{b}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1 font-medium">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Launch week special"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder-muted"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs text-muted mb-1 font-medium">Expires (optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating || !discountValue || applicableTiers.length === 0}
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
                  <span className="text-[10px] font-bold uppercase bg-emerald-400/15 text-emerald-400 px-1.5 py-0.5 rounded">
                    {formatDiscount(c.discount_type, c.discount_value)}
                  </span>
                  {!c.is_active && (
                    <span className="text-[10px] bg-muted/20 text-muted px-1.5 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  {c.applicable_tiers?.map((t) => (
                    <span key={t} className="text-[10px] text-muted bg-surface-hover px-1.5 py-0.5 rounded capitalize">
                      {t}
                    </span>
                  ))}
                  {c.applicable_billing?.map((b) => (
                    <span key={b} className="text-[10px] text-muted bg-surface-hover px-1.5 py-0.5 rounded capitalize">
                      {b}
                    </span>
                  ))}
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
                  onClick={() => copyCode(c.code)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                  title="Copy code"
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
            No discount codes yet. Click &quot;New Code&quot; to create one.
          </div>
        )}
      </div>
    </div>
  );
}
