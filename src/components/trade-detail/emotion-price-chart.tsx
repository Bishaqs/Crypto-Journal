"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Trade, TradeEmotionLog } from "@/lib/types";
import { fetchKlines } from "@/lib/simulator/binance-klines";
import type { BinanceKline, SimInterval } from "@/lib/simulator/types";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";
import { Loader2, AlertCircle } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ChartApi = any;
type SeriesApi = any;
type MarkersApi = any;
type VolumeSeriesApi = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface EmotionPriceChartProps {
  trade: Trade;
  emotionLogs: TradeEmotionLog[];
}

/** Pick candle interval based on trade duration */
function selectInterval(openMs: number, closeMs: number): SimInterval {
  const durationHours = (closeMs - openMs) / 3600000;
  if (durationHours < 4) return "1m";
  if (durationHours < 48) return "5m";
  if (durationHours < 336) return "1h"; // 14 days
  return "1d";
}

/** Convert a Binance symbol (BTCUSDT) for fetchKlines */
function toBinanceSymbol(symbol: string): string {
  // Already a clean symbol like BTCUSDT
  if (/^[A-Z0-9]+$/.test(symbol)) return symbol;
  // Has colon prefix (BINANCE:BTCUSDT) — strip it
  if (symbol.includes(":")) return symbol.split(":").pop()!;
  // Clean up any non-alphanumeric
  return symbol.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export function EmotionPriceChart({ trade, emotionLogs }: EmotionPriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ChartApi>(null);
  const seriesRef = useRef<SeriesApi>(null);
  const markersPluginRef = useRef<MarkersApi>(null);
  const volumeSeriesRef = useRef<VolumeSeriesApi>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candles, setCandles] = useState<BinanceKline[]>([]);
  const [chartReady, setChartReady] = useState(false);

  // Fetch kline data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const openMs = new Date(trade.open_timestamp).getTime();
        const closeMs = trade.close_timestamp
          ? new Date(trade.close_timestamp).getTime()
          : Date.now();

        const interval = selectInterval(openMs, closeMs);
        const duration = closeMs - openMs;
        const padding = Math.max(duration * 0.15, 3600000); // 15% or at least 1h
        const startTime = openMs - padding;
        const endTime = closeMs + padding;

        const symbol = toBinanceSymbol(trade.symbol);
        const data = await fetchKlines(symbol, interval, startTime, endTime);

        if (!cancelled) {
          setCandles(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chart data");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [trade.symbol, trade.open_timestamp, trade.close_timestamp]);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;
    let disposed = false;

    (async () => {
      try {
        const lc = await import("lightweight-charts");
        if (disposed || !containerRef.current) return;

        const chart = lc.createChart(containerRef.current, {
          layout: {
            background: { type: lc.ColorType.Solid, color: "#0a0a0f" },
            textColor: "#9ca3af",
          },
          grid: {
            vertLines: { color: "rgba(255,255,255,0.04)" },
            horzLines: { color: "rgba(255,255,255,0.04)" },
          },
          crosshair: { mode: lc.CrosshairMode.Normal },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: "rgba(255,255,255,0.1)",
          },
          rightPriceScale: {
            borderColor: "rgba(255,255,255,0.1)",
          },
        });

        const series = chart.addSeries(lc.CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });

        const volumeSeries = chart.addSeries(lc.HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
        });
        chart.priceScale("volume").applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
          borderVisible: false,
        });

        const markersPlugin = lc.createSeriesMarkers(series, []);

        chartRef.current = chart;
        seriesRef.current = series;
        volumeSeriesRef.current = volumeSeries;
        markersPluginRef.current = markersPlugin;

        // Responsive resize
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            chart.applyOptions({ width, height });
          }
        });
        ro.observe(containerRef.current!);
        roRef.current = ro;

        setChartReady(true);
      } catch (err) {
        console.error("[EmotionPriceChart] init failed:", err);
        setError(err instanceof Error ? err.message : "Chart initialization failed");
      }
    })();

    return () => {
      disposed = true;
      roRef.current?.disconnect();
      roRef.current = null;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        volumeSeriesRef.current = null;
        markersPluginRef.current = null;
      }
      setChartReady(false);
    };
  }, [candles]);

  // Set candle + volume data
  const updateData = useCallback(() => {
    const series = seriesRef.current;
    if (!chartReady || !series || candles.length === 0) return;

    series.setData(
      candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
    );
    volumeSeriesRef.current?.setData(
      candles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
      }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles, chartReady]);

  useEffect(() => { updateData(); }, [updateData]);

  // Set markers: entry, exit, emotions
  useEffect(() => {
    const plugin = markersPluginRef.current;
    if (!chartReady || !plugin) return;

    const allMarkers: { time: number; position: string; color: string; shape: string; text: string }[] = [];

    // Entry marker
    const entryTime = Math.floor(new Date(trade.open_timestamp).getTime() / 1000);
    allMarkers.push({
      time: entryTime,
      position: "belowBar",
      color: "#22c55e",
      shape: "arrowUp",
      text: `Entry $${trade.entry_price.toLocaleString()}`,
    });

    // Exit marker
    if (trade.close_timestamp && trade.exit_price) {
      const exitTime = Math.floor(new Date(trade.close_timestamp).getTime() / 1000);
      allMarkers.push({
        time: exitTime,
        position: "aboveBar",
        color: "#ef4444",
        shape: "arrowDown",
        text: `Exit $${trade.exit_price.toLocaleString()}`,
      });
    }

    // Emotion markers
    for (const log of emotionLogs) {
      if (!log.price_at_log) continue; // Need price for chart placement
      const config = EMOTION_CONFIG[log.emotion];
      const startTime = Math.floor(new Date(log.started_at ?? log.created_at).getTime() / 1000);

      if (log.ended_at && log.price_at_end) {
        // Duration: paired start/end markers
        const endTime = Math.floor(new Date(log.ended_at).getTime() / 1000);
        allMarkers.push({
          time: startTime,
          position: "aboveBar",
          color: "#eab308",
          shape: "circle",
          text: `${config?.emoji ?? ""} ${log.emotion} start`,
        });
        allMarkers.push({
          time: endTime,
          position: "aboveBar",
          color: "#eab308",
          shape: "circle",
          text: `${config?.emoji ?? ""} ${log.emotion} end`,
        });
      } else {
        // Point-in-time: single marker
        allMarkers.push({
          time: startTime,
          position: "aboveBar",
          color: "#eab308",
          shape: "circle",
          text: `${config?.emoji ?? ""} ${log.emotion}`,
        });
      }
    }

    // Sort by time (required by lightweight-charts)
    allMarkers.sort((a, b) => a.time - b.time);
    plugin.setMarkers(allMarkers);
  }, [trade, emotionLogs, chartReady]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-xl bg-[#0a0a0f]">
        <div className="flex items-center gap-2 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading chart data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-xl bg-[#0a0a0f]">
        <div className="flex items-center gap-2 text-muted text-sm">
          <AlertCircle size={16} className="text-loss" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: 500 }}
    />
  );
}
