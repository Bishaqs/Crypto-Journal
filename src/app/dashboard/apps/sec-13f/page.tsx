"use client";

import { useState, useMemo } from "react";
import { FileSearch, Search, Loader2, ArrowUpDown, ChevronLeft, Building2 } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { usePageTour } from "@/lib/use-page-tour";
import { PageInfoButton } from "@/components/ui/page-info-button";
import { formatLargeNumber } from "@/lib/format";

interface FundResult {
  cik: string;
  name: string;
  filingDate: string;
  totalValue: number;
}

interface Holding {
  issuer: string;
  title: string;
  value: number;
  shares: number;
  type: string;
}

type SortKey = "issuer" | "value" | "shares";
type SortDir = "asc" | "desc";

export default function Sec13fPage() {
  usePageTour("sec-13f-page");
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FundResult[]>([]);
  const [selectedFund, setSelectedFund] = useState<FundResult | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingHoldings, setLoadingHoldings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [holdingsSearch, setHoldingsSearch] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setSelectedFund(null);
    setHoldings([]);
    try {
      const res = await fetch(`/api/market/sec-13f?search=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      setSearchResults(json.funds ?? []);
      if ((json.funds ?? []).length === 0) {
        setError("No funds found matching your search.");
      }
    } catch {
      setError("Failed to search SEC filings. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function selectFund(fund: FundResult) {
    setSelectedFund(fund);
    setLoadingHoldings(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/sec-13f?cik=${encodeURIComponent(fund.cik)}`);
      if (!res.ok) throw new Error("Failed to fetch holdings");
      const json = await res.json();
      setHoldings(json.holdings ?? []);
    } catch {
      setError("Failed to load fund holdings.");
    } finally {
      setLoadingHoldings(false);
    }
  }

  function handleHoldingsSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "issuer" ? "asc" : "desc");
    }
  }

  const sortedHoldings = useMemo(() => {
    let result = [...holdings];

    if (holdingsSearch) {
      const q = holdingsSearch.toLowerCase();
      result = result.filter(
        (h) => h.issuer.toLowerCase().includes(q) || h.title.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortKey === "issuer") {
        return sortDir === "asc" ? a.issuer.localeCompare(b.issuer) : b.issuer.localeCompare(a.issuer);
      }
      const diff = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === "asc" ? diff : -diff;
    });

    return result;
  }, [holdings, sortKey, sortDir, holdingsSearch]);

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.value, 0);

  function SortableHeader({ label, field }: { label: string; field: SortKey }) {
    const isActive = sortKey === field;
    return (
      <th
        onClick={() => handleHoldingsSort(field)}
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
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FileSearch size={24} className="text-accent" />
          SEC 13F Filings
          <PageInfoButton tourName="sec-13f-page" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Search institutional fund holdings from SEC 13F filings
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fund name (e.g. Berkshire, Bridgewater, ARK...)"
            className="w-full px-4 py-3 pl-9 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-5 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {/* Back button when viewing holdings */}
      {selectedFund && (
        <button
          onClick={() => { setSelectedFund(null); setHoldings([]); setHoldingsSearch(""); }}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
        >
          <ChevronLeft size={14} />
          Back to search results
        </button>
      )}

      {/* Search Results */}
      {!selectedFund && searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((fund) => (
            <button
              key={fund.cik}
              onClick={() => selectFund(fund)}
              className="glass rounded-2xl border border-border/50 p-5 text-left hover:border-accent/30 hover:bg-surface-hover/30 transition-all group"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Building2 size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                    {fund.name}
                  </h4>
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider">CIK: {fund.cik}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">Portfolio Value</p>
                  <p className="text-sm font-bold text-foreground">{formatLargeNumber(fund.totalValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">Filing Date</p>
                  <p className="text-sm text-muted">{fund.filingDate}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Holdings View */}
      {selectedFund && (
        <>
          {/* Fund Header */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedFund.name}</h3>
                <p className="text-xs text-muted mt-0.5">
                  Filed: {selectedFund.filingDate} | CIK: {selectedFund.cik}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">Total Value</p>
                <p className="text-xl font-bold text-accent">{formatLargeNumber(totalPortfolioValue)}</p>
              </div>
            </div>
          </div>

          {loadingHoldings ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          ) : holdings.length === 0 ? (
            <div
              className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <FileSearch size={48} className="text-accent/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No Holdings Found</h3>
              <p className="text-sm text-muted max-w-xs">
                This filing does not contain any holding data.
              </p>
            </div>
          ) : (
            <>
              {/* Holdings Search */}
              <div className="relative max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                <input
                  type="text"
                  value={holdingsSearch}
                  onChange={(e) => setHoldingsSearch(e.target.value)}
                  placeholder="Filter holdings..."
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>

              {/* Holdings Table */}
              <div
                className="bg-surface rounded-2xl border border-border overflow-hidden"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold w-10">#</th>
                        <SortableHeader label="Issuer" field="issuer" />
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Title</th>
                        <SortableHeader label="Value ($)" field="value" />
                        <SortableHeader label="Shares" field="shares" />
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Type</th>
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedHoldings.map((h, idx) => {
                        const weight = totalPortfolioValue > 0 ? (h.value / totalPortfolioValue) * 100 : 0;
                        return (
                          <tr
                            key={`${h.issuer}-${h.title}-${idx}`}
                            className="border-b border-border/30 hover:bg-surface-hover/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-xs text-muted">{idx + 1}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-foreground max-w-[200px] truncate">
                              {h.issuer}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted max-w-[180px] truncate">{h.title}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">
                              {formatLargeNumber(h.value)}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted tabular-nums">
                              {h.shares.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium uppercase">
                                {h.type}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden max-w-[60px]">
                                  <div
                                    className="h-full rounded-full bg-accent"
                                    style={{ width: `${Math.min(weight, 100)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted tabular-nums w-12 text-right">
                                  {weight.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-center text-xs text-muted/40">
                Showing {sortedHoldings.length} of {holdings.length} holdings
              </div>
            </>
          )}
        </>
      )}

      {/* Empty State - no search yet */}
      {!selectedFund && searchResults.length === 0 && !searching && !error && (
        <div
          className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <FileSearch size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Search Institutional Holdings</h3>
          <p className="text-sm text-muted max-w-xs">
            Look up what the biggest hedge funds and institutions are holding. Search by fund name to explore their latest 13F filing.
          </p>
        </div>
      )}
    </div>
  );
}
