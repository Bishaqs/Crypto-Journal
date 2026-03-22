import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export interface QuizInvitationProps {
  quizLink: string;
  tierName: string;
  position: number;
  unsubscribeUrl: string;
}

export function QuizInvitation({
  quizLink = "https://traversejournal.com/quiz?token=preview",
  tierName = "Founding 100",
  position = 42,
  unsubscribeUrl = "#",
}: QuizInvitationProps) {
  const t = THEMES.dark;

  return (
    <BaseLayout
      theme="dark"
      preview="Discover your trading psychology pattern — free 5-minute protocol"
    >
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Heading
          as="h1"
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: t.text,
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em",
          }}
        >
          What&apos;s Your Trading Psychology Pattern?
        </Heading>
        <Text
          style={{
            fontSize: "15px",
            color: t.textMuted,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          As {tierName} member #{position}, you get free access to our Trading
          Psychology Protocol — a 20-question assessment powered by Nova, our AI
          coach.
        </Text>
      </Section>

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
            fontSize: "15px",
            fontWeight: 600,
            color: t.text,
            margin: "0 0 12px 0",
          }}
        >
          What you&apos;ll discover:
        </Text>
        {[
          "Your trading archetype — which of 8 psychology profiles fits you",
          "Your hidden blind spots — the patterns costing you money",
          "Your personalized protocol — 3 AI-generated techniques to improve immediately",
          "Your Trading Card — a shareable visual of your psychology profile",
        ].map((item, i) => (
          <Text
            key={i}
            style={{
              fontSize: "13px",
              color: t.textMuted,
              margin: "0 0 8px 0",
              lineHeight: "1.5",
              paddingLeft: "16px",
            }}
          >
            &#10003; {item}
          </Text>
        ))}
      </Section>

      <Section
        style={{
          background: "rgba(103,232,249,0.05)",
          border: `1px solid ${t.accentBorder}`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontSize: "14px",
            color: t.textMuted,
            margin: "0 0 16px 0",
          }}
        >
          Takes about 5 minutes. Your results are analyzed by Nova AI and
          delivered as a personalized 3-slide protocol within 24 hours.
        </Text>
        <EmailButton href={quizLink} theme="dark">
          Take the Quiz
        </EmailButton>
      </Section>

      <EmailFooter theme="dark" unsubscribeUrl={unsubscribeUrl} />
    </BaseLayout>
  );
}

QuizInvitation.PreviewProps = {
  quizLink: "https://traversejournal.com/quiz?token=preview",
  tierName: "Founding 100",
  position: 42,
  unsubscribeUrl: "#",
} as QuizInvitationProps;

export default QuizInvitation;
