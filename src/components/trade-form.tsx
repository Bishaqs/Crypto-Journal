"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { tradeSchema, phantomTradeSchema, type TradeFormData, type PhantomTradeFormData } from "@/lib/validators";
import { calculateTradePnl } from "@/lib/calculations";
import { Trade, PhantomTrade, Chain, DEX_PROTOCOLS, CHAINS } from "@/lib/types";
import { X, Wallet, Building2, Trash2, Ghost } from "lucide-react";
import { EmotionPicker, ConfidenceSlider, SetupTypePicker, ProcessScoreInput } from "./psychology-inputs";
import { PreTradeMindset } from "./pre-trade-mindset";
import { PreTradeChecklist } from "./pre-trade-checklist";
import { PostTradeReview } from "./post-trade-review";
import { TagInput } from "./tag-input";
import { getCustomTagPresets, addCustomTagPreset, isUserTag } from "@/lib/tag-manager";
import { getCustomSetupPresets, addCustomSetupPreset, removeCustomSetupPreset } from "@/lib/setup-type-manager";
import { PlaybookSelector, playbookToChecklistItems } from "./playbook-selector";
import type { Playbook } from "@/lib/schemas/playbook";

const NARRATIVE_OPTIONS = [
  "AI", "Memecoin", "RWA", "DeFi", "L2/Infra", "BTC ETF",
  "Fed/Macro", "Earnings", "Airdrop", "Other",
];

export function TradeForm({
  onClose,
  onSaved,
  editTrade,
  editPhantom,
  onTradeCompleted,
  onDelete,
  variant = "modal",
  initialWhatIf = false,
}: {
  onClose: () => void;
  onSaved: () => void;
  editTrade?: Trade | null;
  editPhantom?: PhantomTrade | null;
  onTradeCompleted?: (trade: { id: string; symbol: string; pnl: number; emotion: string | null; process_score: number | null }) => void;
  onDelete?: () => void;
  variant?: "modal" | "inline";
  initialWhatIf?: boolean;
}) {
  const supabase = createClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isWhatIf, setIsWhatIf] = useState(initialWhatIf || !!editPhantom);

  // Psychology state
  const [emotion, setEmotion] = useState<string | null>(editTrade?.emotion ?? editPhantom?.emotion ?? null);
  const [confidence, setConfidence] = useState<number | null>(editTrade?.confidence ?? editPhantom?.confidence ?? null);
  const [setupType, setSetupType] = useState<string | null>(editTrade?.setup_type ?? editPhantom?.setup_type ?? null);
  const [setupPresets, setSetupPresets] = useState<string[]>([]);
  const [processScore, setProcessScore] = useState<number | null>(editTrade?.process_score ?? null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(editTrade?.checklist ?? {});
  const [review, setReview] = useState<Record<string, string>>(editTrade?.review ?? {});
  const [playbookId, setPlaybookId] = useState<string | null>((editTrade as Record<string, unknown>)?.playbook_id as string | null ?? null);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  useEffect(() => {
    setSetupPresets(getCustomSetupPresets());
  }, []);

  // Tags state (chip-based)
  const sourceTags = editTrade?.tags ?? editPhantom?.tags ?? [];
  const initTags = sourceTags.filter((t) => !t.startsWith("narrative:"));
  const initNarrative = sourceTags.find((t) => t.startsWith("narrative:"))?.replace("narrative:", "") ?? "";
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
      const { data } = await fetchAllTrades(supabase, "tags");
      const allTags = new Set<string>();
      if (data) {
        data.forEach((row) => {
          (row.tags as string[] | null)?.forEach((t) => {
            if (isUserTag(t)) allTags.add(t);
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

    try {
      const formData = new FormData(e.currentTarget);
      const combinedTags = [
        ...tags,
        ...(narrative === "other" && customNarrative.trim()
          ? [`narrative:${customNarrative.trim().toLowerCase()}`]
          : narrative && narrative !== "other"
            ? [`narrative:${narrative.toLowerCase()}`]
            : []),
      ];

      // ─── What-If path: save to phantom_trades ───────────────────────────
      if (isWhatIf) {
        const phantomRaw = {
          symbol: formData.get("symbol") as string,
          position: formData.get("position") as string,
          entry_price: formData.get("entry_price") as string,
          stop_loss: formData.get("stop_loss") as string || undefined,
          profit_target: formData.get("profit_target") as string || undefined,
          thesis: formData.get("notes") as string || undefined,
          setup_type: setupType || undefined,
          confidence: confidence || undefined,
          emotion: emotion || undefined,
          tags: combinedTags,
          observed_at: formData.get("open_timestamp") as string,
        };

        const phantomResult = phantomTradeSchema.safeParse(phantomRaw);
        if (!phantomResult.success) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of phantomResult.error.issues) {
            const field = issue.path[0] as string;
            // Map phantom field names back to form field names for display
            if (field === "observed_at") fieldErrors["open_timestamp"] = issue.message;
            else if (field === "thesis") fieldErrors["notes"] = issue.message;
            else fieldErrors[field] = issue.message;
          }
          setErrors(fieldErrors);
          return;
        }

        const phantomData: PhantomTradeFormData = phantomResult.data;
        const phantomPayload = {
          ...phantomData,
          asset_type: "crypto" as const,
          status: "active" as const,
        };

        let dbError;
        if (editPhantom) {
          ({ error: dbError } = await supabase
            .from("phantom_trades")
            .update(phantomPayload)
            .eq("id", editPhantom.id));
        } else {
          ({ error: dbError } = await supabase.from("phantom_trades").insert(phantomPayload));
        }

        if (dbError) {
          setErrors({ _form: dbError.message });
          return;
        }

        onSaved();
        onClose();
        return;
      }

      // ─── Normal trade path: save to trades ──────────────────────────────
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
        tags: combinedTags,
        emotion: emotion || undefined,
        confidence: confidence || undefined,
        setup_type: setupType || undefined,
        process_score: processScore || undefined,
        checklist: Object.keys(checklist).length > 0 ? checklist : undefined,
        review: Object.values(review).some((v) => v.length > 0) ? review : undefined,
        playbook_id: playbookId || undefined,
        // DEX fields
        trade_source: tradeSource,
        chain: tradeSource === "dex" && chain ? chain : undefined,
        dex_protocol: tradeSource === "dex" && dexProtocol ? dexProtocol : undefined,
        tx_hash: tradeSource === "dex" && txHash ? txHash : undefined,
        wallet_address: tradeSource === "dex" && walletAddress ? walletAddress : undefined,
        gas_fee: tradeSource === "dex" ? gasFee : 0,
        gas_fee_native: 0,
        stop_loss: formData.get("stop_loss") as string || undefined,
        profit_target: formData.get("profit_target") as string || undefined,
        price_mae: formData.get("price_mae") as string || undefined,
        price_mfe: formData.get("price_mfe") as string || undefined,
        mfe_timestamp: formData.get("mfe_timestamp") as string || undefined,
        mae_timestamp: formData.get("mae_timestamp") as string || undefined,
      };

      const result = tradeSchema.safeParse(raw);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
        setErrors(fieldErrors);
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
        stop_loss: data.stop_loss ?? null,
        profit_target: data.profit_target ?? null,
        price_mae: data.price_mae ?? null,
        price_mfe: data.price_mfe ?? null,
        mfe_timestamp: data.mfe_timestamp ?? null,
        mae_timestamp: data.mae_timestamp ?? null,
      };

      let dbError;
      if (editTrade) {
        ({ error: dbError } = await supabase
          .from("trades")
          .update(payload)
          .eq("id", editTrade.id));
      } else {
        ({ error: dbError } = await supabase.from("trades").insert(payload));
      }

      if (dbError) {
        setErrors({ _form: dbError.message });
        return;
      }

      // Award XP for new trades
      if (!editTrade) {
        try {
          const { awardXP } = await import("@/lib/xp/engine");
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await awardXP(supabase, user.id, payload.notes ? "trade_with_notes" : "trade_logged");
          }
        } catch { /* XP tables may not exist yet */ }
      }

      onSaved();

      // For new closed trades without psychology data, trigger post-trade prompt
      if (
        !editTrade &&
        onTradeCompleted &&
        payload.exit_price !== null &&
        payload.close_timestamp !== null &&
        !payload.emotion &&
        payload.process_score === null
      ) {
        const { data: inserted } = await supabase
          .from("trades")
          .select("id")
          .eq("symbol", payload.symbol)
          .eq("entry_price", payload.entry_price)
          .order("created_at", { ascending: false })
          .limit(1);

        if (inserted && inserted.length > 0) {
          onTradeCompleted({
            id: inserted[0].id,
            symbol: payload.symbol,
            pnl: pnl ?? 0,
            emotion: payload.emotion,
            process_score: payload.process_score,
          });
          return; // Don't call onClose — the prompt will handle it
        }
      }

      onClose();
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : "Failed to save trade. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const formContent = (
    <>
      {variant === "modal" && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {isWhatIf && <Ghost size={18} className="text-purple-400" />}
            {editTrade ? "Edit Trade" : editPhantom ? "Edit Setup" : isWhatIf ? "Log What-If Setup" : "Log Trade"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* What-If Toggle — only show when not editing an existing trade */}
          {!editTrade && (
            <div>
              <div className="inline-flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsWhatIf(false)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-all ${
                    !isWhatIf
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Real Trade
                </button>
                <button
                  type="button"
                  onClick={() => setIsWhatIf(true)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-all border-l border-border ${
                    isWhatIf
                      ? "bg-purple-500/15 text-purple-400"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Ghost size={12} />
                  What If
                </button>
              </div>
            </div>
          )}

          {/* Pre-trade mindset (collapsible) */}
          <PreTradeMindset />

          {/* Trade Source Toggle: CEX / DEX — hidden in What If mode */}
          {!isWhatIf && (
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
          )}

          {/* DEX-specific fields — hidden in What If mode */}
          {!isWhatIf && tradeSource === "dex" && (
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
                defaultValue={editTrade?.symbol ?? editPhantom?.symbol ?? ""}
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
                defaultValue={editTrade?.position ?? editPhantom?.position ?? "long"}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
          </div>

          {/* Prices */}
          <div className={`grid gap-4 ${isWhatIf ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <label className="block text-xs text-muted mb-1">Entry Price</label>
              <input
                name="entry_price"
                type="number"
                step="any"
                defaultValue={editTrade?.entry_price ?? editPhantom?.entry_price ?? ""}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
              {errors.entry_price && (
                <p className="text-xs text-loss mt-1">{errors.entry_price}</p>
              )}
            </div>
            {!isWhatIf && (
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
            )}
          </div>

          {/* Trade Planning */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Stop Loss <span className="text-muted/60">(optional)</span></label>
              <input name="stop_loss" type="number" step="any" defaultValue={editTrade?.stop_loss ?? editPhantom?.stop_loss ?? ""} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Profit Target <span className="text-muted/60">(optional)</span></label>
              <input name="profit_target" type="number" step="any" defaultValue={editTrade?.profit_target ?? editPhantom?.profit_target ?? ""} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          {/* MAE / MFE — hidden in What If mode */}
          {!isWhatIf && (
          <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Price MAE <span className="text-muted/60">(optional)</span></label>
              <input name="price_mae" type="number" step="any" defaultValue={editTrade?.price_mae ?? ""} placeholder="Worst price" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Price MFE <span className="text-muted/60">(optional)</span></label>
              <input name="price_mfe" type="number" step="any" defaultValue={editTrade?.price_mfe ?? ""} placeholder="Best price" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">MFE Timestamp <span className="text-muted/60">(optional)</span></label>
              <input name="mfe_timestamp" type="datetime-local" defaultValue={editTrade?.mfe_timestamp ? editTrade.mfe_timestamp.slice(0, 16) : ""} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">MAE Timestamp <span className="text-muted/60">(optional)</span></label>
              <input name="mae_timestamp" type="datetime-local" defaultValue={editTrade?.mae_timestamp ? editTrade.mae_timestamp.slice(0, 16) : ""} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent" />
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
          </>
          )}

          {/* Timestamp */}
          <div className={`grid gap-4 ${isWhatIf ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <label className="block text-xs text-muted mb-1">{isWhatIf ? "Observed At" : "Open Time"}</label>
              <input
                name="open_timestamp"
                type="datetime-local"
                defaultValue={
                  editTrade?.open_timestamp
                    ? editTrade.open_timestamp.slice(0, 16)
                    : editPhantom?.observed_at
                      ? editPhantom.observed_at.slice(0, 16)
                      : isWhatIf
                        ? new Date().toISOString().slice(0, 16)
                        : ""
                }
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
              {errors.open_timestamp && (
                <p className="text-xs text-loss mt-1">{errors.open_timestamp}</p>
              )}
            </div>
            {!isWhatIf && (
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
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-muted mb-1">Tags</label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={tagSuggestions}
              placeholder="Type tag and press Enter..."
              onTagAdded={(tag) => addCustomTagPreset(tag)}
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

          {/* Notes / Thesis */}
          <div>
            <label className="block text-xs text-muted mb-1">
              {isWhatIf ? "Thesis" : "Notes"}
            </label>
            <textarea
              name="notes"
              rows={isWhatIf ? 3 : 2}
              defaultValue={editTrade?.notes ?? editPhantom?.thesis ?? ""}
              placeholder={isWhatIf ? "What setup did you see? Why did you consider it?" : "Why did you take this trade?"}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* ═══════════ Psychology Section ═══════════ */}
          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
              Psychology
            </p>

            <PlaybookSelector
              value={playbookId}
              onChange={(id, pb) => {
                setPlaybookId(id);
                setSelectedPlaybook(pb);
                if (pb) {
                  setSetupType(pb.name);
                  // Reset checklist to playbook rules
                  const pbItems = playbookToChecklistItems(pb);
                  if (pbItems) setChecklist(Object.fromEntries(pbItems.map((item) => [item.key, false])));
                } else {
                  setChecklist({});
                }
              }}
              assetClass="crypto"
            />
            <EmotionPicker value={emotion} onChange={setEmotion} />
            <ConfidenceSlider value={confidence} onChange={setConfidence} />
            <SetupTypePicker
              value={setupType}
              onChange={setSetupType}
              savedPresets={setupPresets}
              onSavePreset={(name) => setSetupPresets(addCustomSetupPreset(name))}
              onRemovePreset={(name) => setSetupPresets(removeCustomSetupPreset(name))}
            />
            <PreTradeChecklist
              value={checklist}
              onChange={setChecklist}
              items={playbookToChecklistItems(selectedPlaybook)}
            />

            {/* Post-trade fields only show when there's an exit price and not in What If mode */}
            {!isWhatIf && hasExit && (
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

          <div className="flex items-center gap-3">
            {editTrade && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-loss/10 border border-loss/20 text-loss font-medium hover:bg-loss/20 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                isWhatIf
                  ? "bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
                  : "bg-accent text-background hover:bg-accent-hover"
              }`}
            >
              {saving
                ? "Saving..."
                : editTrade
                  ? "Update Trade"
                  : editPhantom
                    ? "Update Setup"
                    : isWhatIf
                      ? "Log What-If Setup"
                      : "Log Trade"}
            </button>
          </div>
        </form>
    </>
  );

  if (variant === "inline") {
    return (
      <div className="glass border border-border/50 rounded-xl w-full">
        {formContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-border/50 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {formContent}
      </div>
    </div>
  );
}
