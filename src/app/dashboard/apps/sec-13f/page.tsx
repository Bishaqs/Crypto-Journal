"use client";

import { useState, useEffect, useCallback } from "react";
import { FileSearch, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import { useSubscription } from "@/lib/use-subscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import OverviewTab from "@/components/fundamentals/overview-tab";
import BalanceSheetTab from "@/components/fundamentals/balance-sheet-tab";
import CashFlowTab from "@/components/fundamentals/cash-flow-tab";
import IncomeStatementTab from "@/components/fundamentals/income-statement-tab";
import InstitutionalTab from "@/components/fundamentals/institutional-tab";
import {
  type FundamentalsData,
  type FundamentalsTab,
  TAB_OPTIONS,
} from "@/components/fundamentals/fundamentals-types";
import SymbolSearch from "@/components/ui/symbol-search";

export default function FundamentalsPage() {
  const { hasAccess, loading: subLoading } = useSubscription();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const [symbol, setSymbol] = useState("AAPL");
  const [activeTab, setActiveTab] = useState<FundamentalsTab>("overview");
  const [data, setData] = useState<FundamentalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  const fetchFundamentals = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/fundamentals?symbol=${encodeURIComponent(sym)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json as FundamentalsData);
      setIsMockData(!!json.isMockData);
    } catch {
      setError("Failed to load fundamentals data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFundamentals(symbol);
  }, [symbol, fetchFundamentals]);

  function handleSymbolSelect(sym: string) {
    if (sym !== symbol) {
      setSymbol(sym);
    }
  }

  if (subLoading) return null;
  if (!hasAccess("advanced-analytics")) return <UpgradePrompt feature="advanced-analytics" requiredTier="pro" />;

  return (
    <div className="space-y-5 mx-auto max-w-[1600px]">
      <Header />

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FileSearch size={24} className="text-accent" />
          Fundamentals
          <InfoTooltip text="View company financials including income statements, balance sheets, cash flow, and institutional holdings." size={14} articleId="mt-stock-screener" />
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Company overview, valuation metrics, and financial statements
        </p>
      </div>

      {/* Demo banner */}
      {isMockData && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-center gap-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold uppercase tracking-wider">Demo</span>
          <p className="text-xs text-muted">
            Showing simulated fundamentals data. Live data will be available when financial APIs are connected.
          </p>
        </div>
      )}

      {/* Symbol Search */}
      <SymbolSearch
        mode="stock"
        value={symbol}
        onSelect={handleSymbolSelect}
        popularKey="fundamentals"
        placeholder="Search any stock..."
      />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-border/50 p-1 glass w-fit">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.value
                ? "bg-accent/10 text-accent shadow-sm"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {/* Loading / Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : data ? (
        <>
          {activeTab === "overview" && <OverviewTab data={data} />}
          {activeTab === "balance-sheet" && (
            <BalanceSheetTab data={data.balanceSheet} symbol={symbol} colors={colors} />
          )}
          {activeTab === "cash-flow" && (
            <CashFlowTab data={data.cashFlow} symbol={symbol} colors={colors} />
          )}
          {activeTab === "income-statement" && (
            <IncomeStatementTab data={data.incomeStatement} symbol={symbol} colors={colors} />
          )}
          {activeTab === "institutional" && (
            <InstitutionalTab data={data.institutional} symbol={symbol} colors={colors} />
          )}
        </>
      ) : (
        <div
          className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <FileSearch size={48} className="text-accent/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Data Available</h3>
          <p className="text-sm text-muted max-w-xs">
            Enter a symbol and click Analyze to view company fundamentals.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted/40">
        <span>
          Analyzing: {symbol}{data?.overview?.name ? ` (${data.overview.name})` : ""}
        </span>
        <span>
          {data ? `${data.balanceSheet.annual.length} years of financial data` : ""}
        </span>
      </div>
    </div>
  );
}
