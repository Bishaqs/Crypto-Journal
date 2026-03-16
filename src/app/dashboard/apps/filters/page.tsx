"use client";

import { useState, useMemo } from "react";
import { useTrades } from "@/hooks/use-trades";
import { DemoBanner } from "@/components/demo-banner";
import { calculateStats, calculateTradePnl } from "@/lib/calculations";
import {
  TradeFilterConfig,
  createDefaultFilter,
  MONTH_NAMES,
  DAY_NAMES,
} from "@/components/filters/filters-types";
import {
  applyTradeFilters,
  formatDuration,
  parseDuration,
} from "@/components/filters/filters-engine";
import {
  Filter,
  RotateCcw,
  TrendingUp,
  Target,
  BarChart3,
  Hash,
  ArrowUpDown,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

/* ── ToggleRow (inline, same pattern as filter-group-form) ── */
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

/* ── Range Input Pair ── */
function RangeInputs({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  enabled,
  onToggle,
  disabledLabel,
  placeholder,
  type = "number",
}: {
  label: string;
  min: string;
  max: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabledLabel: string;
  placeholder?: [string, string];
  type?: "number" | "text" | "time";
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">
          {label}
        </label>
        <label className="flex items-center gap-1.5 text-[10px] text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={!enabled}
            onChange={(e) => onToggle(!e.target.checked)}
            className="rounded border-border accent-accent"
          />
          {disabledLabel}
        </label>
      </div>
      {enabled && (
        <div className="flex gap-2 items-center">
          <input
            type={type}
            value={min}
            onChange={(e) => onMinChange(e.target.value)}
            placeholder={placeholder?.[0] ?? "Min"}
            className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all"
          />
          <span className="text-muted/40 text-xs">to</span>
          <input
            type={type}
            value={max}
            onChange={(e) => onMaxChange(e.target.value)}
            placeholder={placeholder?.[1] ?? "Max"}
            className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
      )}
    </div>
  );
}

/* ── Multi-Select List (checkboxes in scrollable container) ── */
function MultiSelectList<T extends string | number>({
  label,
  options,
  selected,
  onChange,
  renderLabel,
}: {
  label: string;
  options: T[];
  selected: T[];
  onChange: (v: T[]) => void;
  renderLabel: (v: T) => string;
}) {
  return (
    <div>
      <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">
        {label}
      </label>
      <div className="max-h-32 overflow-y-auto rounded-xl bg-background border border-border p-1.5">
        {options.map((opt) => (
          <label
            key={String(opt)}
            className="flex items-center gap-2 px-2 py-1 hover:bg-accent/5 cursor-pointer rounded-lg transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt]);
                else onChange(selected.filter((s) => s !== opt));
              }}
              className="rounded border-border accent-accent"
            />
            <span className="text-xs text-foreground">{renderLabel(opt)}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-[9px] text-muted/40 mt-1">
          {selected.length} selected
          <button
            type="button"
            onClick={() => onChange([])}
            className="ml-2 text-accent hover:text-accent/80"
          >
            Clear
          </button>
        </p>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function TradeFiltersPage() {
  const { trades, loading, usingDemo } = useTrades();
  const [config, setConfig] = useState<TradeFilterConfig>(createDefaultFilter());
  const [applied, setApplied] = useState(false);

  // Local string state for duration inputs
  const [durationMinStr, setDurationMinStr] = useState("");
  const [durationMaxStr, setDurationMaxStr] = useState("");

  // Derive available years from trade data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const t of trades) {
      if (t.close_timestamp) years.add(new Date(t.close_timestamp).getFullYear());
    }
    return Array.from(years).sort();
  }, [trades]);

  // Filtered results
  const filteredTrades = useMemo(() => {
    if (!applied) return null;
    return applyTradeFilters(trades, config);
  }, [trades, config, applied]);

  const stats = useMemo(() => {
    if (!filteredTrades) return null;
    return calculateStats(filteredTrades);
  }, [filteredTrades]);

  function update(partial: Partial<TradeFilterConfig>) {
    setConfig((prev) => ({ ...prev, ...partial }));
    setApplied(false);
  }

  function handleApply() {
    // Sync duration strings into config before applying
    const durationRange =
      durationMinStr || durationMaxStr
        ? {
            minSeconds: durationMinStr ? parseDuration(durationMinStr) : null,
            maxSeconds: durationMaxStr ? parseDuration(durationMaxStr) : null,
          }
        : null;
    setConfig((prev) => ({ ...prev, durationRange }));
    setApplied(true);
  }

  function handleReset() {
    setConfig(createDefaultFilter());
    setDurationMinStr("");
    setDurationMaxStr("");
    setApplied(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {usingDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Filter size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Trade Filters <InfoTooltip text="Apply advanced filters across all your closed trades — filter by date, P&L range, time of day, day of week, duration, and more." size={14} articleId="tj-edit-trade" /></h1>
          <p className="text-sm text-muted">
            Advanced filtering across {trades.filter((t) => t.close_timestamp).length} closed trades
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div
        className="glass rounded-2xl border border-border/50 p-5 space-y-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Row 1: Day Result + Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ToggleRow
            label="Day Result"
            options={[
              { value: "both" as const, label: "Both" },
              { value: "win" as const, label: "Win" },
              { value: "loss" as const, label: "Loss" },
            ]}
            value={config.dayResult}
            onChange={(v) => update({ dayResult: v })}
          />
          <RangeInputs
            label="Date Range"
            type="text"
            min={config.dateRange?.start ?? ""}
            max={config.dateRange?.end ?? ""}
            onMinChange={(v) =>
              update({ dateRange: { start: v, end: config.dateRange?.end ?? "" } })
            }
            onMaxChange={(v) =>
              update({ dateRange: { start: config.dateRange?.start ?? "", end: v } })
            }
            enabled={config.dateRange !== null}
            onToggle={(on) =>
              update({
                dateRange: on
                  ? {
                      start: "2024-01-01",
                      end: new Date().toISOString().split("T")[0],
                    }
                  : null,
              })
            }
            disabledLabel="Use full date range"
            placeholder={["YYYY-MM-DD", "YYYY-MM-DD"]}
          />
        </div>

        {/* Row 2: PnL + Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RangeInputs
            label="PnL Range"
            min={config.pnlRange?.min?.toString() ?? ""}
            max={config.pnlRange?.max?.toString() ?? ""}
            onMinChange={(v) =>
              update({
                pnlRange: {
                  min: v === "" ? null : Number(v),
                  max: config.pnlRange?.max ?? null,
                },
              })
            }
            onMaxChange={(v) =>
              update({
                pnlRange: {
                  min: config.pnlRange?.min ?? null,
                  max: v === "" ? null : Number(v),
                },
              })
            }
            enabled={config.pnlRange !== null}
            onToggle={(on) =>
              update({ pnlRange: on ? { min: null, max: null } : null })
            }
            disabledLabel="No limit"
            placeholder={["Min $", "Max $"]}
          />
          <RangeInputs
            label="Price Range"
            min={config.priceRange?.min?.toString() ?? ""}
            max={config.priceRange?.max?.toString() ?? ""}
            onMinChange={(v) =>
              update({
                priceRange: {
                  min: v === "" ? null : Number(v),
                  max: config.priceRange?.max ?? null,
                },
              })
            }
            onMaxChange={(v) =>
              update({
                priceRange: {
                  min: config.priceRange?.min ?? null,
                  max: v === "" ? null : Number(v),
                },
              })
            }
            enabled={config.priceRange !== null}
            onToggle={(on) =>
              update({ priceRange: on ? { min: null, max: null } : null })
            }
            disabledLabel="No limit"
            placeholder={["Min $", "Max $"]}
          />
        </div>

        {/* Row 3: Volume + Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RangeInputs
            label="Traded Volume Range"
            min={config.volumeRange?.min?.toString() ?? ""}
            max={config.volumeRange?.max?.toString() ?? ""}
            onMinChange={(v) =>
              update({
                volumeRange: {
                  min: v === "" ? null : Number(v),
                  max: config.volumeRange?.max ?? null,
                },
              })
            }
            onMaxChange={(v) =>
              update({
                volumeRange: {
                  min: config.volumeRange?.min ?? null,
                  max: v === "" ? null : Number(v),
                },
              })
            }
            enabled={config.volumeRange !== null}
            onToggle={(on) =>
              update({ volumeRange: on ? { min: null, max: null } : null })
            }
            disabledLabel="No limit"
            placeholder={["Min", "Max"]}
          />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">
                Duration Range
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={!durationMinStr && !durationMaxStr && config.durationRange === null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDurationMinStr("");
                      setDurationMaxStr("");
                      update({ durationRange: null });
                    } else {
                      setDurationMinStr("0S");
                      setDurationMaxStr("30D");
                    }
                  }}
                  className="rounded border-border accent-accent"
                />
                No limit
              </label>
            </div>
            {(durationMinStr || durationMaxStr || config.durationRange !== null) && (
              <div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={durationMinStr}
                    onChange={(e) => setDurationMinStr(e.target.value)}
                    placeholder="0 Secs"
                    className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all"
                  />
                  <span className="text-muted/40 text-xs">to</span>
                  <input
                    type="text"
                    value={durationMaxStr}
                    onChange={(e) => setDurationMaxStr(e.target.value)}
                    placeholder="30D"
                    className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-accent/50 transition-all"
                  />
                </div>
                <p className="text-[9px] text-muted/30 mt-1">
                  Format: 3D 4H 5M 30S (e.g. &quot;1D 12H&quot;, &quot;30M&quot;)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Close Date Filters */}
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">
            Close Date Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MultiSelectList
              label="Year"
              options={availableYears}
              selected={config.years}
              onChange={(v) => update({ years: v })}
              renderLabel={(y) => String(y)}
            />
            <MultiSelectList
              label="Month"
              options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
              selected={config.months}
              onChange={(v) => update({ months: v })}
              renderLabel={(m) => MONTH_NAMES[m]}
            />
            <MultiSelectList
              label="Day"
              options={[0, 1, 2, 3, 4, 5, 6]}
              selected={config.daysOfWeek}
              onChange={(v) => update({ daysOfWeek: v })}
              renderLabel={(d) => DAY_NAMES[d]}
            />
          </div>
        </div>

        {/* Row 5: Day of Month + Time of Day */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RangeInputs
            label="Day of Month Range"
            min={config.dayOfMonthRange?.min?.toString() ?? ""}
            max={config.dayOfMonthRange?.max?.toString() ?? ""}
            onMinChange={(v) =>
              update({
                dayOfMonthRange: {
                  min: v === "" ? 1 : Math.max(1, Math.min(31, Number(v))),
                  max: config.dayOfMonthRange?.max ?? 31,
                },
              })
            }
            onMaxChange={(v) =>
              update({
                dayOfMonthRange: {
                  min: config.dayOfMonthRange?.min ?? 1,
                  max: v === "" ? 31 : Math.max(1, Math.min(31, Number(v))),
                },
              })
            }
            enabled={config.dayOfMonthRange !== null}
            onToggle={(on) =>
              update({
                dayOfMonthRange: on ? { min: 1, max: 31 } : null,
              })
            }
            disabledLabel="All days"
            placeholder={["1", "31"]}
          />
          <RangeInputs
            label="Time of Day Range"
            type="time"
            min={config.timeOfDayRange?.start ?? ""}
            max={config.timeOfDayRange?.end ?? ""}
            onMinChange={(v) =>
              update({
                timeOfDayRange: {
                  start: v,
                  end: config.timeOfDayRange?.end ?? "23:59",
                },
              })
            }
            onMaxChange={(v) =>
              update({
                timeOfDayRange: {
                  start: config.timeOfDayRange?.start ?? "00:00",
                  end: v,
                },
              })
            }
            enabled={config.timeOfDayRange !== null}
            onToggle={(on) =>
              update({
                timeOfDayRange: on ? { start: "00:00", end: "23:59" } : null,
              })
            }
            disabledLabel="All hours"
            placeholder={["00:00", "23:59"]}
          />
        </div>

        {/* Apply / Reset */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all"
          >
            <Filter size={14} />
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border/50 text-muted text-xs font-semibold hover:text-foreground hover:border-accent/20 transition-all"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {applied && filteredTrades && stats && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              {
                label: "Matched Trades",
                value: String(stats.totalTrades),
                icon: Hash,
                color: "text-accent",
              },
              {
                label: "Total P&L",
                value: `${stats.closedPnl >= 0 ? "+" : ""}$${stats.closedPnl.toFixed(2)}`,
                icon: TrendingUp,
                color: stats.closedPnl >= 0 ? "text-win" : "text-loss",
              },
              {
                label: "Win Rate",
                value: `${stats.winRate.toFixed(1)}%`,
                icon: Target,
                color: stats.winRate >= 50 ? "text-win" : "text-loss",
              },
              {
                label: "Avg Trade",
                value: `${stats.avgTradePnl >= 0 ? "+" : ""}$${stats.avgTradePnl.toFixed(2)}`,
                icon: ArrowUpDown,
                color: stats.avgTradePnl >= 0 ? "text-win" : "text-loss",
              },
              {
                label: "Profit Factor",
                value:
                  stats.profitFactor >= 100
                    ? "∞"
                    : stats.profitFactor.toFixed(2),
                icon: BarChart3,
                color: stats.profitFactor >= 1 ? "text-win" : "text-loss",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="glass rounded-2xl border border-border/50 p-4 group hover:border-accent/20 transition-all duration-300"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted font-semibold uppercase tracking-widest">
                    {s.label}
                  </span>
                  <div className="p-1.5 rounded-lg bg-accent/8">
                    <s.icon size={14} className="text-accent" />
                  </div>
                </div>
                <p className={`text-xl font-bold tracking-tight ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Trades Table */}
          {filteredTrades.length > 0 ? (
            <div
              className="glass rounded-2xl border border-border/50 p-5 overflow-x-auto"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Filtered Trades
                </h3>
                <span className="text-xs text-muted">
                  {filteredTrades.length} trade{filteredTrades.length !== 1 ? "s" : ""}
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 text-muted font-semibold">Symbol</th>
                    <th className="text-left py-2 text-muted font-semibold">Position</th>
                    <th className="text-right py-2 text-muted font-semibold">Entry</th>
                    <th className="text-right py-2 text-muted font-semibold">Exit</th>
                    <th className="text-right py-2 text-muted font-semibold">P&L</th>
                    <th className="text-left py-2 text-muted font-semibold">Open</th>
                    <th className="text-left py-2 text-muted font-semibold">Close</th>
                    <th className="text-right py-2 text-muted font-semibold">Duration</th>
                    <th className="text-left py-2 text-muted font-semibold">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.slice(0, 200).map((t) => {
                    const pnl = t.pnl ?? calculateTradePnl(t) ?? 0;
                    const holdSec =
                      t.close_timestamp
                        ? (new Date(t.close_timestamp).getTime() -
                            new Date(t.open_timestamp).getTime()) /
                          1000
                        : 0;
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors"
                      >
                        <td className="py-2 text-foreground font-medium">
                          {t.symbol}
                        </td>
                        <td className="py-2">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              t.position === "long"
                                ? "bg-win/10 text-win"
                                : "bg-loss/10 text-loss"
                            }`}
                          >
                            {t.position.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 text-right text-muted">
                          ${t.entry_price.toFixed(2)}
                        </td>
                        <td className="py-2 text-right text-muted">
                          ${t.exit_price?.toFixed(2) ?? "—"}
                        </td>
                        <td
                          className={`py-2 text-right font-semibold ${
                            pnl >= 0 ? "text-win" : "text-loss"
                          }`}
                        >
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                        </td>
                        <td className="py-2 text-muted">
                          {t.open_timestamp.slice(0, 10)}
                        </td>
                        <td className="py-2 text-muted">
                          {t.close_timestamp?.slice(0, 10) ?? "—"}
                        </td>
                        <td className="py-2 text-right text-muted">
                          {formatDuration(holdSec)}
                        </td>
                        <td className="py-2">
                          {t.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {t.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                              {t.tags.length > 3 && (
                                <span className="text-[9px] text-muted">
                                  +{t.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredTrades.length > 200 && (
                <p className="text-xs text-muted text-center mt-3">
                  Showing first 200 of {filteredTrades.length} trades
                </p>
              )}
            </div>
          ) : (
            <div
              className="glass rounded-2xl border border-border/50 p-10 text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <p className="text-muted text-sm">
                No trades match these filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
