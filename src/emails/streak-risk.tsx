import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export interface StreakRiskProps {
  currentStreak: number;
  dashboardLink: string;
}

export function StreakRisk({ currentStreak, dashboardLink }: StreakRiskProps) {
  const t = THEMES.dark;

  return (
    <BaseLayout preview={`Your ${currentStreak}-day streak is at risk!`}>
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Text style={{ fontSize: "48px", margin: "0 0 8px 0" }}>&#128293;</Text>
        <Heading
          as="h1"
          style={{ fontSize: "24px", fontWeight: 700, color: t.text, margin: "0 0 8px 0" }}
        >
          Your {currentStreak}-day streak is at risk!
        </Heading>
        <Text style={{ fontSize: "14px", color: t.textMuted, margin: 0 }}>
          Don&apos;t let it break. Log a trade or journal entry today to keep it alive.
        </Text>
      </Section>

      <Section
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center" as const,
          marginBottom: "24px",
        }}
      >
        <Text style={{ fontSize: "48px", fontWeight: 700, color: t.accent, margin: "0 0 4px 0" }}>
          {currentStreak}
        </Text>
        <Text style={{ fontSize: "12px", color: t.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: 0 }}>
          Day Streak
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <EmailButton href={dashboardLink}>Open Traverse</EmailButton>
      </Section>

      <Text style={{ fontSize: "12px", color: t.textMuted, textAlign: "center" as const }}>
        Every day you show up is a day you get better. Your future self will thank you.
      </Text>

      <EmailFooter />
    </BaseLayout>
  );
}

export default StreakRisk;
