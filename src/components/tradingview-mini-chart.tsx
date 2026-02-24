"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "@/lib/theme-context";

interface Props {
  symbol: string;
  height?: number;
  dateRange?: string;
  trendColor?: string;
}

export function TradingViewMiniChart({ symbol, height = 160, dateRange = "1M", trendColor = "rgba(0, 180, 216, 1)" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const colorTheme = theme === "light" ? "light" : "dark";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    el.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbol,
      width: "100%",
      height,
      locale: "en",
      dateRange,
      colorTheme,
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
      trendLineColor: trendColor,
      underLineColor: trendColor.replace("1)", "0.1)"),
      underLineBottomColor: trendColor.replace("1)", "0)"),
    });
    el.appendChild(script);

    return () => { el.innerHTML = ""; };
  }, [symbol, colorTheme, height, dateRange, trendColor]);

  return <div ref={containerRef} className="tradingview-widget-container rounded-xl overflow-hidden" />;
}

export function TradingViewTechnicalAnalysis({ symbol, height = 250 }: { symbol: string; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const colorTheme = theme === "light" ? "light" : "dark";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    el.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.async = true;
    script.textContent = JSON.stringify({
      interval: "1D",
      width: "100%",
      height,
      symbol,
      showIntervalTabs: false,
      isTransparent: true,
      locale: "en",
      colorTheme,
    });
    el.appendChild(script);

    return () => { el.innerHTML = ""; };
  }, [symbol, colorTheme, height]);

  return <div ref={containerRef} className="tradingview-widget-container rounded-xl overflow-hidden" />;
}
