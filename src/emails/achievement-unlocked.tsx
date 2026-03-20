import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export interface AchievementUnlockedProps {
  achievementName: string;
  achievementDescription: string;
  xpEarned: number;
  dashboardLink: string;
}

export function AchievementUnlocked({ achievementName, achievementDescription, xpEarned, dashboardLink }: AchievementUnlockedProps) {
  const t = THEMES.dark;

  return (
    <BaseLayout preview={`Achievement Unlocked: ${achievementName}`}>
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Text style={{ fontSize: "48px", margin: "0 0 8px 0" }}>&#127881;</Text>
        <Heading
          as="h1"
          style={{ fontSize: "24px", fontWeight: 700, color: t.text, margin: "0 0 8px 0" }}
        >
          Achievement Unlocked!
        </Heading>
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
        <Text style={{ fontSize: "20px", fontWeight: 700, color: t.accent, margin: "0 0 8px 0" }}>
          {achievementName}
        </Text>
        <Text style={{ fontSize: "14px", color: t.textMuted, margin: "0 0 12px 0" }}>
          {achievementDescription}
        </Text>
        <Text style={{ fontSize: "14px", fontWeight: 600, color: t.accent, margin: 0 }}>
          +{xpEarned} XP
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <EmailButton href={dashboardLink}>View Achievements</EmailButton>
      </Section>

      <EmailFooter />
    </BaseLayout>
  );
}

export default AchievementUnlocked;
