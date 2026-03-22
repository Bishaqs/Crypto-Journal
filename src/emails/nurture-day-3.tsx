import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";
import { ARCHETYPES, type TradingArchetype } from "@/lib/psychology-scoring";

export interface NurtureDay3Props {
  archetypeName: string;
  archetype: string;
  scores: Record<string, unknown>;
  unsubscribeUrl: string;
}

export function NurtureDay3({ archetypeName, archetype, unsubscribeUrl }: NurtureDay3Props) {
  const t = THEMES.dark;
  const info = ARCHETYPES[archetype as TradingArchetype];

  return (
    <BaseLayout preview={`What traders with your pattern struggle with most`}>
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Heading
          as="h1"
          style={{ fontSize: "22px", fontWeight: 700, color: t.text, margin: "0 0 12px 0" }}
        >
          The hidden cost of being a {archetypeName}
        </Heading>
        <Text style={{ fontSize: "14px", color: t.textMuted, margin: 0, lineHeight: "1.6" }}>
          Your psychology quiz revealed your trading pattern. Now let&apos;s look at what
          traders like you struggle with most — and why it matters more than your strategy.
        </Text>
      </Section>

      {info?.blindSpots.map((spot, i) => (
        <Section
          key={i}
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "12px",
          }}
        >
          <Text style={{ fontSize: "14px", fontWeight: 600, color: "#f59e0b", margin: "0 0 8px 0" }}>
            Blind Spot #{i + 1}
          </Text>
          <Text style={{ fontSize: "13px", color: t.text, margin: 0, lineHeight: "1.6" }}>
            {spot}
          </Text>
        </Section>
      ))}

      <Section style={{ marginTop: "24px", marginBottom: "24px" }}>
        <Text style={{ fontSize: "14px", color: t.text, lineHeight: "1.6", margin: "0 0 16px 0" }}>
          Most traders lose money not because of bad strategies, but because they can&apos;t see their own patterns.
          The same emotional triggers fire again and again — and without tracking them, nothing changes.
        </Text>
        <Text style={{ fontSize: "14px", color: t.text, lineHeight: "1.6", margin: 0 }}>
          That&apos;s exactly what Traverse was built for: connecting your psychology to your P&L
          so you can finally see what&apos;s really driving your results.
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "24px" }}>
        <EmailButton href="https://traversejournal.com">See How It Works</EmailButton>
      </Section>

      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </BaseLayout>
  );
}

export default NurtureDay3;
