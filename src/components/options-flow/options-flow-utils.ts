import type {
  OptionsFlowRow,
  SymbolSummary,
  FlowSummary,
  PremiumFilter,
} from "./options-flow-types";

export function formatPremium(value: number): string {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function mapApiEntry(f: Record<string, unknown>): OptionsFlowRow {
  const ts = f.timestamp as string;
  return {
    symbol: f.symbol as string,
    expiry: f.expiry as string,
    strike: f.strike as number,
    type: (f.type as string) === "CALL" ? "C" : "P",
    volume: f.volume as number,
    openInterest: (f.oi as number) ?? 0,
    premium: f.premium as number,
    sentiment: f.sentiment as "bullish" | "bearish" | "neutral",
    time: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    sector: (f.sector as string) ?? "Other",
    rawTimestamp: new Date(ts).getTime(),
  };
}

export function computeFlowSummary(flows: OptionsFlowRow[]): FlowSummary {
  let totalPremium = 0;
  let callVolume = 0;
  let putVolume = 0;
  let callPremium = 0;
  let putPremium = 0;
  const sentiment = { bullish: 0, bearish: 0, neutral: 0 };

  for (const f of flows) {
    totalPremium += f.premium;
    if (f.type === "C") {
      callVolume += f.volume;
      callPremium += f.premium;
    } else {
      putVolume += f.volume;
      putPremium += f.premium;
    }
    sentiment[f.sentiment]++;
  }

  return {
    totalFlows: flows.length,
    totalPremium,
    callVolume,
    putVolume,
    callPremium,
    putPremium,
    putCallRatio: callVolume > 0 ? putVolume / callVolume : 0,
    sentiment,
  };
}

export function computeSymbolSummaries(flows: OptionsFlowRow[]): SymbolSummary[] {
  const map = new Map<string, { flows: OptionsFlowRow[]; sector: string }>();

  for (const f of flows) {
    if (!map.has(f.symbol)) {
      map.set(f.symbol, { flows: [], sector: f.sector });
    }
    map.get(f.symbol)!.flows.push(f);
  }

  const summaries: SymbolSummary[] = [];
  for (const [symbol, { flows: symFlows, sector }] of map) {
    const total = symFlows.length;
    const totalPremium = symFlows.reduce((s, f) => s + f.premium, 0);
    const bullish = symFlows.filter((f) => f.sentiment === "bullish").length;
    const bearish = symFlows.filter((f) => f.sentiment === "bearish").length;
    const calls = symFlows.filter((f) => f.type === "C").length;
    const puts = symFlows.filter((f) => f.type === "P").length;

    summaries.push({
      symbol,
      sector,
      totalFlows: total,
      totalPremium,
      avgPremium: total > 0 ? totalPremium / total : 0,
      bullishPct: total > 0 ? (bullish / total) * 100 : 0,
      bearishPct: total > 0 ? (bearish / total) * 100 : 0,
      callPutRatio: puts > 0 ? calls / puts : calls > 0 ? Infinity : 0,
    });
  }

  return summaries.sort((a, b) => b.totalPremium - a.totalPremium);
}

export function filterByPremium(flows: OptionsFlowRow[], filter: PremiumFilter): OptionsFlowRow[] {
  if (filter === "all") return flows;
  if (filter === "large") return flows.filter((f) => f.premium >= 1_000_000);
  if (filter === "medium") return flows.filter((f) => f.premium >= 100_000 && f.premium < 1_000_000);
  return flows.filter((f) => f.premium < 100_000);
}
