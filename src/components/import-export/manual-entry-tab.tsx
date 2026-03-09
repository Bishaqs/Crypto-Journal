"use client";

import { useState, useCallback } from "react";
import { PenLine, Zap, Coins, TrendingUp, Flame, Globe } from "lucide-react";
import { TradeForm } from "@/components/trade-form";
import { StockTradeForm } from "@/components/stock-trade-form";
import { CommodityTradeForm } from "@/components/commodity-trade-form";
import { ForexTradeForm } from "@/components/forex-trade-form";
import { QuickTradeForm } from "@/components/quick-trade-form";

type AssetType = "crypto" | "stocks" | "commodities" | "forex";

const ASSET_OPTIONS: { id: AssetType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "crypto", label: "Crypto", icon: Coins },
  { id: "stocks", label: "Stocks", icon: TrendingUp },
  { id: "commodities", label: "Commodities", icon: Flame },
  { id: "forex", label: "Forex", icon: Globe },
];

export function ManualEntryTab() {
  const [assetType, setAssetType] = useState<AssetType>("crypto");
  const [quickMode, setQuickMode] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSaved = useCallback(() => {
    setSavedMessage("Trade saved successfully!");
    setTimeout(() => setSavedMessage(null), 3000);
  }, []);

  const noop = useCallback(() => {}, []);

  return (
    <div className="space-y-5">
      <div className="glass border border-border/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <PenLine size={16} className="text-accent" />
              Manual Trade Entry
            </h3>
            <p className="text-xs text-muted mt-0.5">Enter a single trade manually.</p>
          </div>
          <button
            onClick={() => setQuickMode(!quickMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              quickMode
                ? "bg-accent/15 text-accent border border-accent/20"
                : "text-muted hover:text-foreground border border-border"
            }`}
          >
            <Zap size={12} />
            Quick Mode
          </button>
        </div>

        {/* Asset type selector */}
        {!quickMode && (
          <div className="mb-4">
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Asset Type</p>
            <div className="flex gap-1.5">
              {ASSET_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = assetType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAssetType(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-accent/15 text-accent border border-accent/20"
                        : "text-muted hover:text-foreground border border-border"
                    }`}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Success message */}
        {savedMessage && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-win/10 text-win text-sm font-medium">
            {savedMessage}
          </div>
        )}

        {/* Form */}
        {quickMode ? (
          <QuickTradeForm
            onClose={noop}
            onSaved={handleSaved}
            variant="inline"
          />
        ) : assetType === "crypto" ? (
          <TradeForm
            onClose={noop}
            onSaved={handleSaved}
            variant="inline"
          />
        ) : assetType === "stocks" ? (
          <StockTradeForm
            onClose={noop}
            onSaved={handleSaved}
            variant="inline"
          />
        ) : assetType === "commodities" ? (
          <CommodityTradeForm
            onClose={noop}
            onSaved={handleSaved}
            variant="inline"
          />
        ) : (
          <ForexTradeForm
            onClose={noop}
            onSaved={handleSaved}
            variant="inline"
          />
        )}
      </div>
    </div>
  );
}
