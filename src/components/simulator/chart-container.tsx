"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { BinanceKline, SimSide } from "@/lib/simulator/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ChartApi = any;
type SeriesApi = any;
type MarkersApi = any;
type VolumeSeriesApi = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type Marker = {
  time: number;
  side: SimSide;
  price: number;
};

interface ChartContainerProps {
  candles: BinanceKline[];
  markers: Marker[];
}

export default function ChartContainer({ candles, markers }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ChartApi>(null);
  const seriesRef = useRef<SeriesApi>(null);
  const markersPluginRef = useRef<MarkersApi>(null);
  const volumeSeriesRef = useRef<VolumeSeriesApi>(null);
  const prevCandleCountRef = useRef(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;
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

        // Volume histogram — bottom 20% of chart
        const volumeSeries = chart.addSeries(lc.HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
        });
        chart.priceScale("volume").applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
          borderVisible: false,
        });

        // v5 markers plugin
        const markersPlugin = lc.createSeriesMarkers(series, []);

        chartRef.current = chart;
        seriesRef.current = series;
        volumeSeriesRef.current = volumeSeries;
        markersPluginRef.current = markersPlugin;
        prevCandleCountRef.current = 0;

        // Responsive resize
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            chart.applyOptions({ width, height });
          }
        });
        ro.observe(containerRef.current!);
        roRef.current = ro;

        // Signal that the chart is ready
        setChartReady(true);
      } catch (err) {
        console.error("[chart-container] init failed:", err);
        setInitError(
          err instanceof Error ? err.message : "Chart initialization failed"
        );
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
  }, []);

  // Update candles — depends on chartReady so it re-runs when chart initializes
  const updateCandles = useCallback(() => {
    const series = seriesRef.current;
    if (!chartReady || !series || candles.length === 0) return;

    const prevCount = prevCandleCountRef.current;

    if (prevCount === 0 || candles.length < prevCount) {
      // Initial load or rewind — set all data and fit to view
      series.setData(
        candles.map((c: BinanceKline) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
      volumeSeriesRef.current?.setData(
        candles.map((c: BinanceKline) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
        }))
      );
      prevCandleCountRef.current = candles.length;
      chartRef.current?.timeScale().fitContent();
      return;
    }

    // Playback — append new candles incrementally
    for (let i = prevCount; i < candles.length; i++) {
      const c = candles[i];
      series.update({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      });
      volumeSeriesRef.current?.update({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
      });
    }

    prevCandleCountRef.current = candles.length;
    chartRef.current?.timeScale().scrollToRealTime();
  }, [candles, chartReady]);

  useEffect(() => {
    updateCandles();
  }, [updateCandles]);

  // Update markers using v5 plugin API
  useEffect(() => {
    const plugin = markersPluginRef.current;
    if (!chartReady || !plugin) return;

    const chartMarkers = markers.map((m) => ({
      time: m.time,
      position: m.side === "buy" ? "belowBar" : "aboveBar",
      color: m.side === "buy" ? "#22c55e" : "#ef4444",
      shape: m.side === "buy" ? "arrowUp" : "arrowDown",
      text: m.side === "buy" ? "B" : "S",
    }));

    chartMarkers.sort((a, b) => a.time - b.time);
    plugin.setMarkers(chartMarkers);
  }, [markers, chartReady]);

  if (initError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">Chart failed to initialize</p>
          <p className="text-xs text-gray-500">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
