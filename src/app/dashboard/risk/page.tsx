"use client";

import { useState } from "react";
import { Calculator, DollarSign, Target, AlertTriangle, TrendingUp } from "lucide-react";
import { Header } from "@/components/header";

export default function RiskCalculatorPage() {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [entryPrice, setEntryPrice] = useState(97000);
  const [stopLoss, setStopLoss] = useState(96000);
  const [leverage, setLeverage] = useState(1);

  const direction = entryPrice > stopLoss ? "long" : "short";
  const priceDiff = Math.abs(entryPrice - stopLoss);
  const riskPercentOfEntry = entryPrice > 0 ? (priceDiff / entryPrice) * 100 : 0;
  const dollarRisk = accountSize * (riskPercent / 100);
  const positionSize = priceDiff > 0 ? dollarRisk / priceDiff : 0;
  const positionValue = positionSize * entryPrice;
  const leveragedPositionValue = positionValue * leverage;

  // R-multiple targets
  const r1 = direction === "long" ? entryPrice + priceDiff : entryPrice - priceDiff;
  const r2 = direction === "long" ? entryPrice + priceDiff * 2 : entryPrice - priceDiff * 2;
  const r3 = direction === "long" ? entryPrice + priceDiff * 3 : entryPrice - priceDiff * 3;

  // Liquidation price (simplified: 1/leverage distance from entry)
  const liquidationPrice = leverage > 1
    ? direction === "long"
      ? entryPrice * (1 - 1 / leverage)
      : entryPrice * (1 + 1 / leverage)
    : null;

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Calculator size={24} className="text-accent" />
          Risk Calculator
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Calculate position size, dollar risk, and R-multiple targets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Trade Parameters</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Account Size ($)</label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Risk Per Trade (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.25"
                  max="5"
                  step="0.25"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="flex-1 accent-[#00B4D8]"
                />
                <span className="text-sm font-bold text-accent w-12 text-right">{riskPercent}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Entry Price ($)</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Stop Loss ($)</label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted/60 uppercase tracking-wider font-semibold mb-1.5 block">Leverage</label>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 10, 20].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLeverage(l)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      leverage === l
                        ? "bg-accent/10 text-accent border border-accent/30"
                        : "bg-background border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {l}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {/* Direction badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
            direction === "long" ? "bg-win/10 text-win border border-win/20" : "bg-loss/10 text-loss border border-loss/20"
          }`}>
            {direction === "long" ? <TrendingUp size={16} /> : <AlertTriangle size={16} />}
            {direction.toUpperCase()} — Stop is {riskPercentOfEntry.toFixed(2)}% from entry
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Dollar Risk", value: `$${dollarRisk.toFixed(2)}`, icon: DollarSign, color: "text-loss" },
              { label: "Position Size", value: positionSize.toFixed(6), icon: Target, color: "text-accent" },
              { label: "Position Value", value: `$${positionValue.toFixed(2)}`, icon: Calculator, color: "text-foreground" },
              { label: "Leveraged Value", value: `$${leveragedPositionValue.toFixed(2)}`, icon: TrendingUp, color: leverage > 1 ? "text-amber-400" : "text-foreground" },
            ].map((m) => (
              <div key={m.label} className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <m.icon size={14} className="text-muted/60" />
                  <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold">{m.label}</p>
                </div>
                <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* R-multiple targets */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">R-Multiple Targets</h3>
            <div className="space-y-2">
              {[
                { label: "1R Target", price: r1, profit: dollarRisk, color: "text-win" },
                { label: "2R Target", price: r2, profit: dollarRisk * 2, color: "text-win" },
                { label: "3R Target", price: r3, profit: dollarRisk * 3, color: "text-win" },
              ].map((t) => (
                <div key={t.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background">
                  <span className="text-xs font-medium text-muted">{t.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-foreground font-medium">${t.price.toFixed(2)}</span>
                    <span className={`text-xs font-bold ${t.color}`}>+${t.profit.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Liquidation warning */}
          {leverage > 1 && liquidationPrice !== null && (
            <div className="bg-loss/5 border border-loss/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-loss" />
                <p className="text-xs font-semibold text-loss uppercase tracking-wider">Liquidation Price</p>
              </div>
              <p className="text-lg font-bold text-loss">${liquidationPrice.toFixed(2)}</p>
              <p className="text-[10px] text-loss/60 mt-1">
                At {leverage}x leverage, you get liquidated if price moves {(100 / leverage).toFixed(1)}% against you
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
