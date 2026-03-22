import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export interface NurtureDay15Props {
  unsubscribeUrl: string;
  discountCode?: string;
  discount?: number;
}

export function NurtureDay15({ unsubscribeUrl, discountCode, discount = 50 }: NurtureDay15Props) {
  const t = THEMES.dark;

  return (
    <BaseLayout preview={discountCode ? `Last chance: your ${discount}% discount` : "Your psychology insights are waiting"}>
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Heading
          as="h1"
          style={{ fontSize: "22px", fontWeight: 700, color: t.text, margin: "0 0 12px 0" }}
        >
          {discountCode
            ? `Your ${discount}% discount won't last forever`
            : "Your trading psychology insights are waiting"
          }
        </Heading>
        <Text style={{ fontSize: "14px", color: t.textMuted, margin: 0, lineHeight: "1.6" }}>
          Two weeks ago, you discovered your trading psychology pattern.
          Since then, you&apos;ve probably noticed it playing out in your trading.
          The question is: what are you going to do about it?
        </Text>
      </Section>

      {discountCode && (
        <Section
          style={{
            background: "rgba(0,180,216,0.08)",
            border: `1px solid rgba(0,180,216,0.3)`,
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center" as const,
            marginBottom: "24px",
          }}
        >
          <Text style={{ fontSize: "12px", color: t.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 8px 0" }}>
            Your Discount Code
          </Text>
          <Text style={{ fontSize: "28px", fontWeight: 700, color: t.accent, margin: "0 0 8px 0", fontFamily: "monospace" }}>
            {discountCode}
          </Text>
          <Text style={{ fontSize: "13px", color: t.text, margin: 0 }}>
            {discount}% off forever when paid tiers launch
          </Text>
        </Section>
      )}

      <Section
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <Text style={{ fontSize: "14px", fontWeight: 600, color: t.text, margin: "0 0 12px 0" }}>
          What traders who use Traverse say:
        </Text>
        <Text style={{ fontSize: "13px", color: t.textMuted, margin: "0 0 8px 0", lineHeight: "1.6", fontStyle: "italic" }}>
          &quot;I thought I was a disciplined trader until Traverse showed me I revenge-trade
          after every 3-loss streak. Seeing the pattern in data made it impossible to ignore.&quot;
        </Text>
        <Text style={{ fontSize: "13px", color: t.textMuted, margin: "0 0 8px 0", lineHeight: "1.6", fontStyle: "italic" }}>
          &quot;Nova told me something no trading course ever did: my best trades come on Tuesdays
          when I&apos;m calm, not Fridays when I&apos;m trying to end the week green.&quot;
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "24px" }}>
        <EmailButton href="https://traversejournal.com">
          {discountCode ? "Claim Your Spot" : "Start Tracking Free"}
        </EmailButton>
      </Section>

      <Text style={{ fontSize: "12px", color: t.textMuted, textAlign: "center" as const, lineHeight: "1.5" }}>
        This is the last email in this series. We hope the psychology insights
        were useful — whether you join Traverse or not, understanding your patterns
        will make you a better trader.
      </Text>

      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </BaseLayout>
  );
}

export default NurtureDay15;
