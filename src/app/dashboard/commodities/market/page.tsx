"use client";

import { useState, useEffect, useCallback } from "react";
import { Gem, RefreshCw, Flame, Wheat, BarChart3 } from "lucide-react";
import { TradingViewMiniChart, TradingViewTechnicalAnalysis } from "@/components/tradingview-mini-chart";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { EconomicCalendar } from "@/components/dashboard/economic-calendar";

interface CommodityData {
  price: number;
  change: number;
  changePct: number;
  spark: number[];
}

interface CommodityMarketData {
  commodities: Record<string, CommodityData>;
  timestamp: number;
}

function PctBadge({ value }: { value: number }) {
  const isPos = value >= 0;
  return (
    <span className={`text-xs font-semibold tabular-nums ${isPos ? "text-win" : "text-loss"}`}>
      {isPos ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function CommodityCard({ label, data, icon, unit }: { label: string; data?: CommodityData; icon: string; unit: string }) {
  if (!data) return (
    <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{label}</p>
      <p className="text-lg font-bold text-muted">—</p>
    </div>
  );

  const isPos = data.changePct >= 0;
  return (
    <div className="glass rounded-xl border border-border/50 p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{label}</p>
        <span className="text-xs">{icon}</span>
      </div>
      <p className="text-lg font-bold tabular-nums text-foreground">
        ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className={`text-xs tabular-nums ${isPos ? "text-win" : "text-loss"}`}>
          {isPos ? "+" : ""}{data.change.toFixed(2)}
        </span>
        <PctBadge value={data.changePct} />
        <span className="text-[9px] text-muted/40">{unit}</span>
      </div>
    </div>
  );
}

const METALS = [
  { key: "GOLD", label: "Gold", icon: "🥇", unit: "/oz", tvSymbol: "TVC:GOLD" },
  { key: "SILVER", label: "Silver", icon: "🥈", unit: "/oz", tvSymbol: "TVC:SILVER" },
  { key: "PLATINUM", label: "Platinum", icon: "⬜", unit: "/oz", tvSymbol: "TVC:PLATINUM" },
  { key: "COPPER", label: "Copper", icon: "🟤", unit: "/lb", tvSymbol: "TVC:COPPER" },
];

const ENERGY = [
  { key: "WTI", label: "WTI Crude", icon: "🛢️", unit: "/bbl", tvSymbol: "TVC:USOIL" },
  { key: "BRENT", label: "Brent Crude", icon: "🛢️", unit: "/bbl", tvSymbol: "TVC:UKOIL" },
  { key: "NATGAS", label: "Natural Gas", icon: "🔥", unit: "/MMBtu", tvSymbol: "PEPPERSTONE:NATGAS" },
];

const AGRICULTURE = [
  { key: "CORN", label: "Corn", icon: "🌽", unit: "/bu", tvSymbol: "PEPPERSTONE:CORN" },
  { key: "WHEAT", label: "Wheat", icon: "🌾", unit: "/bu", tvSymbol: "PEPPERSTONE:WHEAT" },
  { key: "SOYBEANS", label: "Soybeans", icon: "🫘", unit: "/bu", tvSymbol: "PEPPERSTONE:SOYBEAN" },
  { key: "COFFEE", label: "Coffee", icon: "☕", unit: "/lb", tvSymbol: "PEPPERSTONE:COFFEE" },
  { key: "SUGAR", label: "Sugar", icon: "🍬", unit: "/lb", tvSymbol: "PEPPERSTONE:SUGAR" },
];

export default function CommoditiesMarketPage() {
  const [data, setData] = useState<CommodityMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market/commodities");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Failed to load commodity data. Retrying...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent">Loading commodity data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Gem size={24} className="text-accent" />
            Commodities Market
            <InfoTooltip text="Live commodity futures — precious metals, energy, and agricultural prices" articleId="mt-screener" />
          </h2>
          <p className="text-sm text-muted mt-0.5">Metals, energy & agriculture</p>
        </div>
        <div className="flex items-center gap-3">
          {data?.timestamp && (
            <span className="text-[10px] text-muted/50">
              Updated {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-sm text-loss">{error}</div>
      )}

      {/* Section 1: Precious Metals */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Gem size={16} className="text-accent" />
          Precious Metals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {METALS.map(m => (
            <CommodityCard key={m.key} label={m.label} data={data?.commodities?.[m.key]} icon={m.icon} unit={m.unit} />
          ))}
        </div>
      </div>

      {/* Section 2: Energy */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Flame size={16} className="text-accent" />
          Energy
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ENERGY.map(m => (
            <CommodityCard key={m.key} label={m.label} data={data?.commodities?.[m.key]} icon={m.icon} unit={m.unit} />
          ))}
        </div>
      </div>

      {/* Section 3: Agriculture */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Wheat size={16} className="text-accent" />
          Agriculture
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {AGRICULTURE.map(m => (
            <CommodityCard key={m.key} label={m.label} data={data?.commodities?.[m.key]} icon={m.icon} unit={m.unit} />
          ))}
        </div>
      </div>

      {/* Section 4: Gold chart + Technical Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-accent" />
            Gold (GC) Chart
          </h3>
          {data?.commodities?.GOLD && (
            <div className="flex items-center gap-4 mb-3">
              <p className="text-2xl font-bold tabular-nums text-foreground">
                ${data.commodities.GOLD.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <PctBadge value={data.commodities.GOLD.changePct} />
            </div>
          )}
          <TradingViewMiniChart symbol="TVC:GOLD" height={180} />
        </div>

        <div className="glass rounded-xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-accent" />
            WTI Crude Sentiment
          </h3>
          <TradingViewTechnicalAnalysis symbol="NYMEX:CL1!" height={350} />
        </div>
      </div>

      {/* Section 5: Mini charts for all commodities */}
      <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-accent" />
          Commodity Charts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...METALS, ...ENERGY, ...AGRICULTURE].map(({ key, label, tvSymbol }) => (
            <div key={key} className="glass rounded-xl border border-border/50 p-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">{label}</span>
                {data?.commodities?.[key] && (
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    ${data.commodities[key].price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <TradingViewMiniChart symbol={tvSymbol} height={120} dateRange="1M" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 6: Economic Calendar */}
      <EconomicCalendar currencies={["USD"]} minImpact="high" />

      {!data && !loading && !error && (
        <div className="text-center py-16">
          <Gem size={48} className="text-accent/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">No commodity data</p>
          <p className="text-sm text-muted">Unable to load data. Try refreshing.</p>
        </div>
      )}
    </div>
  );
}
