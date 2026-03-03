"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import { TagInput } from "@/components/tag-input";
import { STOCK_SECTORS, CRYPTO_SECTORS } from "@/lib/types";
import type { FilterGroupConfig } from "./filter-group-types";
import { DEFAULT_COLORS } from "./filter-group-types";

interface FilterGroupFormProps {
  config: FilterGroupConfig;
  onChange: (config: FilterGroupConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
  allSymbols: string[];
  allTags: string[];
  index: number;
}

const ALL_SECTORS = [...STOCK_SECTORS, ...CRYPTO_SECTORS];

function ToggleRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
        {label}
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              value === opt.value
                ? "bg-accent/10 text-accent border border-accent/30"
                : "bg-surface border border-border/50 text-muted hover:text-foreground hover:border-accent/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterGroupForm({
  config,
  onChange,
  onRemove,
  canRemove,
  allSymbols,
  allTags,
  index,
}: FilterGroupFormProps) {
  const [expanded, setExpanded] = useState(index < 2);
  const [sectorsOpen, setSectorsOpen] = useState(false);

  function update(partial: Partial<FilterGroupConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div
      className="glass rounded-2xl border border-border/50 overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white/20"
          style={{ backgroundColor: config.color }}
        />
        <input
          type="text"
          value={config.name}
          onChange={(e) => update({ name: e.target.value })}
          className="flex-1 bg-transparent text-sm font-semibold text-foreground focus:outline-none"
          placeholder="Group name..."
        />
        <span className="text-[10px] text-muted/40 font-semibold uppercase tracking-wider">
          Group {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-muted/40 hover:text-loss transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-muted/60 hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
          {/* Color Picker */}
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Color
            </label>
            <div className="flex gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ color: c })}
                  className={`w-7 h-7 rounded-full transition-all ${
                    config.color === c ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Symbols */}
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Symbols
            </label>
            <TagInput
              value={config.symbols}
              onChange={(symbols) => update({ symbols })}
              suggestions={allSymbols}
              placeholder="Type symbol and press Enter..."
            />
            <p className="text-[9px] text-muted/30 mt-1">Leave empty to include all symbols</p>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Tags
            </label>
            <TagInput
              value={config.tags}
              onChange={(tags) => update({ tags })}
              suggestions={allTags}
              placeholder="Type tag and press Enter..."
            />
          </div>

          {/* Sectors */}
          <div className="relative">
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Sectors
            </label>
            <button
              type="button"
              onClick={() => setSectorsOpen(!sectorsOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent/50 transition-all"
            >
              <span className={config.sectors.length === 0 ? "text-muted/40" : "text-foreground"}>
                {config.sectors.length === 0
                  ? "All sectors"
                  : `${config.sectors.length} selected`}
              </span>
              <ChevronDown size={14} className="text-muted/40" />
            </button>
            {sectorsOpen && (
              <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {ALL_SECTORS.map((sector) => (
                  <label
                    key={sector}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={config.sectors.includes(sector)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          update({ sectors: [...config.sectors, sector] });
                        } else {
                          update({ sectors: config.sectors.filter((s) => s !== sector) });
                        }
                      }}
                      className="rounded border-border accent-accent"
                    />
                    <span className="text-xs text-foreground">{sector}</span>
                  </label>
                ))}
              </div>
            )}
            {config.sectors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {config.sectors.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-medium"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => update({ sectors: config.sectors.filter((x) => x !== s) })}
                      className="text-accent/60 hover:text-accent"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Asset Type */}
          <div>
            <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
              Asset Type
            </label>
            <div className="flex gap-1.5">
              {(
                [
                  { value: [] as ("cex" | "dex")[], label: "All" },
                  { value: ["cex"] as ("cex" | "dex")[], label: "CEX" },
                  { value: ["dex"] as ("cex" | "dex")[], label: "DEX" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => update({ assetTypes: [...opt.value] })}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    JSON.stringify(config.assetTypes) === JSON.stringify(opt.value)
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "bg-surface border border-border/50 text-muted hover:text-foreground hover:border-accent/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToggleRow
              label="PnL Type"
              options={[
                { value: "gross" as const, label: "Gross" },
                { value: "net" as const, label: "Net" },
              ]}
              value={config.pnlType}
              onChange={(v) => update({ pnlType: v })}
            />
            <ToggleRow
              label="Trade Position"
              options={[
                { value: "both" as const, label: "Both" },
                { value: "long" as const, label: "Long" },
                { value: "short" as const, label: "Short" },
              ]}
              value={config.position}
              onChange={(v) => update({ position: v })}
            />
            <ToggleRow
              label="Trade Duration"
              options={[
                { value: "both" as const, label: "Both" },
                { value: "intraday" as const, label: "Intraday" },
                { value: "multiday" as const, label: "Multiday" },
              ]}
              value={config.duration}
              onChange={(v) => update({ duration: v })}
            />
            <ToggleRow
              label="Trade Result"
              options={[
                { value: "both" as const, label: "Both" },
                { value: "win" as const, label: "Win" },
                { value: "loss" as const, label: "Loss" },
              ]}
              value={config.result}
              onChange={(v) => update({ result: v })}
            />
          </div>

          {/* Date Range */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">
                Date Range
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.dateRange === null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      update({ dateRange: null });
                    } else {
                      update({ dateRange: { start: "2024-01-01", end: new Date().toISOString().split("T")[0] } });
                    }
                  }}
                  className="rounded border-border accent-accent"
                />
                Use full date range
              </label>
            </div>
            {config.dateRange && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={config.dateRange.start}
                  onChange={(e) =>
                    update({ dateRange: { ...config.dateRange!, start: e.target.value } })
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all"
                />
                <span className="text-muted/40 self-center text-xs">to</span>
                <input
                  type="date"
                  value={config.dateRange.end}
                  onChange={(e) =>
                    update({ dateRange: { ...config.dateRange!, end: e.target.value } })
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
            )}
          </div>

          {/* PnL Range */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">
                PnL Range
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.pnlRange === null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      update({ pnlRange: null });
                    } else {
                      update({ pnlRange: { min: -5000, max: 5000 } });
                    }
                  }}
                  className="rounded border-border accent-accent"
                />
                No limit
              </label>
            </div>
            {config.pnlRange && (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={config.pnlRange.min ?? ""}
                  onChange={(e) =>
                    update({
                      pnlRange: {
                        ...config.pnlRange!,
                        min: e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                  placeholder="Min $"
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all"
                />
                <span className="text-muted/40 text-xs">to</span>
                <input
                  type="number"
                  value={config.pnlRange.max ?? ""}
                  onChange={(e) =>
                    update({
                      pnlRange: {
                        ...config.pnlRange!,
                        max: e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                  placeholder="Max $"
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
