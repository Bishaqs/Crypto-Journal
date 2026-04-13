"use client";

import { useMemo } from "react";
import { Trade, TradeEmotionLog } from "@/lib/types";
import { calculateTradeMFE, calculateTradeMAE } from "@/lib/calculations";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceDot,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";

type DataPoint = {
  time: number;
  pnl: number;
  label: string;
  emotion?: string;
  emotionNote?: string;
};

export function TradeRunningPnlChart({ trade, emotionLogs = [] }: { trade: Trade; emotionLogs?: TradeEmotionLog[] }) {
  const data = useMemo(() => {
    const points: DataPoint[] = [];
    const openTime = new Date(trade.open_timestamp).getTime();

    // Entry point
    points.push({ time: openTime, pnl: 0, label: "Entry" });

    // MAE point (if we have price_mae and mae_timestamp)
    if (trade.price_mae !== null && trade.mae_timestamp) {
      const mae = calculateTradeMAE(trade);
      if (mae !== null) {
        points.push({
          time: new Date(trade.mae_timestamp).getTime(),
          pnl: trade.position === "long"
            ? (trade.price_mae - trade.entry_price) * trade.quantity
            : (trade.entry_price - trade.price_mae) * trade.quantity,
          label: "MAE",
        });
      }
    }

    // MFE point (if we have price_mfe and mfe_timestamp)
    if (trade.price_mfe !== null && trade.mfe_timestamp) {
      const mfe = calculateTradeMFE(trade);
      if (mfe !== null) {
        points.push({
          time: new Date(trade.mfe_timestamp).getTime(),
          pnl: trade.position === "long"
            ? (trade.price_mfe - trade.entry_price) * trade.quantity
            : (trade.entry_price - trade.price_mfe) * trade.quantity,
          label: "MFE",
        });
      }
    }

    // Exit point
    if (trade.close_timestamp && trade.pnl !== null) {
      points.push({
        time: new Date(trade.close_timestamp).getTime(),
        pnl: trade.pnl,
        label: "Exit",
      });
    }

    // Add emotion log points
    for (const log of emotionLogs) {
      const logTime = new Date(log.started_at ?? log.created_at).getTime();
      const emoji = EMOTION_CONFIG[log.emotion]?.emoji ?? "";

      function pnlAtPrice(price: number | null, time: number): number {
        if (price !== null) {
          return trade.position === "long"
            ? (price - trade.entry_price) * trade.quantity
            : (trade.entry_price - price) * trade.quantity;
        }
        const sorted = [...points].sort((a, b) => a.time - b.time);
        const before = sorted.filter((p) => p.time <= time).pop();
        const after = sorted.find((p) => p.time >= time);
        if (before && after && before.time !== after.time) {
          const ratio = (time - before.time) / (after.time - before.time);
          return before.pnl + ratio * (after.pnl - before.pnl);
        }
        return before?.pnl ?? after?.pnl ?? 0;
      }

      points.push({
        time: logTime,
        pnl: pnlAtPrice(log.price_at_log, logTime),
        label: `${emoji} ${log.emotion}${log.ended_at ? " start" : ""}`,
        emotion: log.emotion,
        emotionNote: log.note ?? undefined,
      });

      if (log.ended_at) {
        const endTime = new Date(log.ended_at).getTime();
        points.push({
          time: endTime,
          pnl: pnlAtPrice(log.price_at_end, endTime),
          label: `${emoji} ${log.emotion} end`,
          emotion: log.emotion,
        });
      }
    }

    // Sort by time
    points.sort((a, b) => a.time - b.time);
    return points;
  }, [trade, emotionLogs]);

  const hasData = data.length >= 2;

  if (!hasData) {
    return (
      <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <TrendingUp size={14} className="text-accent" /> Running PnL
        </h3>
        <div className="flex items-center justify-center h-[200px] text-muted text-sm">
          No MAE/MFE data recorded
        </div>
      </div>
    );
  }

  const formatTime = (time: number) => {
    const d = new Date(time);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-4">
        <TrendingUp size={14} className="text-accent" /> Running PnL
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatTime}
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const p = payload[0].payload as DataPoint;
              return (
                <div className="glass rounded-lg border border-border/50 px-3 py-2 text-xs">
                  <p className="font-semibold text-foreground">{p.label}</p>
                  <p className={p.pnl >= 0 ? "text-win" : "text-loss"}>
                    ${p.pnl.toFixed(2)}
                  </p>
                  {p.emotionNote && (
                    <p className="text-muted italic mt-0.5">&quot;{p.emotionNote}&quot;</p>
                  )}
                  <p className="text-muted">{new Date(p.time).toLocaleString()}</p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={false}
          />
          {/* Reference dots for trade points (Entry, MAE, MFE, Exit) */}
          {data.filter((pt) => !pt.emotion).map((pt) => (
            <ReferenceDot
              key={pt.label}
              x={pt.time}
              y={pt.pnl}
              r={5}
              fill={pt.label === "MFE" ? "var(--color-win)" : pt.label === "MAE" ? "var(--color-loss)" : "var(--color-accent)"}
              stroke="var(--color-background)"
              strokeWidth={2}
            />
          ))}
          {/* Emotion dots */}
          {data.filter((pt) => pt.emotion).map((pt, i) => (
            <ReferenceDot
              key={`emotion-${i}`}
              x={pt.time}
              y={pt.pnl}
              r={6}
              fill="var(--color-accent)"
              stroke="var(--color-background)"
              strokeWidth={2}
              label={{
                value: EMOTION_CONFIG[pt.emotion!]?.emoji ?? "",
                position: "top",
                offset: 8,
                style: { fontSize: 14 },
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
