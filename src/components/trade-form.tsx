"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { tradeSchema, type TradeFormData } from "@/lib/validators";
import { calculateTradePnl } from "@/lib/calculations";
import { Trade, Chain, DEX_PROTOCOLS, CHAINS } from "@/lib/types";
import { X, Wallet, Building2 } from "lucide-react";
import { EmotionPicker, ConfidenceSlider, SetupTypePicker, ProcessScoreInput } from "./psychology-inputs";
import { PreTradeChecklist } from "./pre-trade-checklist";
import { PostTradeReview } from "./post-trade-review";
import { TagInput } from "./tag-input";
import { getCustomTagPresets } from "@/lib/tag-manager";
import { checkFeatureAccess, type SubscriptionTier } from "@/lib/use-subscription";

const NARRATIVE_OPTIONS = [
  "AI", "Memecoin", "RWA", "DeFi", "L2/Infra", "BTC ETF",
  "Fed/Macro", "Earnings", "Airdrop", "Other",
];

export function TradeForm({
  onClose,
  onSaved,
  editTrade,
}: {
  onClose: () => void;
  onSaved: () => void;
  editTrade?: Trade | null;
}) {
  const supabase = createClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Psychology state
  const [emotion, setEmotion] = useState<string | null>(editTrade?.emotion ?? null);
  const [confidence, setConfidence] = useState<number | null>(editTrade?.confidence ?? null);
  const [setupType, setSetupType] = useState<string | null>(editTrade?.setup_type ?? null);
  const [processScore, setProcessScore] = useState<number | null>(editTrade?.process_score ?? null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(editTrade?.checklist ?? {});
  const [review, setReview] = useState<Record<string, string>>(editTrade?.review ?? {});

  // Tags state (chip-based)
  const initTags = (editTrade?.tags ?? []).filter((t) => !t.startsWith("narrative:"));
  const initNarrative = editTrade?.tags?.find((t) => t.startsWith("narrative:"))?.replace("narrative:", "") ?? "";
  const [tags, setTags] = useState<string[]>(initTags);
  const [narrative, setNarrative] = useState(initNarrative);
  const [customNarrative, setCustomNarrative] = useState(
    initNarrative && !NARRATIVE_OPTIONS.map((n) => n.toLowerCase()).includes(initNarrative.toLowerCase()) ? initNarrative : ""
  );
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // DEX state
  const [tradeSource, setTradeSource] = useState<"cex" | "dex">(editTrade?.trade_source ?? "cex");
  const [chain, setChain] = useState<Chain | "">(editTrade?.chain ?? "");
  const [dexProtocol, setDexProtocol] = useState(editTrade?.dex_protocol ?? "");
  const [txHash, setTxHash] = useState(editTrade?.tx_hash ?? "");
  const [walletAddress, setWalletAddress] = useState(editTrade?.wallet_address ?? "");
  const [gasFee, setGasFee] = useState(editTrade?.gas_fee ?? 0);

  // Track if we have an exit price to show post-trade fields
  const [hasExit, setHasExit] = useState(!!editTrade?.exit_price);

  // Fetch tag suggestions from existing trades + custom presets
  useEffect(() => {
    async function fetchTags() {
      const { data } = await supabase.from("trades").select("tags");
      const allTags = new Set<string>();
      if (data) {
        data.forEach((row: { tags: string[] | null }) => {
          row.tags?.forEach((t) => {
            if (!t.startsWith("narrative:")) allTags.add(t);
          });
        });
      }
      // Merge custom presets
      const presets = getCustomTagPresets();
      presets.forEach((p) => allTags.add(p));
      setTagSuggestions(Array.from(allTags).sort());
    }
    fetchTags();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    // Free tier: 2 trades per week limit
    if (!editTrade) {
      try {
        const raw = localStorage.getItem("stargate-subscription-cache");
        const tier: SubscriptionTier = raw ? (JSON.parse(raw).data?.tier ?? "free") : "free";
        if (!checkFeatureAccess(tier, "unlimited-trades")) {
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const { count } = await supabase
            .from("trades")
            .select("*", { count: "exact", head: true })
            .gte("created_at", weekStart.toISOString());
          if ((count ?? 0) >= 2) {
            setErrors({ symbol: "Free tier is limited to 2 trades per week. Upgrade to Pro for unlimited trades." });
            setSaving(false);
            return;
          }
        }
      } catch {}
    }

    const formData = new FormData(e.currentTarget);
    const raw = {
      symbol: formData.get("symbol") as string,
      position: formData.get("position") as string,
      entry_price: formData.get("entry_price") as string,
      exit_price: formData.get("exit_price") as string || undefined,
      quantity: formData.get("quantity") as string,
      fees: formData.get("fees") as string || "0",
      open_timestamp: formData.get("open_timestamp") as string,
      close_timestamp: formData.get("close_timestamp") as string || undefined,
      notes: formData.get("notes") as string || undefined,
      tags: [
        ...tags,
        ...(narrative === "other" && customNarrative.trim()
          ? [`narrative:${customNarrative.trim().toLowerCase()}`]
          : narrative && narrative !== "other"
            ? [`narrative:${narrative.toLowerCase()}`]
            : []),
      ],
      emotion: emotion || undefined,
      confidence: confidence || undefined,
      setup_type: setupType || undefined,
      process_score: processScore || undefined,
      checklist: Object.keys(checklist).length > 0 ? checklist : undefined,
      review: Object.values(review).some((v) => v.length > 0) ? review : undefined,
      // DEX fields
      trade_source: tradeSource,
      chain: tradeSource === "dex" && chain ? chain : undefined,
      dex_protocol: tradeSource === "dex" && dexProtocol ? dexProtocol : undefined,
      tx_hash: tradeSource === "dex" && txHash ? txHash : undefined,
      wallet_address: tradeSource === "dex" && walletAddress ? walletAddress : undefined,
      gas_fee: tradeSource === "dex" ? gasFee : 0,
      gas_fee_native: 0,
    };

    const result = tradeSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      setSaving(false);
      return;
    }

    const data: TradeFormData = result.data;

    let pnl: number | null = null;
    if (data.exit_price && data.close_timestamp) {
      const tempTrade = {
        ...data,
        exit_price: data.exit_price,
        position: data.position as "long" | "short",
      } as Trade;
      pnl = calculateTradePnl(tempTrade);
    }

    const payload = {
      symbol: data.symbol,
      position: data.position,
      entry_price: data.entry_price,
      exit_price: data.exit_price ?? null,
      quantity: data.quantity,
      fees: data.fees,
      open_timestamp: data.open_timestamp,
      close_timestamp: data.close_timestamp ?? null,
      notes: data.notes ?? null,
      tags: data.tags,
      pnl,
      emotion: data.emotion ?? null,
      confidence: data.confidence ?? null,
      setup_type: data.setup_type ?? null,
      process_score: data.process_score ?? null,
      checklist: data.checklist ?? null,
      review: data.review ?? null,
      trade_source: data.trade_source,
      chain: data.chain ?? null,
      dex_protocol: data.dex_protocol ?? null,
      tx_hash: data.tx_hash ?? null,
      wallet_address: data.wallet_address ?? null,
      gas_fee: data.gas_fee,
      gas_fee_native: data.gas_fee_native,
    };

    let error;
    if (editTrade) {
      ({ error } = await supabase
        .from("trades")
        .update(payload)
        .eq("id", editTrade.id));
    } else {
      ({ error } = await supabase.from("trades").insert(payload));
    }

    if (error) {
      setErrors({ _form: error.message });
      setSaving(false);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-border/50 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {editTrade ? "Edit Trade" : "Log Trade"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Trade Source Toggle: CEX / DEX */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Trade Source</label>
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setTradeSource("cex")}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-all ${
                  tradeSource === "cex"
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Building2 size={12} />
                CEX
              </button>
              <button
                type="button"
                onClick={() => setTradeSource("dex")}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-all border-l border-border ${
                  tradeSource === "dex"
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Wallet size={12} />
                DEX
              </button>
            </div>
          </div>

          {/* DEX-specific fields */}
          {tradeSource === "dex" && (
            <div className="space-y-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <p className="text-[10px] uppercase tracking-wider text-accent/60 font-semibold">
                On-Chain Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Chain</label>
                  <select
                    value={chain}
                    onChange={(e) => {
                      setChain(e.target.value as Chain);
                      setDexProtocol("");
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="">Select chain</option>
                    {CHAINS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">DEX Protocol</label>
                  <select
                    value={dexProtocol}
                    onChange={(e) => setDexProtocol(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                    disabled={!chain}
                  >
                    <option value="">{chain ? "Select protocol" : "Select chain first"}</option>
                    {chain && DEX_PROTOCOLS[chain]?.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Wallet Address</label>
                <input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={chain === "solana" ? "So1..." : "0x..."}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent font-mono text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Tx Hash</label>
                  <input
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Gas Fee (USD)</label>
                  <input
                    type="number"
                    step="any"
                    value={gasFee || ""}
                    onChange={(e) => setGasFee(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Symbol & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Symbol</label>
              <input
                name="symbol"
                defaultValue={editTrade?.symbol ?? ""}
                placeholder="BTCUSDT"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
              {errors.symbol && (
                <p className="text-xs text-loss mt-1">{errors.symbol}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Position</label>
              <select
                name="position"
                defaultValue={editTrade?.position ?? "long"}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Entry Price</label>
              <input
                name="entry_price"
                type="number"
                step="any"
                defaultValue={editTrade?.entry_price ?? ""}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
              {errors.entry_price && (
                <p className="text-xs text-loss mt-1">{errors.entry_price}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Exit Price <span className="text-muted/60">(blank if open)</span>
              </label>
              <input
                name="exit_price"
                type="number"
                step="any"
                defaultValue={editTrade?.exit_price ?? ""}
                placeholder="0.00"
                onChange={(e) => setHasExit(!!e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Quantity & Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Quantity</label>
              <input
                name="quantity"
                type="number"
                step="any"
                defaultValue={editTrade?.quantity ?? ""}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
              {errors.quantity && (
                <p className="text-xs text-loss mt-1">{errors.quantity}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Fees</label>
              <input
                name="fees"
                type="number"
                step="any"
                defaultValue={editTrade?.fees ?? 0}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Open Time</label>
              <input
                name="open_timestamp"
                type="datetime-local"
                defaultValue={
                  editTrade?.open_timestamp
                    ? editTrade.open_timestamp.slice(0, 16)
                    : ""
                }
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
              {errors.open_timestamp && (
                <p className="text-xs text-loss mt-1">{errors.open_timestamp}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Close Time <span className="text-muted/60">(blank if open)</span>
              </label>
              <input
                name="close_timestamp"
                type="datetime-local"
                defaultValue={
                  editTrade?.close_timestamp
                    ? editTrade.close_timestamp.slice(0, 16)
                    : ""
                }
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-muted mb-1">Tags</label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={tagSuggestions}
              placeholder="Type tag and press Enter..."
            />
          </div>

          {/* Narrative / Catalyst */}
          <div>
            <label className="block text-xs text-muted mb-1">
              Narrative <span className="text-muted/60">(catalyst/theme)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {NARRATIVE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNarrative(narrative === n.toLowerCase() ? "" : n.toLowerCase())}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    narrative === n.toLowerCase()
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-background border border-border text-muted hover:text-foreground hover:border-accent/20"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {narrative === "other" && (
              <input
                type="text"
                value={customNarrative}
                onChange={(e) => setCustomNarrative(e.target.value)}
                placeholder="Custom narrative..."
                className="w-full mt-2 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-muted mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={editTrade?.notes ?? ""}
              placeholder="Why did you take this trade?"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* ═══════════ Psychology Section ═══════════ */}
          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
              Psychology
            </p>

            <EmotionPicker value={emotion} onChange={setEmotion} />
            <ConfidenceSlider value={confidence} onChange={setConfidence} />
            <SetupTypePicker value={setupType} onChange={setSetupType} />
            <PreTradeChecklist value={checklist} onChange={setChecklist} />

            {/* Post-trade fields only show when there's an exit price */}
            {hasExit && (
              <>
                <div className="border-t border-border/50 pt-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold mb-3">
                    Post-Trade Review
                  </p>
                  <ProcessScoreInput value={processScore} onChange={setProcessScore} />
                </div>
                <PostTradeReview value={review} onChange={setReview} />
              </>
            )}
          </div>

          {errors._form && (
            <p className="text-sm text-loss bg-loss/10 px-3 py-2 rounded-lg">
              {errors._form}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-accent text-background font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : editTrade ? "Update Trade" : "Log Trade"}
          </button>
        </form>
      </div>
    </div>
  );
}
