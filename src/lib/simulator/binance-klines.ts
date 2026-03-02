import type { BinanceKline, SimInterval } from "./types";

const BASE = "https://api.binance.com/api/v3/klines";
const MAX_PER_REQUEST = 1000;

export async function fetchKlines(
  symbol: string,
  interval: SimInterval,
  startTime: number,
  endTime: number
): Promise<BinanceKline[]> {
  const allCandles: BinanceKline[] = [];
  let cursor = startTime;

  while (cursor < endTime) {
    const url = `${BASE}?symbol=${symbol}&interval=${interval}&startTime=${cursor}&endTime=${endTime}&limit=${MAX_PER_REQUEST}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
    const data: unknown[][] = await res.json();

    if (data.length === 0) break;

    for (const k of data) {
      allCandles.push({
        time: Math.floor(Number(k[0]) / 1000),
        open: parseFloat(k[1] as string),
        high: parseFloat(k[2] as string),
        low: parseFloat(k[3] as string),
        close: parseFloat(k[4] as string),
        volume: parseFloat(k[5] as string),
      });
    }

    // Move cursor past the last candle's open time
    cursor = Number(data[data.length - 1][0]) + 1;

    // If we got fewer than max, we've reached the end
    if (data.length < MAX_PER_REQUEST) break;
  }

  return allCandles;
}

/** Get start/end timestamps (ms) for a given date string (YYYY-MM-DD) in UTC */
export function getDayRange(dateStr: string): { startTime: number; endTime: number } {
  const d = new Date(dateStr + "T00:00:00Z");
  const startTime = d.getTime();
  const endTime = startTime + 24 * 60 * 60 * 1000 - 1;
  return { startTime, endTime };
}
