import { Column, Heading, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export interface WeeklyDigestProps {
  weekLabel: string;
  totalPnl: number;
  tradeCount: number;
  winRate: number;
  wins: number;
  losses: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
  greenDays: number;
  redDays: number;
  dashboardLink: string;
  unsubscribeUrl?: string;
}

function StatCard({ label, value }: { label: string; value: string }) {
  const t = THEMES.dark;
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: "8px",
        padding: "16px",
        textAlign: "center" as const,
      }}
    >
      <Text
        style={{
          fontSize: "12px",
          color: t.textMuted,
          textTransform: "uppercase" as const,
          letterSpacing: "0.1em",
          margin: "0 0 4px 0",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: t.text,
          margin: 0,
        }}
      >
        {value}
      </Text>
    </div>
  );
}

function formatPnl(pnl: number): string {
  const prefix = pnl >= 0 ? "+" : "";
  return `${prefix}$${pnl.toFixed(2)}`;
}

export function WeeklyDigest({
  weekLabel = "Mar 10 - Mar 16, 2026",
  totalPnl = 1234.56,
  tradeCount = 24,
  winRate = 62.5,
  wins = 15,
  losses = 9,
  bestTrade = { symbol: "BTC/USDT", pnl: 520.0 },
  worstTrade = { symbol: "ETH/USDT", pnl: -180.5 },
  greenDays = 4,
  redDays = 3,
  dashboardLink = "https://traversejournal.com/dashboard/reports",
  unsubscribeUrl,
}: WeeklyDigestProps) {
  const t = THEMES.dark;
  const pnlColor = totalPnl >= 0 ? "#4ade80" : "#f87171";

  return (
    <BaseLayout theme="dark" preview={`Your week: ${formatPnl(totalPnl)} across ${tradeCount} trades`}>
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Text
          style={{
            fontSize: "13px",
            color: t.textMuted,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            margin: "0 0 8px 0",
          }}
        >
          Weekly Recap
        </Text>
        <Heading
          as="h1"
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: t.text,
            margin: "0 0 4px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Your Week in Review
        </Heading>
        <Text
          style={{
            fontSize: "14px",
            color: t.textMuted,
            margin: 0,
          }}
        >
          {weekLabel}
        </Text>
      </Section>

      {/* Hero P&L */}
      <Section
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center" as const,
          marginBottom: "16px",
        }}
      >
        <Text
          style={{
            fontSize: "13px",
            color: t.textMuted,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            margin: "0 0 4px 0",
          }}
        >
          Total P&L
        </Text>
        <Text
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: pnlColor,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {formatPnl(totalPnl)}
        </Text>
      </Section>

      {/* Stats Grid */}
      <Section style={{ marginBottom: "16px" }}>
        <Row>
          <Column style={{ width: "50%", paddingRight: "6px" }}>
            <StatCard label="Trades" value={String(tradeCount)} />
          </Column>
          <Column style={{ width: "50%", paddingLeft: "6px" }}>
            <StatCard label="Win Rate" value={`${winRate.toFixed(1)}%`} />
          </Column>
        </Row>
      </Section>
      <Section style={{ marginBottom: "24px" }}>
        <Row>
          <Column style={{ width: "50%", paddingRight: "6px" }}>
            <StatCard label="Green Days" value={String(greenDays)} />
          </Column>
          <Column style={{ width: "50%", paddingLeft: "6px" }}>
            <StatCard label="Red Days" value={String(redDays)} />
          </Column>
        </Row>
      </Section>

      {/* Best / Worst */}
      {(bestTrade || worstTrade) && (
        <Section
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          {bestTrade && (
            <Text
              style={{
                fontSize: "14px",
                color: t.textMuted,
                margin: "0 0 8px 0",
                lineHeight: "1.5",
              }}
            >
              <strong style={{ color: "#4ade80" }}>Best Trade:</strong>{" "}
              {bestTrade.symbol} ({formatPnl(bestTrade.pnl)})
            </Text>
          )}
          {worstTrade && (
            <Text
              style={{
                fontSize: "14px",
                color: t.textMuted,
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              <strong style={{ color: "#f87171" }}>Worst Trade:</strong>{" "}
              {worstTrade.symbol} ({formatPnl(worstTrade.pnl)})
            </Text>
          )}
        </Section>
      )}

      {/* W/L */}
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Text
          style={{
            fontSize: "14px",
            color: t.textMuted,
            margin: "0 0 16px 0",
          }}
        >
          <span style={{ color: "#4ade80" }}>{wins}W</span>
          {" / "}
          <span style={{ color: "#f87171" }}>{losses}L</span>
        </Text>
        <EmailButton href={dashboardLink} theme="dark">
          View Full Report
        </EmailButton>
      </Section>

      <EmailFooter theme="dark" unsubscribeUrl={unsubscribeUrl} />
    </BaseLayout>
  );
}

WeeklyDigest.PreviewProps = {
  weekLabel: "Mar 10 - Mar 16, 2026",
  totalPnl: 1234.56,
  tradeCount: 24,
  winRate: 62.5,
  wins: 15,
  losses: 9,
  bestTrade: { symbol: "BTC/USDT", pnl: 520.0 },
  worstTrade: { symbol: "ETH/USDT", pnl: -180.5 },
  greenDays: 4,
  redDays: 3,
  dashboardLink: "https://traversejournal.com/dashboard/reports",
} as WeeklyDigestProps;

export default WeeklyDigest;
