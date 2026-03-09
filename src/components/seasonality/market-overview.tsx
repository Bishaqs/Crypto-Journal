"use client";

import { TradingViewMiniChart } from "@/components/tradingview-mini-chart";

const MARKET_METRICS = [
  { key: "BTC.D", label: "BTC Dominance", tvSymbol: "CRYPTOCAP:BTC.D" },
  { key: "TOTAL", label: "Total Market Cap", tvSymbol: "CRYPTOCAP:TOTAL" },
  { key: "TOTAL2", label: "Total ex-BTC", tvSymbol: "CRYPTOCAP:TOTAL2" },
  { key: "TOTAL3", label: "Total ex-BTC/ETH", tvSymbol: "CRYPTOCAP:TOTAL3" },
  { key: "USDT.D", label: "USDT Dominance", tvSymbol: "CRYPTOCAP:USDT.D" },
  { key: "USDC.D", label: "USDC Dominance", tvSymbol: "CRYPTOCAP:USDC.D" },
];

export default function MarketOverview() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
        Market Overview
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {MARKET_METRICS.map((m) => (
          <div
            key={m.key}
            className="glass rounded-xl border border-border/50 p-3 overflow-hidden"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-[11px] font-semibold text-foreground mb-1">
              {m.label}
            </p>
            <TradingViewMiniChart
              symbol={m.tvSymbol}
              height={120}
              dateRange="3M"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
