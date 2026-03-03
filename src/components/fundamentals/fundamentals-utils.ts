export function formatCurrencyLarge(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toLocaleString()}`;
}

export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatRatio(value: number): string {
  return value.toFixed(2);
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatSharesCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${abs.toLocaleString()}`;
}

export function formatPctChange(current: number, previous: number): { text: string; isPositive: boolean } {
  if (previous === 0) return { text: "New", isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return {
    text: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    isPositive: change >= 0,
  };
}

export function formatMetricValue(value: number | string, format: string): string {
  if (format === "date" || format === "text") return String(value);
  const num = Number(value);
  if (isNaN(num)) return String(value);
  switch (format) {
    case "currencyLarge": return formatCurrencyLarge(num);
    case "currency": return formatCurrency(num);
    case "percent": return formatPercent(num);
    case "ratio": return formatRatio(num);
    case "number": return formatNumber(num);
    default: return String(value);
  }
}
