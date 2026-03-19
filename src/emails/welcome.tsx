import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

interface WelcomeEmailProps {
  name?: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  const t = THEMES.dark;
  const greeting = name ? `Welcome, ${name}.` : "Welcome to Traverse.";

  return (
    <BaseLayout theme="dark" preview="Your trading journal is ready.">
      <Section style={{ textAlign: "center" as const }}>
        <Heading
          as="h1"
          style={{
            fontSize: "36px",
            fontWeight: 600,
            color: t.text,
            margin: "0 0 16px 0",
            letterSpacing: "-0.02em",
          }}
        >
          {greeting}
        </Heading>

        <Text
          style={{
            fontSize: "16px",
            color: t.textMuted,
            margin: "0 0 32px 0",
            lineHeight: "1.6",
          }}
        >
          Your journal is ready. Start logging trades and let Traverse connect
          your psychology to your P&L.
        </Text>
      </Section>

      <Section
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "32px",
        }}
      >
        <Text
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: t.text,
            margin: "0 0 16px 0",
          }}
        >
          What you can do:
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: t.textMuted,
            margin: "0 0 8px 0",
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: t.accent }}>Track Every Trade</strong> — Log
          entries with emotion, conviction, and strategy tags.
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: t.textMuted,
            margin: "0 0 8px 0",
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: t.accent }}>Journal Your Process</strong> —
          Capture pre-trade plans and post-trade reflections.
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: t.textMuted,
            margin: "0 0 0 0",
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: t.accent }}>AI-Powered Insights</strong> — Let
          Nova analyze your patterns and blind spots.
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <EmailButton href="https://traversejournal.com/dashboard" theme="dark">
          Go to Dashboard
        </EmailButton>
      </Section>

      <EmailFooter theme="dark" />
    </BaseLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Ben",
} as WelcomeEmailProps;

export default WelcomeEmail;
