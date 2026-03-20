import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export interface LevelUpProps {
  newLevel: number;
  totalXp: number;
  unlockedFeature?: string;
  dashboardLink: string;
}

export function LevelUp({ newLevel, totalXp, unlockedFeature, dashboardLink }: LevelUpProps) {
  const t = THEMES.dark;

  return (
    <BaseLayout preview={`You just hit Level ${newLevel}!`}>
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Text style={{ fontSize: "48px", margin: "0 0 8px 0" }}>&#127942;</Text>
        <Heading
          as="h1"
          style={{ fontSize: "24px", fontWeight: 700, color: t.text, margin: "0 0 8px 0" }}
        >
          Level {newLevel} Unlocked!
        </Heading>
        <Text style={{ fontSize: "14px", color: t.textMuted, margin: 0 }}>
          You&apos;ve earned {totalXp.toLocaleString()} XP total. Keep going!
        </Text>
      </Section>

      <Section
        style={{
          background: t.accentBg,
          border: `1px solid ${t.accentBorder}`,
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center" as const,
          marginBottom: "24px",
        }}
      >
        <Text style={{ fontSize: "56px", fontWeight: 700, color: t.accent, margin: "0 0 4px 0" }}>
          {newLevel}
        </Text>
        <Text style={{ fontSize: "12px", color: t.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: 0 }}>
          Your Level
        </Text>
      </Section>

      {unlockedFeature && (
        <Section
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "16px 24px",
            marginBottom: "24px",
          }}
        >
          <Text style={{ fontSize: "12px", color: t.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 4px 0" }}>
            New Feature Unlocked
          </Text>
          <Text style={{ fontSize: "16px", fontWeight: 600, color: t.accent, margin: 0 }}>
            {unlockedFeature}
          </Text>
        </Section>
      )}

      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <EmailButton href={dashboardLink}>See What&apos;s New</EmailButton>
      </Section>

      <EmailFooter />
    </BaseLayout>
  );
}

export default LevelUp;
