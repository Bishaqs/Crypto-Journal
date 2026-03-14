"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { commodityTradeSchema, type CommodityTradeFormData } from "@/lib/validators";
import { CommodityTrade, COMMODITY_SYMBOLS, COMMODITY_CATEGORIES, COMMODITY_EXCHANGES } from "@/lib/types";
import { X } from "lucide-react";
import { EmotionPicker, ConfidenceSlider, SetupTypePicker, ProcessScoreInput } from "./psychology-inputs";
import { PreTradeChecklist } from "./pre-trade-checklist";
import { PostTradeReview } from "./post-trade-review";
import { TagInput } from "./tag-input";
import { getCustomTagPresets, addCustomTagPreset, isUserTag } from "@/lib/tag-manager";
import { getCustomSetupPresets, addCustomSetupPreset, removeCustomSetupPreset } from "@/lib/setup-type-manager";

const CATEGORY_LABELS: Record<string, string> = {
  metals: "Metals",
  energy: "Energy",
  grains: "Grains",
  softs: "Softs",
  livestock: "Livestock",
};

export function CommodityTradeForm({
  onClose,
  onSaved,
  editTrade,
  variant = "modal",
}: {
  onClose: () => void;
  onSaved: () => void;
  editTrade?: CommodityTrade | null;
  variant?: "modal" | "inline";
}) {
  const supabase = createClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Contract type toggle
  const [contractType, setContractType] = useState<"spot" | "futures" | "options">(
    editTrade?.contract_type ?? "futures"
  );

  // Symbol & auto-fill
  const [symbol, setSymbol] = useState(editTrade?.symbol ?? "");
  const symbolInfo = useMemo(() => COMMODITY_SYMBOLS[symbol.toUpperCase()] ?? null, [symbol]);

  // Option type
  const [optionType, setOptionType] = useState<"call" | "put">(editTrade?.option_type ?? "call");

  // Psychology state
  const [emotion, setEmotion] = useState<string | null>(editTrade?.emotion ?? null);
  const [confidence, setConfidence] = useState<number | null>(editTrade?.confidence ?? null);
  const [setupType, setSetupType] = useState<string | null>(editTrade?.setup_type ?? null);
  const [setupPresets, setSetupPresets] = useState<string[]>([]);
  const [processScore, setProcessScore] = useState<number | null>(editTrade?.process_score ?? null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(editTrade?.checklist ?? {});
  const [review, setReview] = useState<Record<string, string>>(editTrade?.review ?? {});

  useEffect(() => {
    setSetupPresets(getCustomSetupPresets());
  }, []);

  // Tags state
  const [tags, setTags] = useState<string[]>(editTrade?.tags ?? []);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // Track exit
  const [hasExit, setHasExit] = useState(!!editTrade?.exit_price);

  // Symbol suggestions for autocomplete
  const symbolKeys = useMemo(() => Object.keys(COMMODITY_SYMBOLS), []);

  // Fetch tag suggestions
  useEffect(() => {
    async function fetchTags() {
      const { data } = await supabase.from("commodity_trades").select("tags");
      const allTags = new Set<string>();
      if (data) {
        data.forEach((row: { tags: string[] | null }) => {
          row.tags?.forEach((t) => { if (isUserTag(t)) allTags.add(t); });
        });
      }
      const presets = getCustomTagPresets();
      presets.forEach((p) => allTags.add(p));
      setTagSuggestions(Array.from(allTags).sort());
    }
    fetchTags();
  }, [supabase]);

  function calculatePnl(
    position: string,
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    fees: number,
    tickSize?: number,
    tickValue?: number,
  ): number {
    // Futures PnL: (exit - entry) / tickSize * tickValue * contracts - fees
    if (tickSize && tickValue && tickSize > 0) {
      const priceDiff = position === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;
      return (priceDiff / tickSize) * tickValue * quantity - fees;
    }
    // Spot/fallback: simple difference
    if (position === "long") {
      return (exitPrice - entryPrice) * quantity - fees;
    }
    return (entryPrice - exitPrice) * quantity - fees;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const raw = {
        symbol: formData.get("symbol") as string,
        commodity_name: symbolInfo?.name || (formData.get("commodity_name") as string) || undefined,
        commodity_category: symbolInfo?.category || (formData.get("commodity_category") as string) || undefined,
        contract_type: contractType,
        position: formData.get("position") as string,
        entry_price: formData.get("entry_price") as string,
        exit_price: (formData.get("exit_price") as string) || undefined,
        quantity: formData.get("quantity") as string,
        contract_size: symbolInfo?.contractSize?.toString() || (formData.get("contract_size") as string) || undefined,
        tick_size: symbolInfo?.tickSize?.toString() || (formData.get("tick_size") as string) || undefined,
        tick_value: symbolInfo?.tickValue?.toString() || (formData.get("tick_value") as string) || undefined,
        fees: (formData.get("fees") as string) || "0",
        open_timestamp: formData.get("open_timestamp") as string,
        close_timestamp: (formData.get("close_timestamp") as string) || undefined,
        exchange: symbolInfo?.exchange || (formData.get("exchange") as string) || undefined,
        // Futures fields
        contract_month: contractType === "futures" || contractType === "options"
          ? (formData.get("contract_month") as string) || undefined : undefined,
        expiration_date: contractType === "futures" || contractType === "options"
          ? (formData.get("expiration_date") as string) || undefined : undefined,
        margin_required: contractType === "futures"
          ? (formData.get("margin_required") as string) || undefined : undefined,
        // Options fields
        option_type: contractType === "options" ? optionType : undefined,
        strike_price: contractType === "options" ? (formData.get("strike_price") as string) || undefined : undefined,
        premium_per_contract: contractType === "options" ? (formData.get("premium_per_contract") as string) || undefined : undefined,
        underlying_contract: contractType === "options" ? (formData.get("underlying_contract") as string) || undefined : undefined,
        // Psychology
        emotion: emotion || undefined,
        confidence: confidence || undefined,
        setup_type: setupType || undefined,
        process_score: processScore || undefined,
        checklist: Object.keys(checklist).length > 0 ? checklist : undefined,
        review: Object.values(review).some((v) => v.length > 0) ? review : undefined,
        notes: (formData.get("notes") as string) || undefined,
        tags,
        stop_loss: formData.get("stop_loss") as string || undefined,
        profit_target: formData.get("profit_target") as string || undefined,
        price_mae: formData.get("price_mae") as string || undefined,
        price_mfe: formData.get("price_mfe") as string || undefined,
        mfe_timestamp: formData.get("mfe_timestamp") as string || undefined,
        mae_timestamp: formData.get("mae_timestamp") as string || undefined,
      };

      const result = commodityTradeSchema.safeParse(raw);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      const data: CommodityTradeFormData = result.data;

      let pnl: number | null = null;
      if (data.exit_price && data.close_timestamp) {
        pnl = calculatePnl(
          data.position,
          data.entry_price,
          data.exit_price,
          data.quantity,
          data.fees,
          data.tick_size,
          data.tick_value,
        );
      }

      const payload = {
        symbol: data.symbol,
        commodity_name: data.commodity_name ?? null,
        commodity_category: data.commodity_category ?? null,
        contract_type: data.contract_type,
        position: data.position,
        entry_price: data.entry_price,
        exit_price: data.exit_price ?? null,
        quantity: data.quantity,
        contract_size: data.contract_size ?? null,
        tick_size: data.tick_size ?? null,
        tick_value: data.tick_value ?? null,
        fees: data.fees,
        open_timestamp: data.open_timestamp,
        close_timestamp: data.close_timestamp ?? null,
        exchange: data.exchange ?? null,
        contract_month: data.contract_month ?? null,
        expiration_date: data.expiration_date ?? null,
        margin_required: data.margin_required ?? null,
        option_type: data.option_type ?? null,
        strike_price: data.strike_price ?? null,
        premium_per_contract: data.premium_per_contract ?? null,
        underlying_contract: data.underlying_contract ?? null,
        emotion: data.emotion ?? null,
        confidence: data.confidence ?? null,
        setup_type: data.setup_type ?? null,
        process_score: data.process_score ?? null,
        checklist: data.checklist ?? null,
        review: data.review ?? null,
        notes: data.notes ?? null,
        tags: data.tags,
        pnl,
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
          .from("commodity_trades")
          .update(payload)
          .eq("id", editTrade.id));
      } else {
        ({ error: dbError } = await supabase.from("commodity_trades").insert(payload));
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
          <h2 className="text-lg font-semibold">
            {editTrade ? "Edit Commodity Trade" : "Log Commodity Trade"}
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
          {/* Contract Type Toggle: Spot / Futures / Options */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Contract Type</label>
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {(["spot", "futures", "options"] as const).map((ct, idx) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setContractType(ct)}
                  className={`px-4 py-1.5 text-xs font-medium transition-all ${
                    idx > 0 ? "border-l border-border" : ""
                  } ${
                    contractType === ct
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {ct.charAt(0).toUpperCase() + ct.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Symbol & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Symbol</label>
              <input
                name="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="GC"
                list="commodity-symbols"
                style={{ textTransform: "uppercase" }}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
              <datalist id="commodity-symbols">
                {symbolKeys.map((s) => (
                  <option key={s} value={s}>{COMMODITY_SYMBOLS[s].name}</option>
                ))}
              </datalist>
              {symbolInfo && (
                <p className="text-[10px] text-accent mt-0.5">
                  {symbolInfo.name} &middot; {symbolInfo.exchange} &middot; {symbolInfo.contractSize} {symbolInfo.unit}
                </p>
              )}
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

          {/* Category & Exchange (auto-filled if symbol recognized) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Category</label>
              <select
                name="commodity_category"
                value={symbolInfo?.category ?? ""}
                disabled={!!symbolInfo}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent disabled:opacity-60"
              >
                <option value="">Select category</option>
                {COMMODITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Exchange</label>
              <select
                name="exchange"
                value={symbolInfo?.exchange ?? ""}
                disabled={!!symbolInfo}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent disabled:opacity-60"
              >
                <option value="">Select exchange</option>
                {COMMODITY_EXCHANGES.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
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

          {/* Trade Planning */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Stop Loss <span className="text-muted/60">(optional)</span></label>
              <input name="stop_loss" type="number" step="any" defaultValue={editTrade?.stop_loss ?? ""} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Profit Target <span className="text-muted/60">(optional)</span></label>
              <input name="profit_target" type="number" step="any" defaultValue={editTrade?.profit_target ?? ""} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          {/* MAE / MFE */}
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

          {/* Contracts & Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">
                {contractType === "spot" ? "Quantity" : "Contracts"}
              </label>
              <input
                name="quantity"
                type="number"
                step="any"
                defaultValue={editTrade?.quantity ?? ""}
                placeholder="1"
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

          {/* Futures Fields (conditional) */}
          {(contractType === "futures" || contractType === "options") && (
            <div className="space-y-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <p className="text-[10px] uppercase tracking-wider text-accent/60 font-semibold">
                {contractType === "futures" ? "Futures Details" : "Contract Details"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Contract Month</label>
                  <input
                    name="contract_month"
                    type="month"
                    defaultValue={editTrade?.contract_month ?? ""}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Expiration Date</label>
                  <input
                    name="expiration_date"
                    type="date"
                    defaultValue={editTrade?.expiration_date ?? ""}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              {contractType === "futures" && (
                <div>
                  <label className="block text-xs text-muted mb-1">Margin Required (per contract)</label>
                  <input
                    name="margin_required"
                    type="number"
                    step="any"
                    defaultValue={editTrade?.margin_required ?? ""}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Options Fields (conditional) */}
          {contractType === "options" && (
            <div className="space-y-3 p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
              <p className="text-[10px] uppercase tracking-wider text-purple-400/60 font-semibold">
                Options Details
              </p>

              {/* Option Type Pills */}
              <div>
                <label className="block text-xs text-muted mb-1.5">Option Type</label>
                <div className="inline-flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOptionType("call")}
                    className={`px-4 py-1.5 text-xs font-medium transition-all ${
                      optionType === "call" ? "bg-win/15 text-win" : "text-muted hover:text-foreground"
                    }`}
                  >
                    Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptionType("put")}
                    className={`px-4 py-1.5 text-xs font-medium transition-all border-l border-border ${
                      optionType === "put" ? "bg-loss/15 text-loss" : "text-muted hover:text-foreground"
                    }`}
                  >
                    Put
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Strike Price</label>
                  <input
                    name="strike_price"
                    type="number"
                    step="any"
                    defaultValue={editTrade?.strike_price ?? ""}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Premium / Contract</label>
                  <input
                    name="premium_per_contract"
                    type="number"
                    step="any"
                    defaultValue={editTrade?.premium_per_contract ?? ""}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">Underlying Contract</label>
                <input
                  name="underlying_contract"
                  defaultValue={editTrade?.underlying_contract ?? ""}
                  placeholder="GCM26"
                  style={{ textTransform: "uppercase" }}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* Contract Specs (auto-filled, read-only display) */}
          {symbolInfo && contractType !== "spot" && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-surface/50 border border-border/30 text-[11px] text-muted">
              <span>Contract: {symbolInfo.contractSize} {symbolInfo.unit}</span>
              <span className="text-muted/30">|</span>
              <span>Tick: {symbolInfo.tickSize}</span>
              <span className="text-muted/30">|</span>
              <span>Tick Value: ${symbolInfo.tickValue.toFixed(2)}</span>
            </div>
          )}

          {/* Hidden fields for contract specs */}
          {symbolInfo && (
            <>
              <input type="hidden" name="contract_size" value={symbolInfo.contractSize} />
              <input type="hidden" name="tick_size" value={symbolInfo.tickSize} />
              <input type="hidden" name="tick_value" value={symbolInfo.tickValue} />
              <input type="hidden" name="commodity_name" value={symbolInfo.name} />
            </>
          )}

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

          {/* Notes */}
          <div>
            <label className="block text-xs text-muted mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={editTrade?.notes ?? ""}
              placeholder="Trade thesis, market conditions..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Psychology Section */}
          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
              Psychology
            </p>

            <EmotionPicker value={emotion} onChange={setEmotion} />
            <ConfidenceSlider value={confidence} onChange={setConfidence} />
            <SetupTypePicker
              value={setupType}
              onChange={setSetupType}
              savedPresets={setupPresets}
              onSavePreset={(name) => setSetupPresets(addCustomSetupPreset(name))}
              onRemovePreset={(name) => setSetupPresets(removeCustomSetupPreset(name))}
            />
            <PreTradeChecklist value={checklist} onChange={setChecklist} />

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
