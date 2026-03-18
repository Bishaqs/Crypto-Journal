"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { stockTradeSchema, type StockTradeFormData } from "@/lib/validators";
import { StockTrade, STOCK_SECTORS } from "@/lib/types";
import { X } from "lucide-react";
import { EmotionPicker, ConfidenceSlider, SetupTypePicker, ProcessScoreInput } from "./psychology-inputs";
import { PreTradeChecklist } from "./pre-trade-checklist";
import { PostTradeReview } from "./post-trade-review";
import { TagInput } from "./tag-input";
import { getCustomTagPresets, addCustomTagPreset, isUserTag } from "@/lib/tag-manager";
import { getCustomSetupPresets, addCustomSetupPreset, removeCustomSetupPreset } from "@/lib/setup-type-manager";
import { PlaybookSelector, playbookToChecklistItems } from "./playbook-selector";
import type { Playbook } from "@/lib/schemas/playbook";

const MARKET_SESSIONS = [
  { value: "pre_market", label: "Pre-Market" },
  { value: "regular", label: "Regular" },
  { value: "after_hours", label: "After-Hours" },
] as const;

export function StockTradeForm({
  onClose,
  onSaved,
  editTrade,
  variant = "modal",
}: {
  onClose: () => void;
  onSaved: () => void;
  editTrade?: StockTrade | null;
  variant?: "modal" | "inline";
}) {
  const supabase = createClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Asset type toggle
  const [assetType, setAssetType] = useState<"stock" | "option">(editTrade?.asset_type ?? "stock");

  // Market session
  const [marketSession, setMarketSession] = useState<string>(editTrade?.market_session ?? "regular");

  // Option type pills
  const [optionType, setOptionType] = useState<"call" | "put">(editTrade?.option_type ?? "call");

  // Psychology state
  const [emotion, setEmotion] = useState<string | null>(editTrade?.emotion ?? null);
  const [confidence, setConfidence] = useState<number | null>(editTrade?.confidence ?? null);
  const [setupType, setSetupType] = useState<string | null>(editTrade?.setup_type ?? null);
  const [setupPresets, setSetupPresets] = useState<string[]>([]);
  const [processScore, setProcessScore] = useState<number | null>(editTrade?.process_score ?? null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(editTrade?.checklist ?? {});
  const [review, setReview] = useState<Record<string, string>>(editTrade?.review ?? {});
  const [playbookId, setPlaybookId] = useState<string | null>((editTrade as Record<string, unknown>)?.playbook_id as string | null ?? null);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  useEffect(() => {
    setSetupPresets(getCustomSetupPresets());
  }, []);

  // Tags state
  const [tags, setTags] = useState<string[]>(editTrade?.tags ?? []);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // Track if we have an exit price to show post-trade fields
  const [hasExit, setHasExit] = useState(!!editTrade?.exit_price);

  // P&L state: auto-calculated or manual override
  const [manualPnl, setManualPnl] = useState<string>(editTrade?.pnl != null ? editTrade.pnl.toString() : "");
  const [pnlIsManual, setPnlIsManual] = useState(false);
  const [autoPnl, setAutoPnl] = useState<number | null>(null);

  function recalculatePnl() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const entry = parseFloat(fd.get("entry_price") as string);
    const exit = parseFloat(fd.get("exit_price") as string);
    const qty = parseFloat(fd.get("quantity") as string);
    const fees = parseFloat(fd.get("fees") as string) || 0;
    const pos = fd.get("position") as string;
    const contracts = parseFloat(fd.get("contracts") as string);
    if (!isNaN(entry) && !isNaN(exit) && !isNaN(qty) && entry > 0 && exit > 0 && qty > 0) {
      const calculated = calculatePnl(pos, entry, exit, qty, fees, assetType === "option", !isNaN(contracts) ? contracts : undefined);
      setAutoPnl(calculated);
      if (!pnlIsManual) setManualPnl(calculated.toFixed(2));
    } else {
      setAutoPnl(null);
      if (!pnlIsManual) setManualPnl("");
    }
  }

  // Fetch tag suggestions from existing stock trades + custom presets (paginated to avoid 1000-row cap)
  useEffect(() => {
    async function fetchTags() {
      const allTags = new Set<string>();
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data } = await supabase.from("stock_trades").select("tags").range(from, from + pageSize - 1);
        if (!data || data.length === 0) break;
        data.forEach((row: { tags: string[] | null }) => {
          row.tags?.forEach((t) => { if (isUserTag(t)) allTags.add(t); });
        });
        if (data.length < pageSize) break;
        from += pageSize;
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
    isOption: boolean,
    contracts?: number,
  ): number {
    if (isOption && contracts) {
      return (exitPrice - entryPrice) * contracts * 100 - fees;
    }
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
        asset_type: assetType,
        position: formData.get("position") as string,
        entry_price: formData.get("entry_price") as string,
        exit_price: (formData.get("exit_price") as string) || undefined,
        quantity: formData.get("quantity") as string,
        fees: (formData.get("fees") as string) || "0",
        open_timestamp: formData.get("open_timestamp") as string,
        close_timestamp: (formData.get("close_timestamp") as string) || undefined,
        sector: (formData.get("sector") as string) || undefined,
        market_session: marketSession || undefined,
        // Options fields
        option_type: assetType === "option" ? optionType : undefined,
        strike_price: assetType === "option" ? (formData.get("strike_price") as string) || undefined : undefined,
        expiration_date: assetType === "option" ? (formData.get("expiration_date") as string) || undefined : undefined,
        premium_per_contract: assetType === "option" ? (formData.get("premium_per_contract") as string) || undefined : undefined,
        contracts: assetType === "option" ? (formData.get("contracts") as string) || undefined : undefined,
        underlying_symbol: assetType === "option" ? (formData.get("underlying_symbol") as string) || undefined : undefined,
        // Psychology
        emotion: emotion || undefined,
        confidence: confidence || undefined,
        setup_type: setupType || undefined,
        process_score: processScore || undefined,
        checklist: Object.keys(checklist).length > 0 ? checklist : undefined,
        review: Object.values(review).some((v) => v.length > 0) ? review : undefined,
        playbook_id: playbookId || undefined,
        notes: (formData.get("notes") as string) || undefined,
        tags,
        stop_loss: formData.get("stop_loss") as string || undefined,
        profit_target: formData.get("profit_target") as string || undefined,
        price_mae: formData.get("price_mae") as string || undefined,
        price_mfe: formData.get("price_mfe") as string || undefined,
        mfe_timestamp: formData.get("mfe_timestamp") as string || undefined,
        mae_timestamp: formData.get("mae_timestamp") as string || undefined,
      };

      const result = stockTradeSchema.safeParse(raw);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      const data: StockTradeFormData = result.data;

      let pnl: number | null = null;
      if (manualPnl.trim() !== "") {
        const parsed = parseFloat(manualPnl);
        if (!isNaN(parsed)) pnl = parsed;
      } else if (data.exit_price) {
        pnl = calculatePnl(
          data.position,
          data.entry_price,
          data.exit_price,
          data.quantity,
          data.fees,
          data.asset_type === "option",
          data.contracts,
        );
      }

      const payload = {
        symbol: data.symbol,
        company_name: null,
        asset_type: data.asset_type,
        position: data.position,
        entry_price: data.entry_price,
        exit_price: data.exit_price ?? null,
        quantity: data.quantity,
        fees: data.fees,
        open_timestamp: data.open_timestamp,
        close_timestamp: data.close_timestamp ?? null,
        sector: data.sector ?? null,
        industry: null,
        market_session: data.market_session ?? null,
        option_type: data.option_type ?? null,
        strike_price: data.strike_price ?? null,
        expiration_date: data.expiration_date ?? null,
        premium_per_contract: data.premium_per_contract ?? null,
        contracts: data.contracts ?? null,
        underlying_symbol: data.underlying_symbol ?? null,
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
        playbook_id: data.playbook_id ?? null,
      };

      let dbError;
      if (editTrade) {
        ({ error: dbError } = await supabase
          .from("stock_trades")
          .update(payload)
          .eq("id", editTrade.id));
      } else {
        ({ error: dbError } = await supabase.from("stock_trades").insert(payload));
      }

      if (dbError) {
        setErrors({ _form: dbError.message });
        return;
      }

      // Award XP for new stock trades
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
            {editTrade ? "Edit Stock Trade" : "Log Stock Trade"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

        <form ref={formRef} onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Asset Type Toggle: Stock / Option */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Asset Type</label>
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setAssetType("stock")}
                className={`px-4 py-1.5 text-xs font-medium transition-all ${
                  assetType === "stock"
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Stock
              </button>
              <button
                type="button"
                onClick={() => setAssetType("option")}
                className={`px-4 py-1.5 text-xs font-medium transition-all border-l border-border ${
                  assetType === "option"
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Option
              </button>
            </div>
          </div>

          {/* Symbol & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Symbol</label>
              <input
                name="symbol"
                defaultValue={editTrade?.symbol ?? ""}
                placeholder="AAPL"
                style={{ textTransform: "uppercase" }}
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
                onChange={() => recalculatePnl()}
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
                onChange={() => recalculatePnl()}
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
                onChange={(e) => { setHasExit(!!e.target.value); recalculatePnl(); }}
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

          {/* Quantity & Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Quantity</label>
              <input
                name="quantity"
                type="number"
                step="any"
                defaultValue={editTrade?.quantity ?? ""}
                placeholder="0"
                onChange={() => recalculatePnl()}
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
                onChange={() => recalculatePnl()}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* P&L */}
          <div>
            <label className="block text-xs text-muted mb-1">
              P&L
              {autoPnl !== null && !pnlIsManual && (
                <span className="text-muted/60 ml-1">(auto)</span>
              )}
              {pnlIsManual && (
                <span className="text-accent/60 ml-1">(manual)</span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={manualPnl}
                onChange={(e) => { setManualPnl(e.target.value); setPnlIsManual(true); }}
                placeholder={autoPnl != null ? autoPnl.toFixed(2) : "Auto-calculated from prices"}
                className={`w-full px-3 py-2 rounded-lg bg-background border text-sm focus:outline-none focus:border-accent ${
                  manualPnl && parseFloat(manualPnl) > 0
                    ? "border-win/30 text-win"
                    : manualPnl && parseFloat(manualPnl) < 0
                      ? "border-loss/30 text-loss"
                      : "border-border text-foreground"
                }`}
              />
              {pnlIsManual && (
                <button
                  type="button"
                  onClick={() => { setPnlIsManual(false); setManualPnl(autoPnl != null ? autoPnl.toFixed(2) : ""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-accent hover:text-accent-hover"
                >
                  Reset
                </button>
              )}
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

          {/* Sector */}
          <div>
            <label className="block text-xs text-muted mb-1">Sector</label>
            <select
              name="sector"
              defaultValue={editTrade?.sector ?? ""}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
            >
              <option value="">Select sector</option>
              {STOCK_SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Market Session Pills */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Market Session</label>
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {MARKET_SESSIONS.map((session, idx) => (
                <button
                  key={session.value}
                  type="button"
                  onClick={() => setMarketSession(session.value)}
                  className={`px-4 py-1.5 text-xs font-medium transition-all ${
                    idx > 0 ? "border-l border-border" : ""
                  } ${
                    marketSession === session.value
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {session.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options Fields (conditional) */}
          {assetType === "option" && (
            <div className="space-y-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
              <p className="text-[10px] uppercase tracking-wider text-accent/60 font-semibold">
                Options Details
              </p>

              {/* Option Type Pills: Call / Put */}
              <div>
                <label className="block text-xs text-muted mb-1.5">Option Type</label>
                <div className="inline-flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOptionType("call")}
                    className={`px-4 py-1.5 text-xs font-medium transition-all ${
                      optionType === "call"
                        ? "bg-win/15 text-win"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptionType("put")}
                    className={`px-4 py-1.5 text-xs font-medium transition-all border-l border-border ${
                      optionType === "put"
                        ? "bg-loss/15 text-loss"
                        : "text-muted hover:text-foreground"
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
                  {errors.strike_price && (
                    <p className="text-xs text-loss mt-1">{errors.strike_price}</p>
                  )}
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

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-xs text-muted mb-1">Contracts</label>
                  <input
                    name="contracts"
                    type="number"
                    step="1"
                    defaultValue={editTrade?.contracts ?? ""}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                  />
                  {errors.contracts && (
                    <p className="text-xs text-loss mt-1">{errors.contracts}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">Underlying Symbol</label>
                <input
                  name="underlying_symbol"
                  defaultValue={editTrade?.underlying_symbol ?? ""}
                  placeholder="AAPL"
                  style={{ textTransform: "uppercase" }}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
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
              placeholder="Why did you take this trade?"
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
            <PlaybookSelector
              value={playbookId}
              onChange={(id, pb) => {
                setPlaybookId(id);
                setSelectedPlaybook(pb);
                if (pb) {
                  setSetupType(pb.name);
                  const pbItems = playbookToChecklistItems(pb);
                  if (pbItems) setChecklist(Object.fromEntries(pbItems.map((item) => [item.key, false])));
                } else {
                  setChecklist({});
                }
              }}
              assetClass="stocks"
            />
            <SetupTypePicker
              value={setupType}
              onChange={setSetupType}
              savedPresets={setupPresets}
              onSavePreset={(name) => setSetupPresets(addCustomSetupPreset(name))}
              onRemovePreset={(name) => setSetupPresets(removeCustomSetupPreset(name))}
            />
            <PreTradeChecklist value={checklist} onChange={setChecklist} items={playbookToChecklistItems(selectedPlaybook)} />

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
