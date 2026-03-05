"use client";

import type { FundamentalsData, MetricDef } from "./fundamentals-types";
import {
  GENERAL_METRICS,
  VALUATION_METRICS,
  SHARES_METRICS,
  SPLITS_METRICS,
} from "./fundamentals-types";
import { formatMetricValue } from "./fundamentals-utils";

interface OverviewTabProps {
  data: FundamentalsData;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-1">
        {label}
      </p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function MetricSection({
  title,
  metrics,
  data,
}: {
  title: string;
  metrics: MetricDef[];
  data: Record<string, unknown>;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted/60 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const raw = data[m.key];
          const formatted = raw !== undefined && raw !== null
            ? formatMetricValue(raw as number | string, m.format)
            : "N/A";
          return <MetricCard key={m.key} label={m.label} value={formatted} />;
        })}
      </div>
    </div>
  );
}

function FiftyTwoWeekRange({ high, low, current }: { high: number; low: number; current: number }) {
  const range = high - low;
  const pct = range > 0 ? ((current - low) / range) * 100 : 50;
  const clampedPct = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="glass rounded-xl border border-border/50 p-4 hover:border-accent/20 transition-all duration-300 col-span-2 sm:col-span-3 lg:col-span-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-[10px] text-muted/60 uppercase tracking-wider font-semibold mb-2">
        52-Week Range
      </p>
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-loss tabular-nums">${low.toFixed(2)}</span>
        <div className="flex-1 relative h-2 rounded-full bg-border/30">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-loss via-accent to-win"
            style={{ width: "100%" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent border-2 border-background shadow-md"
            style={{ left: `${clampedPct}%`, transform: `translateX(-50%) translateY(-50%)` }}
          />
        </div>
        <span className="text-xs font-semibold text-win tabular-nums">${high.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function OverviewTab({ data }: OverviewTabProps) {
  const { overview, general, valuation, shares, splitsDividends } = data;

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div
        className="glass rounded-2xl border border-border/50 p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-foreground">{overview.name}</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                {overview.exchange}:{overview.symbol}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface text-muted border border-border/50">
                {overview.sector}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface text-muted border border-border/50">
                {overview.industry}
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed max-w-2xl">
              {overview.description}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <a
              href={overview.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-accent hover:underline"
            >
              Company Website
            </a>
            <a
              href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(overview.name)}&type=10-K&dateb=&owner=include&count=10`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-accent hover:underline"
            >
              SEC 10-K Filings
            </a>
            <a
              href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(overview.name)}&type=10-Q&dateb=&owner=include&count=10`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-accent hover:underline"
            >
              SEC 10-Q Filings
            </a>
          </div>
        </div>
      </div>

      {/* General */}
      <MetricSection
        title="General"
        metrics={GENERAL_METRICS}
        data={general as unknown as Record<string, unknown>}
      />

      {/* Valuation & TTM */}
      <MetricSection
        title="Valuation & TTM"
        metrics={VALUATION_METRICS}
        data={valuation as unknown as Record<string, unknown>}
      />

      {/* Shares */}
      <div>
        <h3 className="text-xs font-semibold text-muted/60 uppercase tracking-wider mb-3">
          Shares
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SHARES_METRICS.map((m) => {
            const raw = (shares as unknown as Record<string, unknown>)[m.key];
            const formatted = raw !== undefined && raw !== null
              ? formatMetricValue(raw as number | string, m.format)
              : "N/A";
            return <MetricCard key={m.key} label={m.label} value={formatted} />;
          })}
          <FiftyTwoWeekRange
            high={shares.fiftyTwoWeekHigh}
            low={shares.fiftyTwoWeekLow}
            current={(shares.fiftyTwoWeekHigh + shares.fiftyTwoWeekLow) / 2}
          />
        </div>
      </div>

      {/* Splits & Dividends */}
      <MetricSection
        title="Splits & Dividends"
        metrics={SPLITS_METRICS}
        data={splitsDividends as unknown as Record<string, unknown>}
      />
    </div>
  );
}
