"use client";

import { Trade } from "@/lib/types";
import {
  generateBehavioralInsights,
  getEmotionPnlData,
  getConfidencePnlData,
  getProcessScorePnlData,
} from "@/lib/calculations";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";

function InsightCard({
  label,
  description,
  value,
  sentiment,
}: {
  label: string;
  description: string;
  value: string;
  sentiment: "positive" | "negative" | "neutral";
}) {
  const colors = {
    positive: { border: "border-win/20", bg: "bg-win/5", text: "text-win", icon: TrendingUp },
    negative: { border: "border-loss/20", bg: "bg-loss/5", text: "text-loss", icon: TrendingDown },
    neutral: { border: "border-border", bg: "bg-surface", text: "text-muted", icon: AlertCircle },
  };
  const c = colors[sentiment];
  const Icon = c.icon;

  return (
    <div
      className={`rounded-xl border ${c.border} ${c.bg} p-4 transition-all hover:scale-[1.01]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={14} className={c.text} />
            <span className="text-xs font-semibold text-foreground truncate">
              {label}
            </span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">{description}</p>
        </div>
        <span className={`text-sm font-bold ${c.text} whitespace-nowrap`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function BehavioralInsights({ trades }: { trades: Trade[] }) {
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const insights = generateBehavioralInsights(trades);
  const emotionData = getEmotionPnlData(trades);
  const confidenceData = getConfidencePnlData(trades);
  const processData = getProcessScorePnlData(trades);

  const hasEmotionData = emotionData.length > 0;
  const hasConfidenceData = confidenceData.length >= 3;
  const hasProcessData = processData.length >= 3;

  if (!hasEmotionData && !hasConfidenceData && !hasProcessData && insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-accent" />
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Behavioral Insights
        </h2>
      </div>

      {/* Insight cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, i) => (
            <InsightCard key={i} {...insight} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion → P&L bar chart */}
        {hasEmotionData && (
          <div
            className="glass rounded-2xl border border-border/50 p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                P&L by Emotion
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={emotionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v) => `$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="emotion"
                  tick={{ fontSize: 11, fill: colors.tick }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.tooltipBg, backdropFilter: "blur(16px)",
                    border: colors.tooltipBorder,
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: colors.tick }}
                  formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Total P&L"]}
                />
                <Bar dataKey="pnl" radius={[0, 6, 6, 0]}>
                  {emotionData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.pnl >= 0 ? colors.win : colors.loss}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Confidence vs P&L scatter */}
        {hasConfidenceData && (
          <div
            className="glass rounded-2xl border border-border/50 p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Confidence vs P&L
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  type="number"
                  dataKey="confidence"
                  name="Confidence"
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fill: colors.tick }}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                  label={{ value: "Confidence", position: "bottom", fontSize: 10, fill: colors.tick, offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="pnl"
                  name="P&L"
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v) => `$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.tooltipBg, backdropFilter: "blur(16px)",
                    border: colors.tooltipBorder,
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  formatter={(value) => [
                    `$${Number(value ?? 0).toFixed(2)}`,
                    "Value",
                  ]}
                />
                <Scatter
                  data={confidenceData}
                  fill={colors.accent}
                  fillOpacity={0.7}
                >
                  {confidenceData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.pnl >= 0 ? colors.win : colors.loss}
                      fillOpacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Process score → avg P&L */}
        {hasProcessData && (
          <div
            className="glass rounded-2xl border border-border/50 p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Process Score vs Avg P&L
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={processData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="score"
                  tick={{ fontSize: 11, fill: colors.tick }}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                  label={{ value: "Process Score", position: "bottom", fontSize: 10, fill: colors.tick, offset: -5 }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickFormatter={(v) => `$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.tooltipBg, backdropFilter: "blur(16px)",
                    border: colors.tooltipBorder,
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: colors.tick }}
                  labelFormatter={(v) => `Score: ${v}`}
                  formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Avg P&L"]}
                />
                <Bar dataKey="avgPnl" radius={[6, 6, 0, 0]}>
                  {processData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.avgPnl >= 0 ? colors.win : colors.loss}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
