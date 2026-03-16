"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart3, Search, RefreshCw, ArrowUpDown, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatLargeNumber } from "@/lib/format";

interface StockRow {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

type TabKey = "most_actives" | "gainers" | "losers";
type SortKey = "symbol" | "name" | "price" | "changePercent" | "volume" | "marketCap";
type SortDir = "asc" | "desc";

const TABS: { key: TabKey; label: string }[] = [
  { key: "most_actives", label: "Most Active" },
  { key: "gainers", label: "Gainers" },
  { key: "losers", label: "Losers" },
];

export default function StockScreenerPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("most_actives");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchData = useCallback(async (sort: TabKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/stock-screener?sort=${sort}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setStocks(json.stocks ?? []);
    } catch {
      setError("Failed to load stock screener data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(tab);
  }, [tab, fetchData]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "symbol" || key === "name" ? "asc" : "desc");
    }
  }

  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const diff = (aVal as number) - (bVal as number);
      return sortDir === "asc" ? diff : -diff;
    });

    return result;
  }, [stocks, search, sortKey, sortDir]);

  function SortableHeader({ label, field }: { label: string; field: SortKey }) {
    const isActive = sortKey === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none"
      >
        <span className="flex items-center gap-1">
          {label}
          <ArrowUpDown size={10} className={isActive ? "text-accent" : "opacity-30"} />
        </span>
      </th>
    );
  }

  if (subLoading) return null;
  if (!hasAccess("stock-trading")) return <UpgradePrompt feature="stock-trading" requiredTier="max" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-accent" />
            Stock Screener
            <InfoTooltip text="Discover the most active stocks, top gainers, and biggest losers across US markets." size={14} articleId="mt-stock-screener" />
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Most active stocks, top gainers, and biggest losers
          </p>
        </div>
        <button
          onClick={() => fetchData(tab)}
          className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div
          className="flex gap-1 rounded-xl border border-border/50 p-1 glass"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-accent/10 text-accent shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stocks..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : filteredStocks.length === 0 ? (
        <div
          className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <BarChart3 size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Stocks Found</h3>
          <p className="text-sm text-muted max-w-xs">
            {search ? "No stocks match your search. Try a different query." : "No data available at this time."}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div
            className="bg-surface rounded-2xl border border-border overflow-hidden"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold w-10">#</th>
                    <SortableHeader label="Symbol" field="symbol" />
                    <SortableHeader label="Name" field="name" />
                    <SortableHeader label="Price" field="price" />
                    <SortableHeader label="Change %" field="changePercent" />
                    <SortableHeader label="Volume" field="volume" />
                    <SortableHeader label="Market Cap" field="marketCap" />
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock, idx) => (
                    <tr
                      key={stock.symbol}
                      className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-muted">{idx + 1}</td>
                      <td className="px-4 py-3 text-xs font-bold text-accent">{stock.symbol}</td>
                      <td className="px-4 py-3 text-xs text-foreground max-w-[200px] truncate">{stock.name}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">
                        ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            stock.changePercent >= 0 ? "text-win" : "text-loss"
                          }`}
                        >
                          {stock.changePercent >= 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted tabular-nums">
                        {stock.volume >= 1e6
                          ? `${(stock.volume / 1e6).toFixed(1)}M`
                          : stock.volume >= 1e3
                          ? `${(stock.volume / 1e3).toFixed(0)}K`
                          : stock.volume.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground tabular-nums">
                        {formatLargeNumber(stock.marketCap)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center text-xs text-muted/40">
            Showing {filteredStocks.length} of {stocks.length} stocks
          </div>
        </>
      )}
    </div>
  );
}
