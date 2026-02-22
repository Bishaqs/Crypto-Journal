"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { stockTradeSchema, type StockTradeFormData } from "@/lib/validators";
import { StockTrade, STOCK_SECTORS } from "@/lib/types";
import { X } from "lucide-react";
import { EmotionPicker, ConfidenceSlider, SetupTypePicker, ProcessScoreInput } from "./psychology-inputs";
import { PreTradeChecklist } from "./pre-trade-checklist";
import { PostTradeReview } from "./post-trade-review";
import { TagInput } from "./tag-input";
import { getCustomTagPresets } from "@/lib/tag-manager";

const MARKET_SESSIONS = [
  { value: "pre_market", label: "Pre-Market" },
  { value: "regular", label: "Regular" },
  { value: "after_hours", label: "After-Hours" },
] as const;

export function StockTradeForm({
  onClose,
  onSaved,
  editTrade,
}: {
  onClose: () => void;
  onSaved: () => void;
  editTrade?: StockTrade | null;
}) {
  const supabase = createClient();
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
  const [processScore, setProcessScore] = useState<number | null>(editTrade?.process_score ?? null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(editTrade?.checklist ?? {});
  const [review, setReview] = useState<Record<string, string>>(editTrade?.review ?? {});

  // Tags state
  const [tags, setTags] = useState<string[]>(editTrade?.tags ?? []);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // Track if we have an exit price to show post-trade fields
  const [hasExit, setHasExit] = useState(!!editTrade?.exit_price);

  // Fetch tag suggestions from existing stock trades + custom presets
  useEffect(() => {
    async function fetchTags() {
      const { data } = await supabase.from("stock_trades").select("tags");
      const allTags = new Set<string>();
      if (data) {
        data.forEach((row: { tags: string[] | null }) => {
          row.tags?.forEach((t) => allTags.add(t));
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
      notes: (formData.get("notes") as string) || undefined,
      tags,
    };

    const result = stockTradeSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      setSaving(false);
      return;
    }

    const data: StockTradeFormData = result.data;

    let pnl: number | null = null;
    if (data.exit_price && data.close_timestamp) {
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
    };

    let error;
    if (editTrade) {
      ({ error } = await supabase
        .from("stock_trades")
        .update(payload)
        .eq("id", editTrade.id));
    } else {
      ({ error } = await supabase.from("stock_trades").insert(payload));
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
            {editTrade ? "Edit Stock Trade" : "Log Stock Trade"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                placeholder="0"
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
