import { Heading, Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export interface ProtocolDeliveryProps {
  protocolLink: string;
  cardImageUrl: string;
  archetypeName: string;
  slideTitles: string[];
  unsubscribeToken: string;
}

export function ProtocolDelivery({
  protocolLink = "https://traversejournal.com/quiz/results?id=preview&token=preview",
  cardImageUrl = "https://traversejournal.com/api/quiz/card/preview",
  archetypeName = "Adaptive Analyst",
  slideTitles = ["Your Pattern", "Your Hidden Costs", "Your Protocol"],
  unsubscribeToken = "preview",
}: ProtocolDeliveryProps) {
  const t = THEMES.dark;
  const unsubscribeUrl = `https://traversejournal.com/api/email/unsubscribe?token=${unsubscribeToken}`;

  return (
    <BaseLayout
      theme="dark"
      preview={`Your personalized Trading Psychology Protocol is ready — ${archetypeName}`}
    >
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Heading
          as="h1"
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: t.text,
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Your Protocol is Ready
        </Heading>
        <Text
          style={{
            fontSize: "15px",
            color: t.textMuted,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Nova has analyzed your trading psychology and generated a personalized
          3-slide protocol for the <strong style={{ color: t.accent }}>{archetypeName}</strong>.
        </Text>
      </Section>

      {/* Trading Card Preview */}
      <Section style={{ textAlign: "center" as const, marginBottom: "24px" }}>
        <Img
          src={cardImageUrl}
          alt={`${archetypeName} Trading Card`}
          width="540"
          style={{
            maxWidth: "100%",
            borderRadius: "12px",
            border: `1px solid ${t.border}`,
          }}
        />
      </Section>

      {/* Slide Preview */}
      <Section
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          textAlign: "left" as const,
        }}
      >
        <Text
          style={{
            fontSize: "13px",
            color: t.textMuted,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            margin: "0 0 16px 0",
          }}
        >
          Your 3-slide protocol
        </Text>
        {slideTitles.map((title, i) => (
          <Text
            key={i}
            style={{
              fontSize: "14px",
              color: t.text,
              margin: "0 0 8px 0",
              lineHeight: "1.5",
              paddingLeft: "8px",
              borderLeft: `2px solid ${t.accent}`,
            }}
          >
            <span style={{ color: t.accent, fontWeight: 600 }}>Slide {i + 1}:</span>{" "}
            {title}
          </Text>
        ))}
      </Section>

      {/* CTA */}
      <Section
        style={{
          textAlign: "center" as const,
          marginBottom: "24px",
        }}
      >
        <EmailButton href={protocolLink} theme="dark">
          View Your Full Protocol
        </EmailButton>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Text
          style={{
            fontSize: "13px",
            color: t.textMuted,
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          Share your archetype with friends — your trading card is at the end of
          the protocol.
        </Text>
      </Section>

      <EmailFooter theme="dark" unsubscribeUrl={unsubscribeUrl} />
    </BaseLayout>
  );
}

ProtocolDelivery.PreviewProps = {
  protocolLink: "https://traversejournal.com/quiz/results?id=preview&token=preview",
  cardImageUrl: "https://traversejournal.com/api/quiz/card/preview",
  archetypeName: "Adaptive Analyst",
  slideTitles: ["Your Pattern: Adaptive Analyst", "Your Hidden Costs", "Your Protocol"],
  unsubscribeToken: "preview",
} as ProtocolDeliveryProps;

export default ProtocolDelivery;
