"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { forexTradeSchema, type ForexTradeFormData } from "@/lib/validators";
import { ForexTrade, FOREX_PAIRS, FOREX_SESSIONS, LOT_SIZES } from "@/lib/types";
import type { ForexLotType, ForexPairCategory, ForexSession } from "@/lib/types";
import { X } from "lucide-react";
import { EmotionPicker, ConfidenceSlider, SetupTypePicker, ProcessScoreInput } from "./psychology-inputs";
import { PreTradeChecklist } from "./pre-trade-checklist";
import { PostTradeReview } from "./post-trade-review";
import { TagInput } from "./tag-input";
import { getCustomTagPresets, addCustomTagPreset } from "@/lib/tag-manager";
import { getCustomSetupPresets, addCustomSetupPreset, removeCustomSetupPreset } from "@/lib/setup-type-manager";
import { PlaybookSelector, playbookToChecklistItems } from "./playbook-selector";
import type { Playbook } from "@/lib/schemas/playbook";

const SESSION_LABELS: Record<string, string> = {
  london: "London",
  new_york: "New York",
  tokyo: "Tokyo",
  sydney: "Sydney",
  overlap: "Overlap",
};

const LOT_TYPE_LABELS: Record<string, string> = {
  standard: "Standard (100K)",
  mini: "Mini (10K)",
  micro: "Micro (1K)",
};

// Build a flat list of all pairs with their category
const ALL_PAIRS: { pair: string; category: ForexPairCategory }[] = [];
for (const [cat, pairs] of Object.entries(FOREX_PAIRS)) {
  for (const pair of pairs) {
    ALL_PAIRS.push({ pair, category: cat as ForexPairCategory });
  }
}

export function ForexTradeForm({
  onClose,
  onSaved,
  editTrade,
  variant = "modal",
}: {
  onClose: () => void;
  onSaved: () => void;
  editTrade?: ForexTrade | null;
  variant?: "modal" | "inline";
}) {
  const supabase = createClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Pair
  const [pair, setPair] = useState(editTrade?.pair ?? "");
  const pairInfo = useMemo(() => ALL_PAIRS.find((p) => p.pair === pair) ?? null, [pair]);

  // Lot type toggle
  const [lotType, setLotType] = useState<ForexLotType>(editTrade?.lot_type ?? "standard");

  // Session
  const [session, setSession] = useState<ForexSession | "">(editTrade?.session ?? "");

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
  const [tags, setTags] = useState<string[]>(editTrade?.tags ?? []);

  useEffect(() => {
    setSetupPresets(getCustomSetupPresets());
  }, []);

  // Custom tag presets
  const customPresets = useMemo(() => getCustomTagPresets(), []);

  // P&L state: auto-calculated or manual override
  const [manualPnl, setManualPnl] = useState<string>(editTrade?.pnl != null ? editTrade.pnl.toString() : "");
  const [pnlIsManual, setPnlIsManual] = useState(false);
  const [autoPnl, setAutoPnl] = useState<number | null>(null);

  function recalculatePnl() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const entry = parseFloat(fd.get("entry_price") as string);
    const exit = parseFloat(fd.get("exit_price") as string);
    const lots = parseFloat(fd.get("lot_size") as string);
    const fees = parseFloat(fd.get("fees") as string) || 0;
    const swap = parseFloat(fd.get("swap_fee") as string) || 0;
    const pos = fd.get("position") as string;
    const lotMultiplier = LOT_SIZES[lotType];
    if (!isNaN(entry) && !isNaN(exit) && !isNaN(lots) && entry > 0 && exit > 0 && lots > 0) {
      const direction = pos === "long" ? 1 : -1;
      const calculated = (exit - entry) * direction * lots * lotMultiplier - fees - swap;
      setAutoPnl(calculated);
      if (!pnlIsManual) setManualPnl(calculated.toFixed(2));
    } else {
      setAutoPnl(null);
      if (!pnlIsManual) setManualPnl("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const formData = new FormData(e.currentTarget);

      // Split pair into currencies
      const pairValue = pair || (formData.get("pair") as string) || "";
      const [base, quote] = pairValue.split("/");

      const rawData: Record<string, unknown> = {
        pair: pairValue,
        base_currency: base ?? "",
        quote_currency: quote ?? "",
        pair_category: pairInfo?.category ?? undefined,
        lot_type: lotType,
        lot_size: formData.get("lot_size"),
        position: formData.get("position"),
        entry_price: formData.get("entry_price"),
        exit_price: formData.get("exit_price") || undefined,
        fees: formData.get("fees") || 0,
        open_timestamp: formData.get("open_timestamp"),
        close_timestamp: formData.get("close_timestamp") || undefined,
        pip_value: formData.get("pip_value") || undefined,
        leverage: formData.get("leverage") || undefined,
        spread: formData.get("spread") || undefined,
        swap_fee: formData.get("swap_fee") || 0,
        session: session || undefined,
        broker: formData.get("broker") || undefined,
        emotion: emotion ?? undefined,
        confidence: confidence ?? undefined,
        setup_type: setupType ?? undefined,
        process_score: processScore ?? undefined,
        checklist: Object.keys(checklist).length > 0 ? checklist : undefined,
        review: Object.keys(review).length > 0 ? review : undefined,
        playbook_id: playbookId || undefined,
        notes: formData.get("notes") || undefined,
        tags,
        stop_loss: formData.get("stop_loss") || undefined,
        profit_target: formData.get("profit_target") || undefined,
        price_mae: formData.get("price_mae") as string || undefined,
        price_mfe: formData.get("price_mfe") as string || undefined,
        mfe_timestamp: formData.get("mfe_timestamp") as string || undefined,
        mae_timestamp: formData.get("mae_timestamp") as string || undefined,
      };

      const parsed = forexTradeSchema.safeParse(rawData);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          const key = issue.path[0]?.toString();
          if (key) fieldErrors[key] = issue.message;
        });
        setErrors(fieldErrors);
        return;
      }

      const data = parsed.data;

      // Calculate P&L
      let pnl: number | null = null;
      if (manualPnl.trim() !== "") {
        const parsed = parseFloat(manualPnl);
        if (!isNaN(parsed)) pnl = parsed;
      } else if (data.exit_price) {
        const lotMultiplier = LOT_SIZES[data.lot_type];
        if (data.position === "long") {
          pnl = (data.exit_price - data.entry_price) * data.lot_size * lotMultiplier - data.fees - data.swap_fee;
        } else {
          pnl = (data.entry_price - data.exit_price) * data.lot_size * lotMultiplier - data.fees - data.swap_fee;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErrors({ form: "Not authenticated" }); return; }

      const insertData = {
        user_id: user.id,
        ...data,
        pnl,
        stop_loss: data.stop_loss ?? null,
        profit_target: data.profit_target ?? null,
        price_mae: data.price_mae ?? null,
        price_mfe: data.price_mfe ?? null,
        mfe_timestamp: data.mfe_timestamp ?? null,
        mae_timestamp: data.mae_timestamp ?? null,
      };

      if (editTrade) {
        const { error } = await supabase.from("forex_trades").update(insertData).eq("id", editTrade.id);
        if (error) { setErrors({ form: error.message }); return; }
      } else {
        const { error } = await supabase.from("forex_trades").insert(insertData);
        if (error) { setErrors({ form: error.message }); return; }
      }

      onSaved();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSaving(false);
    }
  }

  const formContent = (
    <>
      {variant === "modal" && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">
            {editTrade ? "Edit Forex Trade" : "Log Forex Trade"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <X size={20} />
          </button>
        </div>
      )}

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {errors.form && (
            <div className="p-3 rounded-xl bg-loss/10 border border-loss/30 text-sm text-loss">{errors.form}</div>
          )}

          {/* Pair selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Currency Pair *</label>
            <select
              name="pair"
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50"
            >
              <option value="">Select a pair...</option>
              <optgroup label="Major">
                {FOREX_PAIRS.major.map((p) => <option key={p} value={p}>{p}</option>)}
              </optgroup>
              <optgroup label="Minor">
                {FOREX_PAIRS.minor.map((p) => <option key={p} value={p}>{p}</option>)}
              </optgroup>
              <optgroup label="Exotic">
                {FOREX_PAIRS.exotic.map((p) => <option key={p} value={p}>{p}</option>)}
              </optgroup>
            </select>
            {pairInfo && (
              <p className="text-[10px] text-accent mt-1">
                {pairInfo.category.charAt(0).toUpperCase() + pairInfo.category.slice(1)} pair
              </p>
            )}
            {errors.pair && <p className="text-[10px] text-loss mt-1">{errors.pair}</p>}
          </div>

          {/* Position */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Position *</label>
            <div className="flex gap-2">
              {(["long", "short"] as const).map((pos) => (
                <label key={pos} className="flex-1">
                  <input type="radio" name="position" value={pos} defaultChecked={pos === (editTrade?.position ?? "long")} onChange={() => recalculatePnl()} className="sr-only peer" />
                  <div className={`text-center py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-all peer-checked:border-accent/50 peer-checked:bg-accent/10 peer-checked:text-accent border-border text-muted hover:text-foreground`}>
                    {pos.toUpperCase()}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Lot Type Toggle */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Lot Type</label>
            <div className="flex gap-1 rounded-xl bg-background border border-border/50 p-1">
              {(["standard", "mini", "micro"] as ForexLotType[]).map((lt) => (
                <button
                  key={lt}
                  type="button"
                  onClick={() => setLotType(lt)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    lotType === lt
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-muted hover:text-foreground border border-transparent"
                  }`}
                >
                  {LOT_TYPE_LABELS[lt]}
                </button>
              ))}
            </div>
          </div>

          {/* Entry/Exit + Lot Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Entry Price *</label>
              <input name="entry_price" type="number" step="any" defaultValue={editTrade?.entry_price ?? ""}
                placeholder="1.0850"
                onChange={() => recalculatePnl()}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
              {errors.entry_price && <p className="text-[10px] text-loss mt-1">{errors.entry_price}</p>}
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Exit Price</label>
              <input name="exit_price" type="number" step="any" defaultValue={editTrade?.exit_price ?? ""}
                placeholder="1.0920"
                onChange={() => recalculatePnl()}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Lot Size *</label>
              <input name="lot_size" type="number" step="any" defaultValue={editTrade?.lot_size ?? "1"}
                placeholder="1"
                onChange={() => recalculatePnl()}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
              {errors.lot_size && <p className="text-[10px] text-loss mt-1">{errors.lot_size}</p>}
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Fees</label>
              <input name="fees" type="number" step="any" defaultValue={editTrade?.fees ?? "0"}
                onChange={() => recalculatePnl()}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          {/* P&L */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">
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
                className={`w-full px-3 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:border-accent/50 ${
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

          {/* Trade Planning */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Stop Loss <span className="text-muted/60">(optional)</span></label>
              <input name="stop_loss" type="number" step="any" defaultValue={editTrade?.stop_loss ?? ""} placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Profit Target <span className="text-muted/60">(optional)</span></label>
              <input name="profit_target" type="number" step="any" defaultValue={editTrade?.profit_target ?? ""} placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          {/* MAE / MFE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Price MAE <span className="text-muted/60">(optional)</span></label>
              <input name="price_mae" type="number" step="any" defaultValue={editTrade?.price_mae ?? ""} placeholder="Worst price" className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Price MFE <span className="text-muted/60">(optional)</span></label>
              <input name="price_mfe" type="number" step="any" defaultValue={editTrade?.price_mfe ?? ""} placeholder="Best price" className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">MFE Timestamp <span className="text-muted/60">(optional)</span></label>
              <input name="mfe_timestamp" type="datetime-local" defaultValue={editTrade?.mfe_timestamp ? editTrade.mfe_timestamp.slice(0, 16) : ""} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">MAE Timestamp <span className="text-muted/60">(optional)</span></label>
              <input name="mae_timestamp" type="datetime-local" defaultValue={editTrade?.mae_timestamp ? editTrade.mae_timestamp.slice(0, 16) : ""} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Open Time *</label>
              <input name="open_timestamp" type="datetime-local"
                defaultValue={editTrade?.open_timestamp ? editTrade.open_timestamp.slice(0, 16) : new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
              {errors.open_timestamp && <p className="text-[10px] text-loss mt-1">{errors.open_timestamp}</p>}
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Close Time</label>
              <input name="close_timestamp" type="datetime-local"
                defaultValue={editTrade?.close_timestamp ? editTrade.close_timestamp.slice(0, 16) : ""}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          {/* Forex-specific fields */}
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-4">
            <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Forex Details</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Pip Value</label>
                <input name="pip_value" type="number" step="any" defaultValue={editTrade?.pip_value ?? ""}
                  placeholder="10"
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Leverage</label>
                <input name="leverage" type="number" step="any" defaultValue={editTrade?.leverage ?? ""}
                  placeholder="50"
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Spread (pips)</label>
                <input name="spread" type="number" step="any" defaultValue={editTrade?.spread ?? ""}
                  placeholder="1.2"
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Swap Fee</label>
                <input name="swap_fee" type="number" step="any" defaultValue={editTrade?.swap_fee ?? "0"}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Broker</label>
                <input name="broker" type="text" defaultValue={editTrade?.broker ?? ""}
                  placeholder="OANDA"
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50" />
              </div>
            </div>

            {/* Session selector */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Trading Session</label>
              <div className="flex flex-wrap gap-1">
                {FOREX_SESSIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSession(session === s ? "" : s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      session === s
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "text-muted hover:text-foreground border border-border/50"
                    }`}
                  >
                    {SESSION_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Notes</label>
            <textarea name="notes" rows={3} defaultValue={editTrade?.notes ?? ""}
              placeholder="Trade thesis, observations..."
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 resize-none" />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Tags</label>
            <TagInput value={tags} onChange={setTags} suggestions={["scalp", "swing", "news", "technical", "fundamental", ...customPresets]} onTagAdded={(tag) => addCustomTagPreset(tag)} />
          </div>

          {/* Psychology */}
          <div className="space-y-4 rounded-xl border border-border/30 bg-surface/50 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Psychology</p>
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
              assetClass="forex"
            />
            <SetupTypePicker
              value={setupType}
              onChange={setSetupType}
              savedPresets={setupPresets}
              onSavePreset={(name) => setSetupPresets(addCustomSetupPreset(name))}
              onRemovePreset={(name) => setSetupPresets(removeCustomSetupPreset(name))}
            />

            {/* Pre-Trade Checklist */}
            <PreTradeChecklist value={checklist} onChange={setChecklist} items={playbookToChecklistItems(selectedPlaybook)} />

            {/* Post-Trade Review (only if exit price is present) */}
            <PostTradeReview value={review} onChange={setReview} />

            <ProcessScoreInput value={processScore} onChange={setProcessScore} />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted bg-surface border border-border hover:text-foreground hover:bg-surface-hover transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-background bg-accent hover:bg-accent-hover transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : editTrade ? "Update Trade" : "Log Trade"}
            </button>
          </div>
        </form>
    </>
  );

  if (variant === "inline") {
    return (
      <div className="glass border border-border/50 rounded-2xl w-full" style={{ boxShadow: "var(--shadow-card)" }}>
        {formContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
      <div className="glass border border-border/50 rounded-2xl w-full max-w-2xl my-8" style={{ boxShadow: "var(--shadow-card)" }}>
        {formContent}
      </div>
    </div>
  );
}
