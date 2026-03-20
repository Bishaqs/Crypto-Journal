import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export interface TrialExpiredProps {
  trialTier: string;
  pricingLink: string;
}

export function TrialExpired({ trialTier, pricingLink }: TrialExpiredProps) {
  const t = THEMES.dark;

  return (
    <BaseLayout preview="Your free trial has ended — upgrade to keep your features">
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Text style={{ fontSize: "48px", margin: "0 0 8px 0" }}>&#9200;</Text>
        <Heading
          as="h1"
          style={{ fontSize: "24px", fontWeight: 700, color: t.text, margin: "0 0 8px 0" }}
        >
          Your {trialTier} Trial Has Ended
        </Heading>
        <Text style={{ fontSize: "14px", color: t.textMuted, margin: 0 }}>
          Your 14-day free trial of {trialTier} features has expired. Upgrade to keep access.
        </Text>
      </Section>

      <Section
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <Text style={{ fontSize: "14px", fontWeight: 600, color: t.text, margin: "0 0 12px 0" }}>
          What you&apos;ll lose without upgrading:
        </Text>
        <Text style={{ fontSize: "13px", color: t.textMuted, margin: "0 0 6px 0" }}>
          &#10060; Unlimited Nova AI coaching sessions
        </Text>
        <Text style={{ fontSize: "13px", color: t.textMuted, margin: "0 0 6px 0" }}>
          &#10060; Psychology analytics &amp; correlation engine
        </Text>
        <Text style={{ fontSize: "13px", color: t.textMuted, margin: "0 0 6px 0" }}>
          &#10060; Advanced performance metrics
        </Text>
        <Text style={{ fontSize: "13px", color: t.textMuted, margin: "0 0 6px 0" }}>
          &#10060; Voice journaling &amp; weekly reports
        </Text>
        <Text style={{ fontSize: "13px", color: t.textMuted, margin: 0 }}>
          &#10060; Premium themes &amp; broker sync
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "24px" }}>
        <EmailButton href={pricingLink}>Upgrade Now</EmailButton>
      </Section>

      <Text style={{ fontSize: "12px", color: t.textMuted, textAlign: "center" as const }}>
        Your data is safe. Upgrade anytime to pick up where you left off.
      </Text>

      <EmailFooter />
    </BaseLayout>
  );
}

export default TrialExpired;
